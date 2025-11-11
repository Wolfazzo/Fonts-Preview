import type { Font } from 'opentype.js';

export interface ParsedFont {
  id: string;
  displayName: string;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: string;
  blobUrl: string;
  font: Font;
  fileName: string;
}