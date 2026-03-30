#!/usr/bin/env python3
"""
Genere apps/web/src/data/zones_cp.ts a partir de sources de reference.

Sources :
- Excel FRR / FRR+ (communes classees)
- JSON de correspondance INSEE -> code postal
- Jeu QPV 2024 officiel (data.gouv / Opendatasoft)

Usage:
  python3 scripts/generate_zones_cp.py \
    --frr-xlsx "/mnt/c/Users/.../Liste communes FRR_juillet2025.xlsx" \
    --insee-postal-json "/mnt/c/Users/.../correspondance-code-insee-code-postal.json" \
    --output "/home/.../apps/web/src/data/zones_cp.ts"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from pathlib import Path


QPV_URL = (
    "https://data.iledefrance.fr/api/explore/v2.1/"
    "catalog/datasets/qp-politiquedelaville-shp/exports/json"
)

ZONE_PRIORITY = {"QPV": 1, "ZFRR": 2, "ZFRR_PLUS": 3}


def normalize_text(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value or "")
    without_accents = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", without_accents.strip().lower())


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--frr-xlsx", required=True)
    parser.add_argument("--insee-postal-json", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
      root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
      return []
    ns = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    values: list[str] = []
    for si in root.findall("a:si", ns):
        text = "".join(node.text or "" for node in si.findall(".//a:t", ns))
        values.append(text)
    return values


def read_first_sheet_rows(path: Path) -> list[list[str]]:
    with zipfile.ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        shared_strings = read_shared_strings(archive)

        ns_main = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        ns_rel = {"r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
        ns_pkg = {"a": "http://schemas.openxmlformats.org/package/2006/relationships"}

        first_sheet = workbook.find("a:sheets/a:sheet", ns_main)
        if first_sheet is None:
            raise RuntimeError("Aucune feuille trouvee dans l'Excel.")
        rel_id = first_sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        target = None
        for rel in rels.findall("a:Relationship", ns_pkg):
            if rel.attrib.get("Id") == rel_id:
                target = rel.attrib["Target"]
                break
        if not target:
            raise RuntimeError("Impossible de resoudre la premiere feuille Excel.")

        sheet_root = ET.fromstring(archive.read(f"xl/{target}"))
        rows: list[list[str]] = []
        for row in sheet_root.findall(".//a:sheetData/a:row", ns_main):
            values: list[str] = []
            for cell in row.findall("a:c", ns_main):
                cell_type = cell.attrib.get("t")
                value_node = cell.find("a:v", ns_main)
                if value_node is None:
                    values.append("")
                    continue
                raw = value_node.text or ""
                if cell_type == "s":
                    values.append(shared_strings[int(raw)])
                else:
                    values.append(raw)
            rows.append(values)
        return rows


def load_frr_zones(xlsx_path: Path) -> dict[str, str]:
    rows = read_first_sheet_rows(xlsx_path)
    if not rows:
        raise RuntimeError("Excel FRR vide.")

    header = rows[0]
    try:
        idx_insee = header.index("Code_insee")
        idx_status = header.index("Classement FRR et FRR+ au 10 juillet 2025")
    except ValueError as exc:
        raise RuntimeError(f"Colonnes attendues introuvables dans l'Excel FRR: {exc}") from exc

    by_insee: dict[str, str] = {}
    for row in rows[1:]:
        if len(row) <= max(idx_insee, idx_status):
            continue
        insee = (row[idx_insee] or "").strip().zfill(5)
        status = normalize_text(row[idx_status])
        if not insee:
            continue
        if status == "frr+":
            by_insee[insee] = "ZFRR_PLUS"
        elif status in {"frr socle", "frr beneficiaire"}:
            by_insee[insee] = "ZFRR"
        else:
            # Les classements partiels sont exclus pour limiter les faux positifs
            continue
    return by_insee


def load_insee_postal_records(json_path: Path) -> list[dict[str, str]]:
    with json_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise RuntimeError("Le JSON INSEE -> code postal ne contient pas une liste.")
    return data


def fetch_qpv_insee_codes() -> set[str]:
    with urllib.request.urlopen(QPV_URL) as response:
        payload = json.load(response)
    insee_codes: set[str] = set()
    for row in payload:
        raw = str(row.get("insee_com", "")).strip()
        for item in raw.split(","):
            code = item.strip()
            if re.fullmatch(r"\d{5}", code):
                insee_codes.add(code)
    return insee_codes


def apply_zone(mapping: dict[str, str], postal_code: str, zone: str) -> None:
    existing = mapping.get(postal_code)
    if existing is None or ZONE_PRIORITY[zone] > ZONE_PRIORITY[existing]:
        mapping[postal_code] = zone


def build_postal_zones(
    frr_by_insee: dict[str, str],
    insee_postal_records: list[dict[str, str]],
    qpv_insee_codes: set[str],
) -> dict[str, str]:
    postal_zones: dict[str, str] = {}

    for row in insee_postal_records:
        insee = str(row.get("insee_com", "")).strip().zfill(5)
        postal_code = str(row.get("postal_code", "")).strip()
        if not re.fullmatch(r"\d{5}", postal_code):
            continue

        frr_zone = frr_by_insee.get(insee)
        if frr_zone:
            apply_zone(postal_zones, postal_code, frr_zone)

        if insee in qpv_insee_codes:
            apply_zone(postal_zones, postal_code, "QPV")

    return dict(sorted(postal_zones.items()))


def render_typescript(mapping: dict[str, str], counts: Counter[str]) -> str:
    lines = [
        'import type { OptionExonerationZone } from "@wymby/types";',
        "",
        "/**",
        " * Table statique de resolution code postal -> zonage fiscal.",
        " *",
        " * Generee a partir de :",
        " * - l'Excel FRR / FRR+ de reference utilisateur (communes classees au 10 juillet 2025)",
        " * - la correspondance exhaustive INSEE -> code postal",
        " * - le jeu officiel 2024 des quartiers prioritaires de la politique de la ville (QPV)",
        " *",
        " * Hypotheses de V1 :",
        " * - FRR+ -> ZFRR_PLUS",
        " * - FRR socle et FRR beneficiaire -> ZFRR",
        " * - les classements FRR partiels sont exclus pour eviter les faux positifs",
        " * - QPV est approxime au niveau code postal via les communes portant un ou plusieurs QPV,",
        " *   ce qui peut sur-detecter certaines communes multi-quartiers ou multi-codes postaux",
        " * - en cas de conflit, priorite : ZFRR_PLUS > ZFRR > QPV",
        " *",
        f" * Repartition actuelle : ZFRR_PLUS={counts.get('ZFRR_PLUS', 0)}, "
        f"ZFRR={counts.get('ZFRR', 0)}, QPV={counts.get('QPV', 0)}.",
        " */",
        'export const ZONES_PAR_CODE_POSTAL: Record<string, "ZFRR" | "ZFRR_PLUS" | "QPV"> = {',
    ]

    for postal_code, zone in mapping.items():
        lines.append(f'  "{postal_code}": "{zone}",')

    lines.extend(
        [
            "};",
            "",
            'export function resolveZoneFromCodePostal(cp: string): OptionExonerationZone | "aucune" {',
            '  if (!cp || cp.length !== 5) return "aucune";',
            '  return ZONES_PAR_CODE_POSTAL[cp] ?? "aucune";',
            "}",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    xlsx_path = Path(args.frr_xlsx)
    json_path = Path(args.insee_postal_json)
    output_path = Path(args.output)

    if not xlsx_path.exists():
        raise SystemExit(f"Excel FRR introuvable: {xlsx_path}")
    if not json_path.exists():
        raise SystemExit(f"JSON INSEE -> code postal introuvable: {json_path}")

    frr_by_insee = load_frr_zones(xlsx_path)
    insee_postal_records = load_insee_postal_records(json_path)
    qpv_insee_codes = fetch_qpv_insee_codes()
    mapping = build_postal_zones(frr_by_insee, insee_postal_records, qpv_insee_codes)
    counts: Counter[str] = Counter(mapping.values())

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_typescript(mapping, counts), encoding="utf-8")

    print(
        "Generated",
        output_path,
        f"with {len(mapping)} postal codes",
        f"(ZFRR_PLUS={counts.get('ZFRR_PLUS', 0)}, ZFRR={counts.get('ZFRR', 0)}, QPV={counts.get('QPV', 0)})",
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
