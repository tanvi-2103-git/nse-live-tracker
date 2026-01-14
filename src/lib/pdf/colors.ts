// Premium PDF Color Palette
export interface PDFColors {
  primary: [number, number, number];
  secondary: [number, number, number];
  accent: [number, number, number];
  success: [number, number, number];
  danger: [number, number, number];
  warning: [number, number, number];
  text: [number, number, number];
  textMuted: [number, number, number];
  background: [number, number, number];
  cardBg: [number, number, number];
  border: [number, number, number];
}

export const COLORS: PDFColors = {
  primary: [20, 184, 166],     // Teal
  secondary: [30, 41, 59],      // Slate
  accent: [245, 158, 11],       // Amber
  success: [34, 197, 94],       // Green
  danger: [239, 68, 68],        // Red
  warning: [251, 191, 36],      // Yellow
  text: [15, 23, 42],           // Dark text
  textMuted: [100, 116, 139],   // Muted text
  background: [248, 250, 252],  // Light gray
  cardBg: [255, 255, 255],      // White
  border: [226, 232, 240],      // Light border
};

export const RISK_COLORS: Record<string, [number, number, number]> = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.danger,
};

export const SCENARIO_COLORS: Record<string, [number, number, number]> = {
  baseCase: COLORS.primary,
  bullCase: COLORS.success,
  bearCase: COLORS.danger,
};
