import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  StyleSheet,
} from "react-native";
import Icon from "../../components/ui/Icon";
import { colors, radius, shadows, typography, fonts } from "../../theme";

/**
 * Select — dropdown / picker moderne (remplace le pattern quartier picker)
 *
 * Usage:
 *   <Select
 *     label="QUARTIER"
 *     value={quartier}
 *     options={["Akwa", "Bonabéri", "Bonamoussadi"]}
 *     onSelect={setQuartier}
 *     placeholder="Choisis ton quartier"
 *   />
 *
 *   <Select
 *     label="SERVICE"
 *     value={service}
 *     options={[{ value: "mechanic", label: "🔧 Mécanicien" }, …]}
 *     onSelect={setService}
 *     searchable
 *   />
 *
 *   <Select
 *     label="QUARTIER"
 *     value={quartier}
 *     options={quartiers}
 *     onSelect={setQuartier}
 *     allowCustom
 *     customPlaceholder="Entre ton quartier"
 *   />
 */
export default function Select({
  label,
  value,
  options = [],
  onSelect,
  placeholder = "Sélectionner…",
  searchable = false,
  allowCustom = false,
  customPlaceholder = "Saisir manuellement…",
  error,
  maxHeight = 220,
  style,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropAnim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    const willOpen = !open;
    setOpen(willOpen);
    setSearch("");
    Animated.spring(dropAnim, {
      toValue: willOpen ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 14,
    }).start();
  }, [open, dropAnim]);

  const handleSelect = useCallback(
    (val) => {
      onSelect(val);
      setOpen(false);
      Animated.timing(dropAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    },
    [onSelect, dropAnim],
  );

  // Normalize options to { value, label } format
  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );

  // Filter by search
  const filtered = searchable && search
    ? normalizedOptions.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : normalizedOptions;

  // Display label
  const selectedLabel =
    normalizedOptions.find((o) => o.value === value)?.label || value;

  const dropdownMaxH = dropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight + (searchable ? 50 : 0)],
  });

  const arrowRotation = dropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Trigger */}
      <TouchableOpacity
        style={[
          styles.trigger,
          open && styles.triggerOpen,
          value && styles.triggerSelected,
          error && styles.triggerError,
        ]}
        onPress={toggle}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.triggerText,
            !value && styles.triggerPlaceholder,
          ]}
          numberOfLines={1}
        >
          {value ? selectedLabel : placeholder}
        </Text>
        <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
          <Icon name="chevron-down" size={16} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Dropdown */}
      <Animated.View
        style={[
          styles.dropdown,
          { maxHeight: dropdownMaxH },
          open && styles.dropdownOpen,
        ]}
      >
        {/* Search bar inside dropdown */}
        {searchable && open ? (
          <View style={styles.searchWrap}>
            <Icon name="search" size={14} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher…"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Icon name="close-circle" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          style={{ maxHeight }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.option,
                  value === opt.value && styles.optionSelected,
                ]}
                onPress={() => handleSelect(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    value === opt.value && styles.optionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {value === opt.value ? (
                  <Icon name="checkmark" size={16} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            ))
          ) : allowCustom ? (
            <View style={styles.customWrap}>
              <Text style={styles.customHint}>Aucun résultat. Saisissez manuellement :</Text>
              <TextInput
                style={styles.customInput}
                value={value || ""}
                onChangeText={onSelect}
                placeholder={customPlaceholder}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Aucun résultat</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, zIndex: 10 },
  label: {
    ...typography.label,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  triggerOpen: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  triggerSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  triggerError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    marginRight: 8,
  },
  triggerPlaceholder: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  dropdown: {
    overflow: "hidden",
    borderRadius: radius.md,
  },
  dropdownOpen: {
    marginTop: 6,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.md,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  customWrap: {
    padding: 14,
    gap: 8,
  },
  customHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  customInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  emptyWrap: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    fontFamily: fonts.medium,
    paddingHorizontal: 2,
  },
});
