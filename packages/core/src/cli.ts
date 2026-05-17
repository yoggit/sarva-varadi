#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { parseStringPromise } from 'xml2js';
import { SmartConverter } from './converters';
import { ReportGenerator } from './generators/report-generator';

interface CLIOptions {
  input: string;
  output: string;
  title?: string;
  useCurrentTimestamp?: boolean;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  if (command === 'generate' || command === 'convert') {
    await handleGenerate(args.slice(1));
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Run "sarva-varadi --help" for usage information');
    process.exit(1);
  }
}

function loadPropertiesFile(): Record<string, string> {
  const locations = ['sarva-varadi.properties', 'src/test/resources/sarva-varadi.properties', '../sarva-varadi.properties'];
  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      const props: Record<string, string> = {};
      fs.readFileSync(loc, 'utf-8').split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq === -1) return;
        props[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
      });
      console.log(`✅ Sarva-Varadi: Loaded config from ${loc}`);
      return props;
    }
  }
  return {};
}

async function handleGenerate(args: string[]) {
  const options = parseArgs(args);
  const props = loadPropertiesFile();

  if (!options.input) {
    console.error('Error: --input is required');
    console.error('Usage: sarva-varadi generate --input <path> --output <path>');
    process.exit(1);
  }

  if (!options.output) {
    console.error('Error: --output is required');
    console.error('Usage: sarva-varadi generate --input <path> --output <path>');
    process.exit(1);
  }

  try {
    console.log(`\n📂 Reading test results from: ${options.input}`);

    // Read input file
    if (!fs.existsSync(options.input)) {
      throw new Error(`Input file not found: ${options.input}`);
    }

    const fileContent = fs.readFileSync(options.input, 'utf-8');
    const ext = path.extname(options.input).toLowerCase();

    let data: any;

    // Parse based on file extension
    if (ext === '.xml') {
      console.log('📄 Parsing XML file...');
      data = await parseStringPromise(fileContent, {
        explicitArray: false,
        mergeAttrs: false,
        trim: true,
      });
    } else if (ext === '.json') {
      console.log('📄 Parsing JSON file...');
      data = JSON.parse(fileContent);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Supported: .xml, .json`);
    }

    // Smart convert (auto-detects format, skips if already Sarva-Varadi)
    console.log('🔄 Processing test results...');
    let results = SmartConverter.convert(data);

    // Apply current timestamp if flag is set
    if (options.useCurrentTimestamp) {
      const now = Date.now();
      const offset = now - (results[0]?.start || now);
      results = results.map(test => ({
        ...test,
        start: test.start + offset,
        stop: test.stop + offset,
        steps: test.steps?.map(step => ({
          ...step,
          start: step.start + offset,
          stop: step.stop + offset,
        })),
      }));
      console.log('✓ Applied current timestamp to test results');
    }

    console.log(`✓ Processed ${results.length} test results`);

    // Generate report
    console.log(`\n📊 Generating Sarva-Varadi report...`);

    const generator = new ReportGenerator({
      outputFolder: options.output,
      title: options.title || props['sarva.report.title'] || 'Sarva-Varadi Test Report',
      showStackTrace: props['sarva.report.showStackTrace'] !== 'false',
      embedAttachments: props['sarva.report.embedAttachments'] !== 'false',
      maskSensitiveData: props['sarva.report.maskSensitiveData'] === 'true',
      history: {
        enabled: props['sarva.report.history'] !== 'false',
        maxRuns: props['sarva.report.maxRuns'] ? parseInt(props['sarva.report.maxRuns']) : 20,
        retentionDays: props['sarva.report.retentionDays'] ? parseInt(props['sarva.report.retentionDays']) : 90,
        trackPerTest: true,
      },
      trends: {
        enabled: props['sarva.report.trends'] !== 'false',
        showInMainReport: true,
      },
    });

    const metadata = {
      id: `cli-${Date.now()}`,
      tool: results[0]?.tool || 'junit',
      timestamp: Date.now(),
      duration: results.reduce((sum, r) => sum + r.duration, 0),
      environment: {
        ci: process.env.CI || 'false',
        branch: process.env.BRANCH || '',
        commit: process.env.COMMIT || '',
      },
    };

    await generator.generateReport(results, metadata);

    console.log(`\n✅ Report generated successfully!`);
    console.log(`📁 Output: ${path.resolve(options.output)}`);
    console.log(`📄 Latest report: ${path.join(options.output, 'index.html')}`);
    console.log(`📈 Trends dashboard: ${path.join(options.output, 'trends.html')}\n`);
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    input: '',
    output: '',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--input' || arg === '-i') {
      options.input = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--title' || arg === '-t') {
      options.title = args[++i];
    } else if (arg === '--use-current-timestamp') {
      options.useCurrentTimestamp = true;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Sarva-Varadi CLI - Universal Test Reporter

Usage:
  sarva-varadi generate --input <path> --output <path> [options]

Commands:
  generate    Generate Sarva-Varadi report from test results

Options:
  --input, -i <path>          Input test results file (XML or JSON)
  --output, -o <path>         Output directory for reports
  --title, -t <title>         Report title (optional)
  --use-current-timestamp     Update test timestamps to current time (for demo/sample data)
  --help, -h                  Show this help message

Supported Formats:
  ✓ Sarva-Varadi JSON (native format, no conversion needed)
  ✓ JUnit XML (Maven/Gradle Surefire)
  ✓ TestNG XML
  ✓ Cucumber JSON

Examples:
  # Generate from JUnit results
  sarva-varadi generate --input target/surefire-reports/junit.xml --output sarva-report

  # Generate from Cucumber results
  sarva-varadi generate --input cucumber-report.json --output sarva-report --title "API Tests"

  # Generate from existing Sarva-Varadi data (no conversion)
  sarva-varadi generate --input sarva-data.json --output sarva-report

Notes:
  - The CLI auto-detects the format
  - If data is already in Sarva-Varadi format, conversion is skipped
  - XML files are parsed automatically (JUnit/TestNG)
  - JSON files can be Sarva-Varadi, Cucumber, or other formats

For more information, visit: https://github.com/yoggit/sarva-varadi
`);
}

// Run CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
