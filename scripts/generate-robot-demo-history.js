#!/usr/bin/env node
/**
 * Generates 25 historical Robot Framework demo runs.
 * Produces realistic output.xml files, converts them via the CLI,
 * and accumulates history in demo-robot/sarva-report/.
 */

'use strict';

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const DEMO_DIR    = path.join(__dirname, '..', 'demo-robot');
const REPORT_DIR  = path.join(DEMO_DIR, 'sarva-report');
const RESULTS_DIR = path.join(DEMO_DIR, 'sarva-varadi-results');
const NUM_RUNS    = 25;

// ── Test definitions ─────────────────────────────────────────────────────────

const UI_TESTS = [
  { name: 'Valid Login With Correct Credentials',       suite: 'Login Tests',   tags: ['severity:critical','tms:AUTH-001','smoke'] },
  { name: 'Invalid Login With Wrong Password',          suite: 'Login Tests',   tags: ['severity:high','tms:AUTH-002','regression'] },
  { name: 'Login With Empty Username',                  suite: 'Login Tests',   tags: ['severity:normal','tms:AUTH-003','regression'] },
  { name: 'Login With Empty Password',                  suite: 'Login Tests',   tags: ['severity:normal','tms:AUTH-004','regression'] },
  { name: 'Logout Clears Session',                      suite: 'Login Tests',   tags: ['severity:high','tms:AUTH-005','regression'] },
  { name: 'Remember Me Persists Session',               suite: 'Login Tests',   tags: ['severity:normal','tms:AUTH-006','regression'] },
  { name: 'Search Returns Relevant Results',            suite: 'Search Tests',  tags: ['severity:high','tms:SRCH-001','smoke'] },
  { name: 'Search With No Results Shows Empty State',   suite: 'Search Tests',  tags: ['severity:normal','tms:SRCH-002','regression'] },
  { name: 'Search Results Can Be Filtered By Category', suite: 'Search Tests',  tags: ['severity:high','tms:SRCH-003','regression'] },
  { name: 'Search Results Can Be Sorted By Price',      suite: 'Search Tests',  tags: ['severity:normal','tms:SRCH-004','regression'] },
  { name: 'Clicking A Result Opens Product Page',       suite: 'Search Tests',  tags: ['severity:critical','tms:SRCH-005','smoke'] },
  { name: 'Pagination Works On Large Result Sets',      suite: 'Search Tests',  tags: ['severity:normal','tms:SRCH-006','regression'] },
];

const API_TESTS = [
  { name: 'GET All Users Returns 200',                    suite: 'User Api Tests',    tags: ['severity:critical','tms:USR-001','smoke'] },
  { name: 'GET User By ID Returns Correct User',          suite: 'User Api Tests',    tags: ['severity:high','tms:USR-002','regression'] },
  { name: 'GET Non-Existent User Returns 404',            suite: 'User Api Tests',    tags: ['severity:high','tms:USR-003','regression'] },
  { name: 'POST Create User Returns 201',                 suite: 'User Api Tests',    tags: ['severity:critical','tms:USR-004','smoke'] },
  { name: 'POST Create User With Missing Email Returns 400', suite: 'User Api Tests', tags: ['severity:normal','tms:USR-005','regression'] },
  { name: 'PUT Update User Returns 200',                  suite: 'User Api Tests',    tags: ['severity:high','tms:USR-006','regression'] },
  { name: 'DELETE User Returns 204',                      suite: 'User Api Tests',    tags: ['severity:high','tms:USR-007','regression'] },
  { name: 'GET Deleted User Returns 404',                 suite: 'User Api Tests',    tags: ['severity:normal','tms:USR-008','regression'] },
  { name: 'GET Users Supports Pagination',                suite: 'User Api Tests',    tags: ['severity:normal','tms:USR-009','regression'] },
  { name: 'GET All Products Returns 200',                 suite: 'Product Api Tests', tags: ['severity:critical','tms:PRD-001','smoke'] },
  { name: 'GET Product By ID Returns Correct Data',       suite: 'Product Api Tests', tags: ['severity:high','tms:PRD-002','regression'] },
  { name: 'GET Products Filtered By Category',            suite: 'Product Api Tests', tags: ['severity:high','tms:PRD-003','regression'] },
  { name: 'POST Create Product Returns 201',              suite: 'Product Api Tests', tags: ['severity:critical','tms:PRD-004','smoke'] },
  { name: 'POST Create Product With Negative Price Returns 400', suite: 'Product Api Tests', tags: ['severity:normal','tms:PRD-005','regression'] },
  { name: 'PUT Update Product Stock',                     suite: 'Product Api Tests', tags: ['severity:high','tms:PRD-006','regression'] },
  { name: 'GET Products Sorted By Price',                 suite: 'Product Api Tests', tags: ['severity:normal','tms:PRD-007','regression'] },
  { name: 'DELETE Product Returns 204',                   suite: 'Product Api Tests', tags: ['severity:high','tms:PRD-008','regression'] },
  { name: 'GET Out Of Stock Products',                    suite: 'Product Api Tests', tags: ['severity:normal','tms:PRD-009','regression'] },
];

const ALL_TESTS = [...UI_TESTS, ...API_TESTS];

// ── Helpers ──────────────────────────────────────────────────────────────────

function rfTimestamp(epochMs) {
  const d = new Date(epochMs);
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.` +
         `${pad(d.getUTCMilliseconds(), 3)}`;
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function shouldFail(testName, runIndex) {
  // Deterministic flakiness pattern so history looks realistic
  const flakyTests = ['Remember Me Persists Session', 'Pagination Works On Large Result Sets', 'GET Deleted User Returns 404'];
  const frequentFails = ['Search Results Can Be Sorted By Price', 'POST Create Product With Negative Price Returns 400'];

  if (flakyTests.includes(testName) && runIndex % 4 === 1) return true;
  if (frequentFails.includes(testName) && runIndex % 3 === 0) return true;
  if (runIndex < 5 && testName.includes('DELETE')) return rand(0, 3) === 0;
  return false;
}

// ── XML generation ───────────────────────────────────────────────────────────

function buildTestXml(test, runStart, runIndex) {
  const failed = shouldFail(test.name, runIndex);
  const dur    = rand(300, 4000);  // ms
  const start  = runStart + rand(0, 2000);
  const elapsed = (dur / 1000).toFixed(6);
  const status  = failed ? 'FAIL' : 'PASS';

  const tagXml = test.tags.map(t => `        <tag>${t}</tag>`).join('\n');

  const kwDur = (dur * 0.6 / 1000).toFixed(6);
  const errorXml = failed
    ? `        <msg timestamp="${rfTimestamp(start + dur - 50)}" level="FAIL">AssertionError: Expected status 200 but got 500\nResponse: {"error":"Internal Server Error"}</msg>`
    : '';

  return `    <test id="t${Math.random().toString(36).slice(2,8)}" name="${test.name}">
${tagXml}
      <kw name="Setup" type="setup" library="BuiltIn">
        <status status="PASS" start="${rfTimestamp(start)}" elapsed="0.050000"/>
      </kw>
      <kw name="${test.suite.includes('Api') ? 'Send HTTP Request' : 'Open Browser And Navigate'}" library="RequestsLibrary">
        <kw name="Validate Prerequisites" library="BuiltIn">
          <status status="PASS" start="${rfTimestamp(start + 50)}" elapsed="0.010000"/>
        </kw>
        <kw name="${test.suite.includes('Api') ? 'Create Session' : 'New Page'}" library="${test.suite.includes('Api') ? 'RequestsLibrary' : 'Browser'}">
          <status status="PASS" start="${rfTimestamp(start + 60)}" elapsed="0.120000"/>
        </kw>
        <status status="${status}" start="${rfTimestamp(start + 50)}" elapsed="${kwDur}"/>
      </kw>
      ${errorXml}
      <status status="${status}" start="${rfTimestamp(start)}" elapsed="${elapsed}"/>
    </test>`;
}

function buildSuiteXml(suiteName, tests, runStart, runIndex) {
  const testXmls = tests.map(t => buildTestXml(t, runStart, runIndex)).join('\n');
  const allPass  = tests.every(t => !shouldFail(t.name, runIndex));
  const suiteStatus = allPass ? 'PASS' : 'FAIL';
  const elapsed = ((tests.length * 1500) / 1000).toFixed(6);

  return `  <suite id="s${Math.random().toString(36).slice(2,6)}" name="${suiteName}">
${testXmls}
    <status status="${suiteStatus}" start="${rfTimestamp(runStart)}" elapsed="${elapsed}"/>
  </suite>`;
}

function buildOutputXml(runIndex, runStart) {
  const suites = {};
  for (const t of ALL_TESTS) {
    if (!suites[t.suite]) suites[t.suite] = [];
    suites[t.suite].push(t);
  }

  const suiteXmls = Object.entries(suites)
    .map(([name, tests]) => buildSuiteXml(name, tests, runStart + rand(0, 500), runIndex))
    .join('\n');

  const totalElapsed = ((ALL_TESTS.length * 1500) / 1000).toFixed(6);
  const anyFail = ALL_TESTS.some(t => shouldFail(t.name, runIndex));

  return `<?xml version="1.0" encoding="UTF-8"?>
<robot generator="Robot 6.1.1 (Python 3.11.0)" generated="${rfTimestamp(runStart)}" rpa="false" schemaversion="3">
  <suite id="s1" name="Demo Robot" source="/workspace/demo-robot/tests">
${suiteXmls}
    <status status="${anyFail ? 'FAIL' : 'PASS'}" start="${rfTimestamp(runStart)}" elapsed="${totalElapsed}"/>
  </suite>
  <statistics>
    <total>
      <stat pass="${ALL_TESTS.filter(t => !shouldFail(t.name, runIndex)).length}" skip="0" fail="${ALL_TESTS.filter(t => shouldFail(t.name, runIndex)).length}">All Tests</stat>
    </total>
  </statistics>
  <errors/>
</robot>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🤖 Generating Robot Framework demo history (25 runs)...\n');

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR,  { recursive: true });

  const now = Date.now();

  for (let i = 0; i < NUM_RUNS; i++) {
    const runIndex  = i;
    const daysAgo   = NUM_RUNS - 1 - i;
    const runStart  = now - daysAgo * 24 * 60 * 60 * 1000 - rand(0, 3600000);

    console.log(`  Run ${String(i + 1).padStart(2)} / ${NUM_RUNS} — ${new Date(runStart).toISOString().slice(0, 10)}`);

    const xml     = buildOutputXml(runIndex, runStart);
    const xmlPath = path.join(RESULTS_DIR, 'output.xml');
    fs.writeFileSync(xmlPath, xml, 'utf-8');

    try {
      execSync(
        `node -e "require('./packages/core/dist/cli.js')" -- generate --input "${xmlPath}" --output "${REPORT_DIR}" --use-current-timestamp`,
        { cwd: path.join(__dirname, '..'), stdio: 'pipe' }
      );
    } catch {
      // Try via npx if direct invocation fails
      try {
        execSync(
          `npx --yes @sarva-varadi/core generate --input "${xmlPath}" --output "${REPORT_DIR}"`,
          { cwd: DEMO_DIR, stdio: 'pipe' }
        );
      } catch (e2) {
        console.warn(`    ⚠️  Run ${i + 1} generation failed: ${e2.message.slice(0, 80)}`);
      }
    }
  }

  console.log('\n✅ Robot Framework demo history generated!');
  console.log(`   Report: ${REPORT_DIR}/index.html`);
}

main().catch(e => { console.error(e); process.exit(1); });
