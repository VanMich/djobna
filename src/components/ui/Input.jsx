import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "./Icon";
import { colors, radius, typography, fonts } from "../../theme";

/**
 * Input universel — champ texte moderne avec label, icône, erreur, compteur
 *
 * Usage:
 *   <Input label="NOM COMPLET" value={name} onChangeText={setName} />
 *   <Input label="EMAIL" icon="mail-outline" error="Email invalide" />
 *   <Input label="DESCRIPTION" multiline maxLength={300} showCount />
 *   <Input label="TÉLÉPHONE" readOnly value="+237 6XX" leftComponent={<Flag />} />
 */
export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icon,
  iconRight,
  onIconRightPress,
  readOnly = false,
  multiline = false,
  maxLength,
  showCount = false,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  returnKeyType,
  onSubmitEditing,
  leftComponent,
  rightComponent,
  style,
  inputStyle,
  numberOfLines = 1,
  autoFocus = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.error : colors.border,
      error ? colors.error : colors.primary,
    ],
  });

  const charCount = value?.length || 0;

  if (readOnly) {
    return (
      <View style={[styles.wrapper, style]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={[styles.readOnly]}>
          {leftComponent ? (
            <View style={styles.leftComp}>{leftComponent}</View>
          ) : null}
          <Text style={styles.readOnlyText} numberOfLines={1}>
            {value || placeholder || "—"}
          </Text>
          {rightComponent || (
            <Icon name="lock" size={16} color={colors.ink300} />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Animated.View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          { borderColor },
          error && styles.inputWrapError,
        ]}
      >
        {icon ? (
          <Icon
            name={icon}
            size={18}
            color={isFocused ? colors.primary : colors.textMuted}
            style={styles.iconLeft}
          />
        ) : null}

        {leftComponent ? (
          <View style={styles.leftComp}>{leftComponent}</View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            multiline && {
              minHeight: numberOfLines * 22 + 16,
              textAlignVertical: "top",
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!readOnly}
          multiline={multiline}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          numberOfLines={multiline ? numberOfLines : 1}
          autoFocus={autoFocus}
        />

        {iconRight ? (
          <TouchableOpacity
            onPress={onIconRightPress}
            disabled={!onIconRightPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={iconRight}
              size={18}
              color={colors.textMuted}
              style={styles.iconRight}
            />
          </TouchableOpacity>
        ) : null}

        {rightComponent ? (
          <View style={styles.rightComp}>{rightComponent}</View>
        ) : null}
      </Animated.View>

      {/* Error + counter row */}
      {(error || (showCount && maxLength)) ? (
        <View style={styles.bottomRow}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View />
          )}
          {showCount && maxLength ? (
            <Text
              style={[
                styles.countText,
                charCount >= maxLength && styles.countTextMax,
              ]}
            >
              {charCount}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    ...typography.label,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputWrapMultiline: {
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  inputWrapError: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 8,
  },
  leftComp: {
    marginRight: 10,
  },
  rightComp: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  readOnly: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 50,
    opacity: 0.8,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    fontFamily: fonts.medium,
    flex: 1,
  },
  countText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.medium,
  },
  countTextMax: {
    color: colors.error,
    fontFamily: fonts.semiBold,
  },
});
