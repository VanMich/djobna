// src/theme.js
// ─────────────────────────────────────────────────────────
// Djobna Design System — tokens centralisés
// Aligné sur le Design System : Manrope, neutrals forest-tinted,
// fond crème, accent mango, ombres douces Airbnb-like.
// ─────────────────────────────────────────────────────────

// ── Fonts (expo-google-fonts/manrope) ─────────────────────
// Utiliser fonts.bold etc. au lieu de fontWeight: "700"
// pour garantir le rendu Manrope sur Android + iOS.
export const fonts = {
  regular:   "Manrope_400Regular",
  medium:    "Manrope_500Medium",
  semiBold:  "Manrope_600SemiBold",
  bold:      "Manrope_700Bold",
  extraBold: "Manrope_800ExtraBold",
};

// ── Colors ────────────────────────────────────────────────
export const colors = {
  // ── Brand ──
  primary:       "#1D9E75",   // Djobna green — CTA, liens, actifs
  primaryDark:   "#0F6E56",   // Hover/press, texte sur fond clair
  primarySoft:   "#E4F4ED",   // Fonds teintés, chips primary
  brandDeep:     "#0D1F1A",   // Surfaces sombres premium (hero, footer)
  brandDeep2:    "#142822",   // Surface sombre légèrement relevée

  // ── Accent chaud — ratings, badges, highlights ──
  mango:         "#F2A65A",
  mangoSoft:     "#FFE7CC",
  mangoDark:     "#8A4A18",   // Texte sur fond mango-soft

  // ── Surfaces ──
  background:    "#FAFAF7",   // Fond global — crème chaud, jamais blanc pur
  surface:       "#FFFFFF",   // Cartes, sheets
  card:          "#FFFFFF",

  // ── Header (fond clair — plus de dark header) ──
  headerBg:      "#FAFAF7",   // = background (crème chaud)
  headerText:    "#0D1F1A",   // ink-900
  headerSubtext: "#5A6F66",   // ink-500
  headerIcon:    "#2A4138",   // ink-700
  headerMuted:   "#B5C0BA",   // ink-300

  // ── Text (forest-tinted neutrals) ──
  textPrimary:   "#0D1F1A",   // ink-900
  textSecondary: "#2A4138",   // ink-700
  textMuted:     "#5A6F66",   // ink-500
  textDisabled:  "#B5C0BA",   // ink-300
  textInverse:   "#FFFFFF",

  // ── Ink scale (forest-tinted) ──
  ink900:        "#0D1F1A",
  ink700:        "#2A4138",
  ink500:        "#5A6F66",
  ink300:        "#B5C0BA",
  ink100:        "#E4E8E6",
  ink50:         "#F1F3F1",

  // ── Borders (forest-tinted) ──
  border:        "#E4E8E6",   // ink-100
  borderLight:   "#F1F3F1",   // ink-50
  divider:       "#E4E8E6",   // ink-100

  // ── Greens (rétro-compat) ──
  green50:  "#E4F4ED",
  green100: "#D1F5E8",
  green200: "#A7E8D0",
  green300: "#5DCAA5",
  green400: "#1D9E75",

  // ── Status ──
  success:       "#1D9E75",   // = primary (cohérent avec « mission acceptée »)
  successSoft:   "#E4F4ED",
  error:         "#E54848",
  errorLight:    "#FCE4E4",
  errorBorder:   "#FECACA",
  warning:       "#F2B33D",
  warningLight:  "#FFF1D1",
  warningBorder: "#FDE68A",
  info:          "#3B82F6",
  infoLight:     "#E3EEFD",
  infoBorder:    "#BFDBFE",

  // ── Extended palette (secondary accents) ──
  purple:          "#8B5CF6",
  purpleSoft:      "#F5EEFE",
  purpleDark:      "#6D28D9",
  sky:             "#0EA5E9",
  skySoft:         "#E8F4FF",
  skyDark:         "#0369A1",
  errorSoft:       "#FFF0F0",

  // ── Misc ──
  star:             "#F2A65A",   // = mango (plus chaud que l'ancien jaune)
  premium:          "#F2A65A",
  premiumBg:        "#FFE7CC",
  premiumBorder:    "#F2A65A",
  skeleton:         "#E4E8E6",
  skeletonHighlight:"#F1F3F1",
  overlay:          "rgba(0,0,0,0.40)",
  disabled:         "#B5C0BA",

  // ── Legacy aliases (rétro-compatibilité) ──
  white:         "#FFFFFF",
  lightGray:     "#F1F3F1",
  textLight:     "#5A6F66",
  textGray:      "#5A6F66",
  textDark:      "#0D1F1A",
  primaryLight:  "#E4F4ED",
  surfaceElevated: "#FFFFFF",
  successLight:  "#E4F4ED",
  successBorder: "#A7E8D0",
};

// ── Spacing (base 4) ─────────────────────────────────────
export const spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  s3:  12,
  md:  16,
  s5:  20,
  lg:  24,
  xl:  32,
  s10: 40,
  xxl: 56,
  s20: 80,
};

// ── Radius ────────────────────────────────────────────────
export const radius = {
  xs:   6,    // chips internes, tags
  sm:   8,
  md:   12,   // boutons, inputs
  lg:   16,   // cartes
  xl:   24,   // hero, sheets, modals
  full: 9999, // avatars, badges, FAB
};

// ── Typography ────────────────────────────────────────────
// Chaque style inclut fontFamily Manrope pour Android+iOS.
export const typography = {
  display: {
    fontSize: 34, lineHeight: 40, letterSpacing: -0.4,
    fontFamily: fonts.bold, color: colors.ink900,
  },
  h1: {
    fontSize: 26, lineHeight: 32, letterSpacing: -0.2,
    fontFamily: fonts.bold, color: colors.ink900,
  },
  h2: {
    fontSize: 20, lineHeight: 28,
    fontFamily: fonts.bold, color: colors.ink900,
  },
  h3: {
    fontSize: 17, lineHeight: 24,
    fontFamily: fonts.semiBold, color: colors.ink900,
  },
  bodyLg: {
    fontSize: 16, lineHeight: 24,
    fontFamily: fonts.medium, color: colors.ink900,
  },
  body: {
    fontSize: 15, lineHeight: 22,
    fontFamily: fonts.medium, color: colors.ink900,
  },
  bodySmall: {
    fontSize: 13, lineHeight: 18,
    fontFamily: fonts.medium, color: colors.ink500,
  },
  caption: {
    fontSize: 13, lineHeight: 18,
    fontFamily: fonts.medium, color: colors.ink500,
  },
  tiny: {
    fontSize: 11, lineHeight: 14, letterSpacing: 0.8,
    fontFamily: fonts.bold, color: colors.ink500,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 11, lineHeight: 14, letterSpacing: 0.5,
    fontFamily: fonts.bold, color: colors.ink500,
    textTransform: "uppercase",
  },
  button: {
    fontSize: 15,
    fontFamily: fonts.semiBold, color: colors.textInverse,
  },
};

// ── Shadows (forest-tinted, Airbnb-like) ──────────────────
export const shadows = {
  sm: {
    shadowColor: "#0D1F1A",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  md: {
    shadowColor: "#0D1F1A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: "#0D1F1A",
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  press: {
    shadowColor: "#0D1F1A",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: -1 },
    elevation: 1,
  },
};

// ── Motion ────────────────────────────────────────────────
export const motion = {
  durFast: 80,
  dur:     160,
  durSlow: 240,
  // Pour Animated.spring, pas d'easing direct
  // Utiliser tension: 200, friction: 20 pour l'effet --ease
};
