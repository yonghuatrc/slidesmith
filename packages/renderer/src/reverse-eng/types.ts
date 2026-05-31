/** Output of the PPTX reverse-engineering process. */
export interface ThemeProfile {
  name: string;
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    accent: string;
    accent2: string;
    border: string;
    error: string;
  };
  fonts: {
    heading: { family: string; weight?: number };
    body: { family: string; weight?: number; size?: number };
    mono: { family: string };
  };
  layouts: ExtractedLayout[];
  confidence: number; // 0-1, how much of the template we could parse
}

export interface ExtractedLayout {
  name: string;
  zones: ExtractedZone[];
}

export interface ExtractedZone {
  name: string;
  x: number; // fraction 0-1
  y: number;
  w: number;
  h: number;
  type?: 'title' | 'body' | 'image' | 'footer';
}
