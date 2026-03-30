/**
 * scenarios/registry.ts — Registre des scénarios de base
 *
 * Définit les métadonnées de chaque scénario (segment, type fiscal/social,
 * options disponibles, complexité administrative).
 */
import type { BaseScenarioId, SegmentActivite } from "@wymby/types";
export type RegimeFiscalType = "micro" | "reel_ir" | "reel_is" | "is_societe";
export type RegimeSocialType = "micro_me" | "tns_reel" | "assimile_salarie";
export interface ScenarioMeta {
    id: BaseScenarioId;
    label: string;
    code_wyum: string;
    segment: SegmentActivite;
    regime_fiscal: RegimeFiscalType;
    regime_social: RegimeSocialType;
    /** Options TVA disponibles pour ce scénario */
    options_tva: Array<"TVA_FRANCHISE" | "TVA_COLLECTEE">;
    /** VFL disponible pour ce scénario */
    vfl_disponible: boolean;
    /** Score de complexité administrative (1–5, croissant) */
    score_complexite: number;
    /** ZFRR compatible (régime réel obligatoire pour ZFRR) */
    zfrr_compatible: boolean;
    description: string;
}
/** Registre complet des scénarios Segment 1 — Généralistes (C01–C20) */
export declare const SCENARIO_REGISTRY: Record<BaseScenarioId, ScenarioMeta>;
/** Retourne les scénarios disponibles pour un segment donné */
export declare function getScenariosForSegment(segment: SegmentActivite): ScenarioMeta[];
//# sourceMappingURL=registry.d.ts.map