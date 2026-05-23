import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import Button from "./Button";
import Icon from "./Icon";
import { colors } from "../../theme";

/**
 * EmptyState — état vide réutilisable avec icône animée (Phosphor Icons)
 *
 * Usage:
 *   <EmptyState icon="magnifying-glass" title="Aucun résultat" subtitle="Essayez d'autres filtres" />
 *   <EmptyState
 *     icon="chat-circle-dots"
 *     title="Pas de messages"
 *     subtitle="Démarrez une conversation"
 *     actionLabel="Trouver un prestataire"
 *     onAction={() => navigation.navigate("Home")}
 *   />
 */
export default function EmptyState({
  icon = "tray-arrow-down",
  title = "Rien à afficher",
  subtitle,
  actionLabel,
  onAction,
  style,
}) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounce]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={{ transform: [{ translateY: bounce }] }}>
        <Icon name={icon} size={52} color="#CCC" weight="duotone" />
      </Animated.View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="md"
          fullWidth={false}
          style={{ marginTop: 8 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
    gap: 10,
  },
  icon: {
    fontSize: 52,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
