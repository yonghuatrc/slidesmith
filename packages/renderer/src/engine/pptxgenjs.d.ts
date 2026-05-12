declare module 'pptxgenjs' {
  interface SlideOptions {
    masterName?: string;
    slideNumber?: number;
  }

  interface TextProps {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    fontSize?: number;
    fontFace?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    lineSpacing?: number;
    paraSpaceAfter?: number;
    paraSpaceBefore?: number;
    fill?: { color: string };
    autoFit?: boolean;
    margin?: number | number[];
    transparency?: number;
    shadow?: { type: string; blur: number; offset: number; color: string; opacity: number };
  }

  interface ImageProps {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    path?: string;
    data?: string | Buffer;
    sizing?: { type: 'cover' | 'contain' | 'stretch'; w?: number; h?: number };
  }

  interface TableRow {
    options?: TextProps;
  }

  interface TableProps {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    colW?: number[];
    rowH?: number[];
    autoPage?: boolean;
    margin?: number[];
    border?: { type: string; pt: number; color: string };
    fill?: { color: string };
    fontSize?: number;
    fontFace?: string;
    color?: string;
    rowAltColor?: { color1: string; color2: string };
  }

  interface Slide {
    addText(text: string | TextProps[], options?: TextProps): void;
    addImage(options: ImageProps): void;
    addTable(rows: TableRow[][], options?: TableProps): void;
    background?: { fill?: string; color?: string };
    slideNumber?: { x?: number; y?: number };
  }

  interface WriteFileOpts {
    outputType: 'nodebuffer' | 'file';
    fileName?: string;
  }

  interface PptxGenJSOpts {
    slideLayout?: string;
    layout?: 'LAYOUT_WIDE' | 'LAYOUT_4x3';
    author?: string;
    title?: string;
  }

  class PptxGenJS {
    constructor(opts?: PptxGenJSOpts);
    addSlide(): Slide;
    defineSlideLayout(props: { title: string; x: number; y: number; w: number; h: number; name?: string }): Slide;
    writeFile(opts: WriteFileOpts): Promise<string>;
    write(opts: { outputType: 'nodebuffer' }): Promise<Buffer>;
    author: string;
    title: string;
    subject: string;
    layout: string;
    slideNumber: { x?: number; y?: number; color?: string; fontSize?: number };
  }

  export default PptxGenJS;
}
