// src/theme.js
// Charte graphique centralisée de Djobna
// Modifier ici change l'apparence dans toute l'app

export const colors = {
  // ── Brand ──
  primary: "#1D9E75",
  primaryDark: "#0F6E56",
  primaryLight: "#E8F5F0",

  // ── Surfaces (fond clair + aéré) ──
  background: "#FFFFFF",
  surface: "#F7F8FA",
  surfaceElevated: "#FFFFFF",
  card: "#FFFFFF",

  // ── Header (conserve le dark pour contraste) ──
  headerBg: "#0D1F1A",
  headerText: "#FFFFFF",
  headerSubtext: "#9FE1CB",
  headerIcon: "#9FE1CB",
  headerMuted: "rgba(255,255,255,0.5)",

  // ── Text ──
  textPrimary: "#1A1D1F",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textInverse: "#FFFFFF",

  // ── Borders ──
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
  divider: "#F3F4F6",

  // ── Greens ──
  green50: "#F0FAF6",
  green100: "#D1F5E8",
  green200: "#A7E8D0",
  green300: "#5DCAA5",
  green400: "#1D9E75",

  // ── Status ──
  error: "#EF4444",
  errorLight: "#FEF2F2",
  errorBorder: "#FECACA",
  success: "#10B981",
  successLight: "#ECFDF5",
  successBorder: "#A7F3D0",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  warningBorder: "#FDE68A",
  info: "#3B82F6",
  infoLight: "#EFF6FF",
  infoBorder: "#BFDBFE",

  // ── Misc ──
  star: "#F59E0B",
  premium: "#F59E0B",
  premiumBg: "#FFFBEB",
  premiumBorder: "#FDE68A",
  skeleton: "#E5E7EB",
  skeletonHighlight: "#F3F4F6",
  overlay: "rgba(0,0,0,0.45)",
  disabled: "#D1D5DB",

  // ── Legacy aliases (pour migration progressive) ──
  white: "#FFFFFF",
  lightGray: "#F5F5F5",
  textLight: "#9FE1CB",
  textGray: "#6B7280",
  textDark: "#1A1D1F",
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, color: "#1A1D1F" },
  h2: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3, color: "#1A1D1F" },
  h3: { fontSize: 18, fontWeight: "700", color: "#1A1D1F" },
  body: { fontSize: 15, fontWeight: "400", color: "#1A1D1F", lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400", color: "#6B7280", lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: "500", color: "#6B7280" },
  tiny: { fontSize: 10, fontWeight: "600", color: "#9CA3AF" },
  label: { fontSize: 12, fontWeight: "700", color: "#6B7280", letterSpacing: 0.5, textTransform: "uppercase" },
  button: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};
