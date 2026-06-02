// src/components/tracking/MissionTimeline.jsx
// ─────────────────────────────────────────────────────────
// Suivi de mission — basé UNIQUEMENT sur les vrais statuts en base
// (requests.status + requests.devis_accepted). Aucune dépendance GPS.
//
// Deux exports :
//   • MissionTimeline (défaut) — frise verticale complète (écran de suivi)
//   • MissionProgress          — mini-barre compacte (cartes Mes demandes)
//
// Cycle de vie réel :
//   pending                          → "Demande envoyée"
//   in_progress & devis_accepted=NO  → "Acceptée par le pro"
//   in_progress & devis_accepted=YES → "Travail en cours"
//   completed                        → "Mission terminée"
//   declined                         → état terminal "Refusée"
// ─────────────────────────────────────────────────────────

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "../ui/Icon";
import { colors, fonts, radius } from "../../theme";

// ── Étapes du parcours ───────────────────────────────────
// 4 étapes = 4 états réels en base (aucune étape fantôme/sautée).
export const STAGES = [
  { key: "sent",     label: "Demande envoyée",     sub: "Le pro a bien reçu ta demande.",          icon: "paper-plane" },
  { key: "accepted", label: "Acceptée par le pro", sub: "Le pro a accepté — vous discutez du devis.", icon: "check-circle" },
  { key: "progress", label: "Travail en cours",    sub: "Devis validé — la prestation est en cours.", icon: "wrench" },
  { key: "done",     label: "Mission terminée",    sub: "Prestation terminée — pense à noter !",   icon: "award" },
];

// Convertit (status, devisAccepted) en index d'étape courante (0 → 3)
export function getStage(status, devisAccepted) {
  if (status === "completed") return 3;
  if (status === "in_progress") return devisAccepted ? 2 : 1;
  return 0; // pending (ou inconnu) → en attente d'acceptation
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ── Frise verticale complète ─────────────────────────────
export default function MissionTimeline({ status, devisAccepted, timestamps = {} }) {
  if (status === "declined") {
    return (
      <View style={styles.declinedBox}>
        <View style={styles.declinedIcon}>
          <Icon name="x-circle" size={22} color={colors.error} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.declinedTitle}>Demande refusée</Text>
          <Text style={styles.declinedSub}>
            Le pro n'a pas pu accepter cette demande. Tu peux contacter un autre prestataire.
          </Text>
        </View>
      </View>
    );
  }

  const current = getStage(status, devisAccepted);
  const lastIndex = STAGES.length - 1;
  const timeFor = { 0: timestamps.sent, [lastIndex]: timestamps.done };

  return (
    <View>
      {STAGES.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        const isLast = i === STAGES.length - 1;
        const t = formatTime(timeFor[i]);

        return (
          <View key={step.key} style={styles.row}>
            {/* Colonne indicateur (point + ligne) */}
            <View style={styles.indicator}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done && <Icon name="check" size={11} color={colors.textInverse} />}
              </View>
              {!isLast && <View style={[styles.line, i < current && styles.lineDone]} />}
            </View>

            {/* Contenu */}
            <View style={[styles.content, isLast && { paddingBottom: 4 }]}>
              <View style={styles.contentHead}>
                <Icon name={step.icon} size={15} color={done ? colors.primary : colors.ink300} />
                <Text style={[styles.label, done && styles.labelDone, active && styles.labelActive]}>
                  {step.label}
                </Text>
                {active && (
                  <View style={styles.nowPill}>
                    <Text style={styles.nowPillText}>en cours</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.sub, active && styles.subActive]}>{step.sub}</Text>
              {!!t && <Text style={styles.time}>{t}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Mini-barre compacte (cartes) ─────────────────────────
export function MissionProgress({ status, devisAccepted, style }) {
  const segCount = STAGES.length - 1; // segments entre les étapes

  if (status === "declined") {
    return (
      <View style={[styles.compactWrap, style]}>
        <View style={styles.compactHead}>
          <Text style={[styles.compactLabel, { color: colors.error }]}>Demande refusée</Text>
        </View>
        <View style={styles.segments}>
          {Array.from({ length: segCount }).map((_, i) => (
            <View key={i} style={[styles.segment, { backgroundColor: colors.errorLight }]} />
          ))}
        </View>
      </View>
    );
  }

  const current = getStage(status, devisAccepted);
  const isDone = current === STAGES.length - 1;

  return (
    <View style={[styles.compactWrap, style]}>
      <View style={styles.compactHead}>
        <Text style={[styles.compactLabel, isDone && { color: colors.primary }]} numberOfLines={1}>
          {STAGES[current].label}
        </Text>
        <Text style={styles.compactStep}>
          {isDone ? "Terminée" : `Étape ${current + 1}/${STAGES.length}`}
        </Text>
      </View>
      <View style={styles.segments}>
        {Array.from({ length: segCount }).map((_, i) => (
          <View key={i} style={[styles.segment, i < current && styles.segmentDone]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Frise verticale ──
  row: { flexDirection: "row", alignItems: "flex-start" },
  indicator: { alignItems: "center", width: 24, marginRight: 12 },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.ink100, backgroundColor: colors.card,
    alignItems: "center", justifyContent: "center",
  },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotActive: { borderColor: colors.primary, borderWidth: 3 },
  line: { width: 2, flex: 1, minHeight: 26, backgroundColor: colors.ink100, marginVertical: 2 },
  lineDone: { backgroundColor: colors.primary },

  content: { flex: 1, paddingBottom: 22 },
  contentHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  label: { fontSize: 14, fontFamily: fonts.medium, color: colors.ink300, flexShrink: 1 },
  labelDone: { color: colors.ink700 },
  labelActive: { color: colors.ink900, fontFamily: fonts.bold },
  nowPill: {
    backgroundColor: colors.primarySoft, borderRadius: radius.full,
    paddingVertical: 2, paddingHorizontal: 8,
  },
  nowPillText: { fontSize: 10, fontFamily: fonts.bold, color: colors.primaryDark },
  sub: { fontSize: 12, color: colors.ink300, marginTop: 2, marginLeft: 22 },
  subActive: { color: colors.ink500 },
  time: { fontSize: 11, color: colors.ink300, marginTop: 3, marginLeft: 22, fontFamily: fonts.medium },

  // ── État refusé ──
  declinedBox: {
    flexDirection: "row", gap: 12, alignItems: "center",
    backgroundColor: colors.errorLight, borderRadius: radius.lg,
    padding: 14, borderWidth: 1, borderColor: colors.errorBorder,
  },
  declinedIcon: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.errorSoft, alignItems: "center", justifyContent: "center",
  },
  declinedTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.error },
  declinedSub: { fontSize: 12, color: colors.ink700, marginTop: 2, lineHeight: 17 },

  // ── Mini-barre compacte ──
  compactWrap: { gap: 6 },
  compactHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  compactLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.ink700, flex: 1 },
  compactStep: { fontSize: 11, fontFamily: fonts.bold, color: colors.ink500 },
  segments: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.ink100 },
  segmentDone: { backgroundColor: colors.primary },
});
