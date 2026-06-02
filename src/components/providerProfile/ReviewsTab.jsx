// src/components/providerProfile/ReviewsTab.jsx
//
// Onglet "Avis" du profil public prestataire (§15).
//
// Props :
//   provider    — données agrégées du prestataire (rating, reviewCount, ratingDistribution)
//   reviews     — tableau d'avis chargé depuis la table reviews (via useReviews dans le parent)
//   canReview   — true si le client connecté peut noter ce prestataire
//   onRate      — callback pour ouvrir RatingModal

import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import MenuSection from "../clientProfile/MenuSection";
import Icon from "../ui/Icon";
import { colors, fonts } from "../../theme";

// Extrait la note globale depuis un objet rating ou un nombre brut
function getGlobalRating(provider) {
  if (typeof provider?.rating === "object") return provider.rating?.global ?? 0;
  return provider?.rating ?? 0;
}

// ─── Barre de progression pour les critères détaillés ────────────────────────
function CriteriaBar({ label, icon, value }) {
  const pct = Math.min(Math.max((value / 5) * 100, 0), 100);
  return (
    <View style={styles.criteriaRow}>
      <Icon name={icon} size={14} color={colors.primary} weight="duotone" />
      <Text style={styles.criteriaLabel}>{label}</Text>
      <View style={styles.criteriaBarBg}>
        <View style={[styles.criteriaBarFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.criteriaVal}>{value > 0 ? value.toFixed(1) : "–"}</Text>
    </View>
  );
}

const CRITERIA = [
  { key: "punctuality",   label: "Ponctualité",           icon: "timer" },
  { key: "quality",       label: "Qualité du travail",     icon: "wrench" },
  { key: "communication", label: "Communication",          icon: "chat-circle" },
  { key: "valueForMoney", label: "Rapport qualité/prix",   icon: "hand-coins" },
];

// ─── Carte d'un avis individuel ───────────────────────────────────────────────
function ReviewItem({ review, isLast, isOwnProfile, onReply }) {
  const [replying,   setReplying]   = useState(false);
  const [replyText,  setReplyText]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!replyText.trim() || !onReply) return;
    setSubmitting(true);
    const result = await onReply(review.id, replyText.trim());
    setSubmitting(false);
    if (result?.success) {
      setReplying(false);
      setReplyText("");
    }
  };

  return (
    <View style={[styles.review, isLast && styles.reviewLast]}>
      <View style={styles.reviewTop}>
        <Text style={styles.reviewName}>{review.authorName}</Text>
        <Text style={styles.reviewDate}>{review.date}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 2, marginBottom: 5 }}>
        {Array.from({ length: Math.min(review.rating || 0, 5) }).map((_, i) => (
          <Icon key={i} name="star" size={12} color={colors.mango} weight="fill" />
        ))}
      </View>
      {review.comment ? (
        <Text style={styles.reviewText}>{review.comment}</Text>
      ) : null}

      {/* Réponse existante du pro */}
      {review.providerReply ? (
        <View style={styles.replyBlock}>
          <Text style={styles.replyLabel}>Réponse du pro</Text>
          <Text style={styles.replyText}>{review.providerReply}</Text>
        </View>
      ) : isOwnProfile ? (
        replying ? (
          <View style={styles.replyForm}>
            <TextInput
              style={styles.replyInput}
              placeholder="Ta réponse publique…"
              placeholderTextColor={colors.ink100}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              autoFocus
            />
            <View style={styles.replyBtns}>
              <TouchableOpacity onPress={() => { setReplying(false); setReplyText(""); }}>
                <Text style={styles.replyCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.replySubmitBtn, (submitting || !replyText.trim()) && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={submitting || !replyText.trim()}
              >
                <Text style={styles.replySubmitText}>{submitting ? "Envoi…" : "Publier"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.replyOpenBtn} onPress={() => setReplying(true)}>
            <Icon name="return-down-forward-outline" size={13} color={colors.primary} />
            <Text style={styles.replyOpenText}>Répondre</Text>
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ReviewsTab({ provider, reviews = [], canReview = false, onRate, isOwnProfile = false, replyToReview }) {
  const globalRating  = getGlobalRating(provider);
  const reviewCount   = provider?.reviewCount || 0;
  const ratingObj     = typeof provider?.rating === "object" ? provider.rating : {};
  // Distribution des étoiles (stockée dans providers.ratingDistribution, mise à jour par trigger)
  const distribution  = provider?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <View style={styles.container}>
      {/* ── Carte "Laisser un avis" — visible seulement si canReview ── */}
      {canReview && (
        <TouchableOpacity style={styles.rateCard} onPress={onRate} activeOpacity={0.85}>
          <View style={styles.rateCardLeft}>
            <Text style={styles.rateCardTitle}>Tu as fait appel à ce pro</Text>
            <Text style={styles.rateCardSub}>Partage ton expérience pour aider la communauté</Text>
          </View>
          <View style={styles.rateCardBtn}>
            <Icon name="star-outline" size={18} color={colors.textInverse} />
            <Text style={styles.rateCardBtnText}>Noter</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Résumé global ── */}
      <MenuSection title="Résumé des avis">
        <View style={styles.summary}>
          {/* Grande note à gauche */}
          <View style={styles.bigNote}>
            <Text style={styles.bigVal}>
              {globalRating > 0 ? globalRating.toFixed(1) : "–"}
            </Text>
            <View style={{ flexDirection: "row", gap: 2, marginTop: 3 }}>
              {Array.from({ length: Math.round(globalRating) }).map((_, i) => (
                <Icon key={i} name="star" size={12} color={colors.mango} weight="fill" />
              ))}
            </View>
            <Text style={styles.bigCount}>{reviewCount} avis</Text>
          </View>
          {/* Barres de distribution à droite */}
          <View style={styles.bars}>
            {[5, 4, 3, 2, 1].map((star) => (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barNum}>{star}</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${distribution[star] || 0}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </MenuSection>

      {/* ── Critères détaillés ── */}
      <MenuSection title="Notes par critère">
        <View style={styles.criteriaBlock}>
          {CRITERIA.map((c) => (
            <CriteriaBar
              key={c.key}
              label={c.label}
              icon={c.icon}
              value={ratingObj[c.key] ?? 0}
            />
          ))}
        </View>
      </MenuSection>

      {/* ── Liste des avis depuis la table reviews ── */}
      <MenuSection title={`Avis clients (${reviews.length})`}>
        {reviews.length > 0 ? (
          reviews.map((review, i) => (
            <ReviewItem
              key={review.id || `${review.authorName}-${i}`}
              review={review}
              isLast={i === reviews.length - 1}
              isOwnProfile={isOwnProfile}
              onReply={replyToReview}
            />
          ))
        ) : (
          <View style={styles.emptyReviews}>
            <Icon name="star" size={36} color={colors.ink100} weight="duotone" />
            <Text style={styles.emptyText}>Pas encore d'avis</Text>
            <Text style={styles.emptySubtext}>
              Les avis apparaîtront ici après chaque mission terminée.
            </Text>
          </View>
        )}
      </MenuSection>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { paddingBottom: 10 },

  // Carte "Laisser un avis" en haut du tab
  rateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 12,
    marginBottom: 4,
    padding: 14,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  rateCardLeft: { flex: 1, gap: 3 },
  rateCardTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.textInverse },
  rateCardSub:   { fontSize: 11, fontFamily: fonts.medium, color: "rgba(255,255,255,0.75)", lineHeight: 16 },
  rateCardBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
  },
  rateCardBtnText: { fontSize: 13, fontFamily: fonts.bold, color: colors.textInverse },

  // Résumé global
  summary: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  bigNote:  { alignItems: "center", minWidth: 64 },
  bigVal:   { fontSize: 36, fontFamily: fonts.extraBold, color: colors.ink900, lineHeight: 40 },
  bigStars: { fontSize: 12, marginTop: 3 },
  bigCount: { fontSize: 10, fontFamily: fonts.medium, color: colors.ink500, marginTop: 2 },

  // Barres de distribution étoiles
  bars:   { flex: 1, gap: 5 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barNum: { fontSize: 10, fontFamily: fonts.medium, color: colors.ink500, width: 8, textAlign: "right" },
  barBg:  { flex: 1, height: 5, backgroundColor: colors.ink50, borderRadius: 3, overflow: "hidden" },
  barFill:{ height: 5, backgroundColor: colors.mango, borderRadius: 3 },

  // Critères
  criteriaBlock: { paddingHorizontal: 14, paddingBottom: 14, gap: 12 },
  criteriaRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  criteriaIcon:  { fontSize: 14, width: 20, textAlign: "center" },
  criteriaLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500, flex: 1 },
  criteriaBarBg: { width: 80, height: 5, backgroundColor: colors.ink50, borderRadius: 3, overflow: "hidden" },
  criteriaBarFill:{ height: 5, backgroundColor: colors.primary, borderRadius: 3 },
  criteriaVal:   { fontSize: 11, fontFamily: fonts.bold, color: colors.primary, width: 28, textAlign: "right" },

  // Items d'avis
  review: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: colors.borderLight,
  },
  reviewLast: { borderBottomWidth: 0, paddingBottom: 14 },
  reviewTop:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  reviewName: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink900 },
  reviewDate: { fontSize: 10, fontFamily: fonts.medium, color: colors.ink300 },
  reviewStars:{ fontSize: 11, marginBottom: 5 },
  reviewText: { fontSize: 12, fontFamily: fonts.regular, color: colors.ink500, lineHeight: 18 },

  // État vide
  emptyReviews: { alignItems: "center", paddingVertical: 24, gap: 8, paddingHorizontal: 20 },
  emptyIcon:    { fontSize: 36 },
  emptyText:    { fontSize: 14, fontFamily: fonts.bold, color: colors.ink700 },
  emptySubtext: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink300, textAlign: "center" },

  // Réponse du pro — affichage
  replyBlock: {
    marginTop: 8, backgroundColor: colors.primarySoft, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, gap: 3,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  replyLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.primary, textTransform: "uppercase" },
  replyText:  { fontSize: 12, fontFamily: fonts.regular, color: colors.ink700, lineHeight: 18 },

  // Bouton "Répondre"
  replyOpenBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 8, alignSelf: "flex-start",
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 8, borderWidth: 1, borderColor: colors.primary,
  },
  replyOpenText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.primary },

  // Formulaire de réponse inline
  replyForm: { marginTop: 8, gap: 8 },
  replyInput: {
    borderWidth: 1.5, borderColor: colors.borderLight, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
    fontSize: 13, fontFamily: fonts.regular, color: colors.ink900, maxHeight: 80,
    backgroundColor: colors.ink50,
  },
  replyBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 12, alignItems: "center" },
  replyCancelText: { fontSize: 13, fontFamily: fonts.medium, color: colors.ink300 },
  replySubmitBtn: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  replySubmitText: { fontSize: 13, fontFamily: fonts.bold, color: colors.textInverse },
});
