// src/components/providerProfile/ReviewsTab.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

function ReviewItem({ review, isLast }) {
  return (
    <View style={[styles.review, isLast && styles.reviewLast]}>
      <View style={styles.reviewTop}>
        <Text style={styles.reviewName}>{review.authorName}</Text>
        <Text style={styles.reviewDate}>{review.date}</Text>
      </View>
      <Text style={styles.reviewStars}>{"⭐".repeat(review.rating)}</Text>
      <Text style={styles.reviewText}>{review.comment}</Text>
    </View>
  );
}

export default function ReviewsTab({ provider }) {
  const rating = provider?.rating || 0;
  const reviewCount = provider?.reviewCount || 0;
  const reviews = provider?.reviews || [];
  const distribution = provider?.ratingDistribution || {
    5: 75,
    4: 18,
    3: 5,
    2: 2,
    1: 0,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.section, styles.sectionLast]}>
        <View style={styles.summary}>
          <View style={styles.bigNote}>
            <Text style={styles.bigVal}>{rating.toFixed(1)}</Text>
            <Text style={styles.bigStars}>
              {"⭐".repeat(Math.round(rating))}
            </Text>
            <Text style={styles.bigCount}>{reviewCount} avis</Text>
          </View>
          <View style={styles.bars}>
            {[5, 4, 3, 2, 1].map((star) => (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barNum}>{star}</Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${distribution[star] || 0}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.divider} />
        {reviews.length > 0 ? (
          reviews.map((review, i) => (
            <ReviewItem
              key={i}
              review={review}
              isLast={i === reviews.length - 1}
            />
          ))
        ) : (
          <View style={styles.emptyReviews}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>Pas encore d'avis</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 10 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 10,
    marginBottom: 0,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF0EF",
  },
  sectionLast: { marginBottom: 10 },
  summary: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  bigNote: { alignItems: "center", minWidth: 64 },
  bigVal: { fontSize: 36, fontWeight: "800", color: "#111", lineHeight: 40 },
  bigStars: { fontSize: 12, color: "#F5A623", marginTop: 3 },
  bigCount: { fontSize: 10, color: "#888", marginTop: 2 },
  bars: { flex: 1, gap: 5 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barNum: { fontSize: 10, color: "#888", width: 8, textAlign: "right" },
  barBg: {
    flex: 1,
    height: 5,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: 5, backgroundColor: "#F5A623", borderRadius: 3 },
  divider: { height: 0.5, backgroundColor: "#F0F0F0", marginBottom: 12 },
  review: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F5",
  },
  reviewLast: { borderBottomWidth: 0, paddingBottom: 0 },
  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  reviewName: { fontSize: 12, fontWeight: "700", color: "#111" },
  reviewDate: { fontSize: 10, color: "#AAB0B7" },
  reviewStars: { fontSize: 10, color: "#F5A623", marginBottom: 4 },
  reviewText: { fontSize: 11, color: "#666", lineHeight: 17 },
  emptyReviews: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 12, color: "#AAB0B7" },
});
