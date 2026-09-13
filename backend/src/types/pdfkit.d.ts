declare module 'pdfkit' {
  export default class PDFDocument {
    constructor(options?: Record<string, unknown>);
    on(event: string, callback: (...args: any[]) => void): this;
    end(): void;
    [key: string]: any;
  }
}
