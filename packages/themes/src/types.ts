export interface ThemeColorSet {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  accent2: string;
  border: string;
  error: string;
}

export interface FontConfig {
  family: string;
  weight: number;
  size?: number;
  weights?: Record<string, number>;
}

export interface SpacingConfig {
  slidePadding: number;
  blockGap: number;
  paragraphGap: number;
  sectionGap: number;
}

export interface DensitySpacing {
  compact: SpacingConfig;
  comfortable: SpacingConfig;
  breathing: SpacingConfig;
}

export interface Theme {
  name: string;
  version: string;
  description: string;
  author: string;
  colors: ThemeColorSet;
  fonts: {
    heading: FontConfig;
    body: FontConfig;
    mono: FontConfig;
  };
  spacing: DensitySpacing;
  radii: {
    small: number;
    medium: number;
    large: number;
    full: number;
  };
  shadows: {
    subtle: { offsetX: number; offsetY: number; blur: number; color: string };
    medium: { offsetX: number; offsetY: number; blur: number; color: string };
  };
  layouts: string[];
}

export interface ThemeInfo {
  name: string;
  description: string;
}
