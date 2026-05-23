#!/usr/bin/env node
/**
 * Generates 25 historical runs for Selenium, REST Assured (TestNG), and REST Assured (JUnit5)
 * demo reports, spread over the past 25 days with realistic pass/fail/flaky variation.
 *
 * Usage: node scripts/generate-demo-history.js
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NOW  = Date.now();
const DAY  = 24 * 60 * 60 * 1000;
const HOUR =      60 * 60 * 1000;

// ─── Timestamp helper ─────────────────────────────────────────────────────────
// Spread 25 runs over the last 25 days; add per-run hour offset for variety
const RUN_HOURS = [9,14,11,16,9,10,15,9,11,14,10,9,16,11,13,9,14,10,15,11,9,16,10,14,11];
function runBase(runIdx) {
  const daysBack = 25 - runIdx;
  return NOW - daysBack * DAY + RUN_HOURS[runIdx] * HOUR;
}

// ─── Scenario table (25 runs) ────────────────────────────────────────────────
// Each entry: which test indices are FAIL / FLAKY for that run.

// Selenium (10 tests, idx 8 = always SKIP)
// 0:Login 1:Search 2:AddToCart 3:Checkout(flaky) 4:UserProfile
// 5:Navigation 6:Filter(fail) 7:Sort(fail) 8:ProductDetails(skip) 9:Wishlist
const SEL = [
  /* 01 */ { f:[], k:[3]       },
  /* 02 */ { f:[], k:[]        },
  /* 03 */ { f:[6], k:[3]      },
  /* 04 */ { f:[], k:[3,7]     },
  /* 05 */ { f:[], k:[]        },
  /* 06 */ { f:[6,7], k:[3]    },
  /* 07 */ { f:[6,7,1], k:[3]  },
  /* 08 */ { f:[1,6,7], k:[3,4]},
  /* 09 */ { f:[6,7], k:[3,4]  },
  /* 10 */ { f:[6], k:[3,7]    },
  /* 11 */ { f:[6], k:[3]      },
  /* 12 */ { f:[7], k:[3]      },
  /* 13 */ { f:[], k:[3,6]     },
  /* 14 */ { f:[6], k:[3]      },
  /* 15 */ { f:[], k:[3]       },
  /* 16 */ { f:[], k:[]        },
  /* 17 */ { f:[], k:[3]       },
  /* 18 */ { f:[6], k:[]       },
  /* 19 */ { f:[], k:[]        },
  /* 20 */ { f:[], k:[3]       },
  /* 21 */ { f:[7], k:[3]      },
  /* 22 */ { f:[], k:[3,6]     },
  /* 23 */ { f:[1,6], k:[3]    },
  /* 24 */ { f:[6], k:[3]      },
  /* 25 */ { f:[6,7], k:[3]    },
];

// REST Assured TestNG (10 tests, idx 4 & 8 = always SKIP)
// 0:GET/users 1:GET/users/{id} 2:POST/users(flaky) 3:PUT/users/{id}(fail)
// 4:DELETE(skip) 5:GET/posts 6:POST/posts 7:GET/comments 8:GET/users/posts(skip) 9:PATCH
const RA = [
  /* 01 */ { f:[], k:[2]       },
  /* 02 */ { f:[], k:[]        },
  /* 03 */ { f:[3], k:[2]      },
  /* 04 */ { f:[], k:[2,9]     },
  /* 05 */ { f:[], k:[]        },
  /* 06 */ { f:[3,9], k:[2]    },
  /* 07 */ { f:[3,9,0], k:[2]  },
  /* 08 */ { f:[0,3,9], k:[2,6]},
  /* 09 */ { f:[3,9], k:[2,6]  },
  /* 10 */ { f:[3], k:[2,9]    },
  /* 11 */ { f:[3], k:[2]      },
  /* 12 */ { f:[9], k:[2]      },
  /* 13 */ { f:[], k:[2,3]     },
  /* 14 */ { f:[3], k:[2]      },
  /* 15 */ { f:[], k:[2]       },
  /* 16 */ { f:[], k:[]        },
  /* 17 */ { f:[], k:[2]       },
  /* 18 */ { f:[3], k:[]       },
  /* 19 */ { f:[], k:[]        },
  /* 20 */ { f:[], k:[2]       },
  /* 21 */ { f:[9], k:[2]      },
  /* 22 */ { f:[], k:[2,3]     },
  /* 23 */ { f:[0,3], k:[2]    },
  /* 24 */ { f:[3], k:[2]      },
  /* 25 */ { f:[3,9], k:[2]    },
];

// Cucumber (8 scenarios across 2 features)
// 0:Homepage 1:Documentation 2:Downloads(flaky) 3:WebDriverDocs(fail) 4:Ecosystem(fail)
// 5:GettingStarted 6:BlogPage(fail) 7:WebDriverAPI(flaky)
const CU = [
  /* 01 */ { f:[],    k:[7]       },
  /* 02 */ { f:[],    k:[]        },
  /* 03 */ { f:[3],   k:[7]       },
  /* 04 */ { f:[],    k:[7,2]     },
  /* 05 */ { f:[],    k:[]        },
  /* 06 */ { f:[3,4], k:[7]       },
  /* 07 */ { f:[3,4,6], k:[7]     },
  /* 08 */ { f:[3,4,6], k:[7,2]   },
  /* 09 */ { f:[3,4], k:[7,2]     },
  /* 10 */ { f:[3],   k:[7,4]     },
  /* 11 */ { f:[3],   k:[7]       },
  /* 12 */ { f:[4],   k:[7]       },
  /* 13 */ { f:[],    k:[7,3]     },
  /* 14 */ { f:[3],   k:[7]       },
  /* 15 */ { f:[],    k:[7]       },
  /* 16 */ { f:[],    k:[]        },
  /* 17 */ { f:[],    k:[7]       },
  /* 18 */ { f:[3],   k:[]        },
  /* 19 */ { f:[],    k:[]        },
  /* 20 */ { f:[],    k:[7]       },
  /* 21 */ { f:[4],   k:[7]       },
  /* 22 */ { f:[],    k:[7,3]     },
  /* 23 */ { f:[3,4], k:[7]       },
  /* 24 */ { f:[3],   k:[7]       },
  /* 25 */ { f:[3,4], k:[7]       },
];

// REST Assured JUnit5 (13 tests)
// 0:getAllPosts 1:stableEndpointTest 2:createUser 3:updateUser 4:deleteUser
// 5:getPostsByUserId 6:getUserNotFound 7:getAllUsers 8:getPostById
// 9:flakyEndpointTest(flaky) 10:getUserById 11:failedAssertionDemo(fail) 12:createPost
const JU = [
  /* 01 */ { f:[], k:[9]         },
  /* 02 */ { f:[], k:[]          },
  /* 03 */ { f:[11], k:[9]       },
  /* 04 */ { f:[], k:[9,3]       },
  /* 05 */ { f:[], k:[]          },
  /* 06 */ { f:[11,3], k:[9]     },
  /* 07 */ { f:[11,3,0], k:[9]   },
  /* 08 */ { f:[0,11,3], k:[9,6] },
  /* 09 */ { f:[11,3], k:[9,6]   },
  /* 10 */ { f:[11], k:[9,3]     },
  /* 11 */ { f:[11], k:[9]       },
  /* 12 */ { f:[3], k:[9]        },
  /* 13 */ { f:[], k:[9,11]      },
  /* 14 */ { f:[11], k:[9]       },
  /* 15 */ { f:[], k:[9]         },
  /* 16 */ { f:[], k:[]          },
  /* 17 */ { f:[], k:[9]         },
  /* 18 */ { f:[11], k:[]        },
  /* 19 */ { f:[], k:[]          },
  /* 20 */ { f:[], k:[9]         },
  /* 21 */ { f:[3], k:[9]        },
  /* 22 */ { f:[], k:[9,11]      },
  /* 23 */ { f:[0,11], k:[9]     },
  /* 24 */ { f:[11], k:[9]       },
  /* 25 */ { f:[11,3], k:[9]     },
];

// ─── Data transformers ────────────────────────────────────────────────────────

function applySeleniumScenario(tests, scenario, base) {
  const offset = base - tests[0].startTime; // shift all relative to first test's start
  return tests.map((t, i) => {
    const out = JSON.parse(JSON.stringify(t));
    out.startTime = t.startTime + offset;
    out.endTime   = t.endTime   + offset;
    if (out.actions) out.actions = out.actions.map(a => ({ ...a, timestamp: (a.timestamp || t.startTime) + offset }));

    if (i === 8) { out.status = 'SKIP'; return out; } // ProductDetails always skip

    if (scenario.f.includes(i)) {
      out.status = 'FAIL';
      out.retryCount = 0;
      delete out.flakyReason;
      out.error = {
        message: `AssertionError: Expected element to be visible but it was not found — ${out.methodName}`,
        stackTrace: `org.testng.Assert.fail(Assert.java:99)\ncom.example.selenium.tests.DemoTests.${out.methodName.replace(/ /g,'_')}(DemoTests.java:${42 + i * 10})`,
      };
    } else if (scenario.k.includes(i)) {
      out.status = 'FLAKY';
      out.retryCount = 1;
      out.flakyReason = 'Test passed after retry due to timing issue';
      delete out.error;
    } else {
      out.status = 'PASS';
      out.retryCount = 0;
      delete out.flakyReason;
      delete out.error;
    }
    return out;
  });
}

const RA_ERRORS = [
  'AssertionError: Expected status code <200> but was <503>',
  'AssertionError: Response body validation failed — field "id" was null',
  'AssertionError: Expected status code <201> but was <400>',
  'java.lang.AssertionError: Request timed out after 5000ms',
];

function applyRestAssuredScenario(tests, scenario, base, skipIndices) {
  const offset = base - tests[0].startTime; // shift all relative to first test's start
  return tests.map((t, i) => {
    const out = JSON.parse(JSON.stringify(t));
    out.startTime = t.startTime + offset;
    out.endTime   = t.endTime   + offset;
    if (out.apiCalls) out.apiCalls = out.apiCalls.map(c => ({
      ...c,
      startTime: (c.startTime || t.startTime) + offset,
      endTime:   (c.endTime   || t.endTime)   + offset,
    }));

    if (skipIndices.includes(i)) { out.status = 'SKIP'; return out; }

    if (scenario.f.includes(i)) {
      out.status = 'FAIL';
      out.retryCount = 0;
      out.error = {
        message: RA_ERRORS[i % RA_ERRORS.length],
        stackTrace: `io.restassured.internal.RestAssuredResponseImpl.then(RestAssuredResponseImpl.java:288)\ncom.example.tests.ApiTests.${out.methodName}(ApiTests.java:${55 + i * 12})`,
      };
    } else if (scenario.k.includes(i)) {
      out.status = 'FLAKY';
      out.retryCount = 1;
      delete out.error;
    } else {
      out.status = 'PASS';
      out.retryCount = 0;
      delete out.error;
    }
    return out;
  });
}

const CU_ERRORS = [
  'AssertionError: Expected page title to contain "Selenium" but was "Service Unavailable"',
  'AssertionError: Expected main heading to be visible but no h1 was found on the page',
  'TimeoutException: Element h1 not found within timeout — page may not have loaded correctly',
  'AssertionError: Page content (main/article/section) not found — layout may have changed',
  'AssertionError: Navigation bar not present — site structure may have changed',
];

function applyCucumberScenario(tests, scenario, base) {
  const offset = base - tests[0].start;
  return tests.map((t, i) => {
    const out = JSON.parse(JSON.stringify(t));
    out.start = t.start + offset;
    out.stop  = t.stop  + offset;
    out.uuid  = `cu-${String(i).padStart(4,'0')}-${String(base).slice(-12)}`;
    if (out.steps) out.steps = out.steps.map(s => ({
      ...s,
      start: s.start + offset,
      stop:  s.stop  + offset,
    }));

    if (scenario.f.includes(i)) {
      out.status = 'failed';
      delete out.statusDetails;
      if (out.extra) delete out.extra.flakyReason;
      const errMsg = CU_ERRORS[i % CU_ERRORS.length];
      out.statusDetails = { message: errMsg };
      // Mark the last step as failed
      if (out.steps && out.steps.length > 0) {
        const last = out.steps.length - 1;
        out.steps[last] = { ...out.steps[last], status: 'failed', statusDetails: { message: errMsg } };
      }
    } else if (scenario.k.includes(i)) {
      out.status = 'flaky';
      delete out.statusDetails;
      if (out.extra) out.extra.flakyReason = 'Scenario passed after retry due to timing issue';
    } else {
      out.status = 'passed';
      delete out.statusDetails;
      if (out.extra) delete out.extra.flakyReason;
    }
    return out;
  });
}

// ─── CLI runner ───────────────────────────────────────────────────────────────

function runCLI(inputFile, outputDir, format, cwd) {
  const cli = path.join(ROOT, 'packages/core/dist/cli.js');
  execSync(
    `node "${cli}" convert --input "${inputFile}" --output "${outputDir}" --format ${format}`,
    { stdio: 'pipe', cwd: cwd || ROOT, env: { ...process.env, SARVA_ENVIRONMENT: 'QA' } }
  );
}

function writeTmp(data) {
  const tmp = path.join(ROOT, '.tmp-demo-data.json');
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  return tmp;
}

function cleanTmp() {
  const tmp = path.join(ROOT, '.tmp-demo-data.json');
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const selSrc = JSON.parse(fs.readFileSync(path.join(ROOT, 'demo-selenium/testng-source/data.json'), 'utf-8'));
  const raSrc  = JSON.parse(fs.readFileSync(path.join(ROOT, 'demo-restassured/testng-source/data.json'), 'utf-8'));
  const juSrc  = JSON.parse(fs.readFileSync(path.join(ROOT, 'demo-restassured-junit/junit5-source/data.json'), 'utf-8'));
  const cuSrc  = JSON.parse(fs.readFileSync(path.join(ROOT, 'demo-cucumber/cucumber-source/data.json'), 'utf-8'));

  // Clear existing history so we get a clean 25-run slate
  const dirs = [
    'demo-selenium/sarva-report',
    'demo-restassured/sarva-report',
    'demo-restassured-junit/sarva-report',
    'demo-cucumber/sarva-report',
  ];
  dirs.forEach(d => {
    const full = path.join(ROOT, d);
    if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
  });

  console.log('Generating 25 runs for each framework...\n');

  for (let i = 0; i < 25; i++) {
    const run = i + 1;
    const base = runBase(i);
    process.stdout.write(`  Run ${String(run).padStart(2)} / 25 — `);

    // Selenium
    const selData = applySeleniumScenario(selSrc, SEL[i], base);
    runCLI(writeTmp(selData), path.join(ROOT, 'demo-selenium/sarva-report'), 'testng-selenium', path.join(ROOT, 'demo-selenium'));
    process.stdout.write('selenium ✓  ');

    // REST Assured TestNG
    const raData = applyRestAssuredScenario(raSrc, RA[i], base, [4, 8]);
    runCLI(writeTmp(raData), path.join(ROOT, 'demo-restassured/sarva-report'), 'testng-listener', path.join(ROOT, 'demo-restassured'));
    process.stdout.write('rest-assured ✓  ');

    // REST Assured JUnit5
    const juData = applyRestAssuredScenario(juSrc, JU[i], base, []);
    runCLI(writeTmp(juData), path.join(ROOT, 'demo-restassured-junit/sarva-report'), 'testng-listener', path.join(ROOT, 'demo-restassured-junit'));
    process.stdout.write('junit5 ✓  ');

    // Cucumber
    const cuData = applyCucumberScenario(cuSrc, CU[i], base);
    runCLI(writeTmp(cuData), path.join(ROOT, 'demo-cucumber/sarva-report'), 'sarva-varadi', path.join(ROOT, 'demo-cucumber'));
    process.stdout.write('cucumber ✓\n');
  }

  cleanTmp();
  console.log('\n✅ Done! Reports generated in:');
  console.log('   demo-selenium/sarva-report/index.html');
  console.log('   demo-restassured/sarva-report/index.html');
  console.log('   demo-restassured-junit/sarva-report/index.html');
  console.log('   demo-cucumber/sarva-report/index.html');
}

main().catch(err => { console.error(err); process.exit(1); });
