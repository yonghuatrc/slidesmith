import { existsSync, readFileSync, statSync } from 'node:fs';
import JSZip from 'jszip';

/** Extracted XML files from a PPTX archive. */
export interface PptxContents {
  themeXml: string;
  slideMasterXml: string;
  slideLayoutXml: string;
}

const REQUIRED_FILES = ['[Content_Types].xml', 'ppt/presentation.xml'];

/**
 * Open a .pptx file (which is a ZIP archive) and extract key XML files.
 *
 * @param filePath - Path to the .pptx file
 * @returns Parsed XML strings for theme, slide master, and first slide layout
 * @throws ERR_FILE_NOT_FOUND if the file doesn't exist
 * @throws ERR_INVALID_PPTX if the file is not a valid PPTX or is missing required internal files
 */
export async function parsePptx(filePath: string): Promise<PptxContents> {
  // Check file exists and is a file (not a directory)
  if (!existsSync(filePath)) {
    throw new Error(`ERR_FILE_NOT_FOUND: File not found: ${filePath}`);
  }
  if (!statSync(filePath).isFile()) {
    throw new Error('ERR_INVALID_PPTX: Not a valid PPTX file');
  }

  // Read file buffer
  let buffer: Buffer;
  try {
    buffer = readFileSync(filePath);
  } catch {
    throw new Error(`ERR_FILE_NOT_FOUND: Cannot read file: ${filePath}`);
  }

  // Open as ZIP
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error('ERR_INVALID_PPTX: Not a valid PPTX file');
  }

  // Check required top-level files exist
  for (const file of REQUIRED_FILES) {
    if (!zip.file(file)) {
      throw new Error(`ERR_INVALID_PPTX: Missing required internal files`);
    }
  }

  // Extract theme XML (try multiple locations)
  const themeFile =
    zip.file('ppt/theme/theme1.xml') ||
    zip.file('ppt/theme/theme.xml');
  if (!themeFile) {
    throw new Error('ERR_INVALID_PPTX: Missing required internal files');
  }
  const themeXml = await themeFile.async('string');

  // Extract first slide master
  const masterFile = zip.file('ppt/slideMasters/slideMaster1.xml');
  if (!masterFile) {
    throw new Error('ERR_INVALID_PPTX: Missing required internal files');
  }
  const slideMasterXml = await masterFile.async('string');

  // Extract first slide layout
  const layoutFile = zip.file('ppt/slideLayouts/slideLayout1.xml');
  if (!layoutFile) {
    throw new Error('ERR_INVALID_PPTX: Missing required internal files');
  }
  const slideLayoutXml = await layoutFile.async('string');

  return { themeXml, slideMasterXml, slideLayoutXml };
}
