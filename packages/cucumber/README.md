# @sarva-varadi/cucumber

TypeScript adapter package for Cucumber BDD results. Companion to the Java `sarva-varadi-cucumber` plugin.

In practice, the Java plugin writes Sarva-Varadi native JSON directly — the CLI reads it without conversion. This package exists for programmatic use cases where you want to process Cucumber results from a Node.js context.

## Installation

```bash
npm install @sarva-varadi/cucumber
```

## Usage

```typescript
import { CucumberAdapter } from '@sarva-varadi/cucumber';

const adapter = new CucumberAdapter();
const results = adapter.adaptAll(rawCucumberData);
```

## Typical setup

For most users, the Java plugin + CLI is the full workflow:

1. Register `SarvaVaradiCucumberPlugin` in your Cucumber runner (see `sarva-varadi-cucumber` Java module)
2. Run tests → `sarva-varadi-results/test-results.json` is written in native format
3. Generate report:

```bash
npx @sarva-varadi/core generate \
  --input sarva-varadi-results/test-results.json \
  --output sarva-report
```

No `--format` flag needed — the CLI auto-detects native format.

## License

MIT
