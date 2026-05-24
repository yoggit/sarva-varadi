import { SarvaTestResult, RunMetadata, SarvaReporterOptions } from '../types';
import { AssetsLoader } from './assets-loader';
import { renderShellOpen, renderShellClose } from './shell/shell-template';
import { renderOverview } from './micro-apps/overview/overview-template';
import { renderFailures } from './micro-apps/failures/failures-template';
import { renderTestList } from './micro-apps/test-list/test-list-template';
import { renderTrends } from './micro-apps/trends/trends-template';
import { renderTimeline } from './micro-apps/timeline/timeline-template';

const PACKAGE_VERSION = '3.0.0';

// ECharts loaded from CDN (free, open-source, no bundling needed)
const ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js';

export class HTMLGenerator {
  constructor(private options: Required<SarvaReporterOptions>) {}

  generate(tests: SarvaTestResult[], metadata: RunMetadata, history: { runs: any[]; testHistory: any[] } = { runs: [], testHistory: [] }): string {
    const styles        = AssetsLoader.getStyles();
    const scripts       = AssetsLoader.getScripts();
    const logoDataUrl   = AssetsLoader.getLogoDataUrl();
    const syneFontB64   = AssetsLoader.getSyneFontBase64();
    const toolName = this.getToolName(tests);
    const toolLabel = toolName ? toolName.charAt(0).toUpperCase() + toolName.slice(1) : 'Test';
    const title    = this.options.title || `Sarva-Varadi: ${toolLabel} Report`;

    // Serialise data for the client-side state store
    const storeInit = `
      document.addEventListener('DOMContentLoaded', () => {
        SarvaStore.init(
          ${JSON.stringify(tests)},
          ${JSON.stringify(metadata)},
          ${JSON.stringify(history)}
        );
      });
    `;

    const allScripts = `
      ${scripts}
      ${storeInit}
    `;

    return [
      renderShellOpen({ title, toolName, version: PACKAGE_VERSION, styles, logoDataUrl, syneFontB64, linkPatterns: this.options.links }),
      renderOverview(),
      renderFailures(),
      renderTestList(),
      renderTrends(),
      renderTimeline(),
      renderShellClose(`/* ECharts loaded async */\n${allScripts}`),
    ].join('\n') + this.renderEChartsLoader();
  }

  // ECharts loaded async after page paint so it doesn't block initial render
  private renderEChartsLoader(): string {
    return `
<script>
(function() {
  var s = document.createElement('script');
  s.src = '${ECHARTS_CDN}';
  s.onload = function() { SarvaEventBus.emit('echarts:ready', {}); };
  document.head.appendChild(s);
})();
</script>`;
  }

  private getToolName(tests: SarvaTestResult[]): string {
    if (this.options.frameworkLabel) return this.options.frameworkLabel;
    if (tests.length === 0) return '';
    const tool = tests[0].tool;
    const names: Record<string, string> = {
      playwright:     'Playwright',
      selenium:       'Selenium',
      cypress:        'Cypress',
      'rest-assured': 'RestAssured',
    };
    return names[tool] || tool;
  }

  // Keep for backwards-compat with trends-generator which still calls this
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }
}
