import * as fs from 'fs';
import * as path from 'path';

export class AssetsLoader {
  private static stylesCache: string | null = null;
  private static scriptsCache: string | null = null;
  private static logoDataUrlCache: string | null = null;
  private static syneFontBase64Cache: string | null = null;

  static getSyneFontBase64(): string {
    if (this.syneFontBase64Cache !== null) return this.syneFontBase64Cache;
    const fontPath = path.join(__dirname, '..', 'screenshots', 'syne-latin.woff2');
    try {
      this.syneFontBase64Cache = fs.readFileSync(fontPath).toString('base64');
    } catch {
      this.syneFontBase64Cache = '';
    }
    return this.syneFontBase64Cache;
  }

  static getLogoDataUrl(): string {
    if (this.logoDataUrlCache) return this.logoDataUrlCache;
    const logoPath = path.join(__dirname, '..', 'screenshots', 'logo.svg');
    try {
      const svg = fs.readFileSync(logoPath, 'utf-8');
      this.logoDataUrlCache = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    } catch {
      this.logoDataUrlCache = '';
    }
    return this.logoDataUrlCache;
  }

  static getStyles(): string {
    if (this.stylesCache) return this.stylesCache;

    const parts = [
      path.join(__dirname, 'shell', 'shell.css'),
      path.join(__dirname, 'micro-apps', 'test-list', 'test-list.css'),
    ];
    this.stylesCache = parts.map(p => fs.readFileSync(p, 'utf-8')).join('\n');
    return this.stylesCache;
  }

  static getScripts(): string {
    if (this.scriptsCache) return this.scriptsCache;

    const parts = [
      path.join(__dirname, 'shared', 'event-bus.js'),
      path.join(__dirname, 'shared', 'state-store.js'),
      path.join(__dirname, 'shell', 'shell.js'),
      path.join(__dirname, 'micro-apps', 'overview', 'overview.js'),
      path.join(__dirname, 'micro-apps', 'failures', 'failures.js'),
      path.join(__dirname, 'micro-apps', 'test-list', 'test-list.js'),
      path.join(__dirname, 'micro-apps', 'test-detail', 'test-detail.js'),
      path.join(__dirname, 'micro-apps', 'trends', 'trends.js'),
      path.join(__dirname, 'micro-apps', 'timeline', 'timeline.js'),
    ];
    this.scriptsCache = parts.map(p => fs.readFileSync(p, 'utf-8')).join('\n');
    return this.scriptsCache;
  }
}
