import * as fs from 'fs';
import * as path from 'path';

export class AssetsLoader {
  private static stylesCache: string | null = null;
  private static scriptsCache: string | null = null;

  static getStyles(): string {
    if (this.stylesCache) return this.stylesCache;

    const stylesPath = path.join(__dirname, 'varadi-styles.css');
    this.stylesCache = fs.readFileSync(stylesPath, 'utf-8');
    return this.stylesCache;
  }

  static getScripts(): string {
    if (this.scriptsCache) return this.scriptsCache;

    const scriptsPath = path.join(__dirname, 'varadi-scripts.js');
    this.scriptsCache = fs.readFileSync(scriptsPath, 'utf-8');
    return this.scriptsCache;
  }
}
