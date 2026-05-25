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

const ROOT        = path.join(__dirname, '..');
const CLI         = path.join(ROOT, 'packages/core/dist/cli.js');
const DEMO_DIR    = path.join(ROOT, 'demo-robot');
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

// ── Per-test keyword definitions (mirrors actual .robot files) ───────────────
// Each entry: { name, lib, args?, steps? }
// The last step of the last top-level keyword is where failures are injected.

const KW_DEFS = {
  // ── Login Tests ──────────────────────────────────────────────────────────
  'Valid Login With Correct Credentials': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/login' },
    { name: 'Fill Login Form', lib: 'common.resource', args: '${VALID_USER}    ${VALID_PASS}', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=username    ${VALID_USER}' },
      { name: 'Fill Text', lib: 'Browser', args: 'id=password    ${VALID_PASS}' },
    ]},
    { name: 'Click Login Button', lib: 'common.resource', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=login-btn' },
    ]},
    { name: 'Dashboard Should Be Visible', lib: 'common.resource', steps: [
      { name: 'Wait For Elements State', lib: 'Browser', args: 'id=dashboard-header    visible' },
    ]},
    { name: 'Welcome Message Should Contain', lib: 'common.resource', args: 'testuser', steps: [
      { name: 'Get Text', lib: 'Browser', args: 'id=welcome-msg    contains    testuser' },
    ]},
  ],
  'Invalid Login With Wrong Password': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/login' },
    { name: 'Fill Login Form', lib: 'common.resource', args: '${VALID_USER}    wrong_password', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=username    ${VALID_USER}' },
      { name: 'Fill Text', lib: 'Browser', args: 'id=password    wrong_password' },
    ]},
    { name: 'Click Login Button', lib: 'common.resource', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=login-btn' },
    ]},
    { name: 'Error Message Should Be Visible', lib: 'common.resource', steps: [
      { name: 'Wait For Elements State', lib: 'Browser', args: 'id=login-error    visible' },
    ]},
    { name: 'Error Message Should Contain', lib: 'common.resource', args: 'Invalid credentials', steps: [
      { name: 'Get Text', lib: 'Browser', args: 'id=login-error    contains    Invalid credentials' },
    ]},
  ],
  'Login With Empty Username': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/login' },
    { name: 'Fill Login Form', lib: 'common.resource', args: '${EMPTY}    ${VALID_PASS}', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=username    ${EMPTY}' },
      { name: 'Fill Text', lib: 'Browser', args: 'id=password    ${VALID_PASS}' },
    ]},
    { name: 'Click Login Button', lib: 'common.resource', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=login-btn' },
    ]},
    { name: 'Field Validation Error Should Be Visible', lib: 'common.resource', args: 'username', steps: [
      { name: 'Wait For Elements State', lib: 'Browser', args: 'id=username-error    visible' },
    ]},
  ],
  'Login With Empty Password': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/login' },
    { name: 'Fill Login Form', lib: 'common.resource', args: '${VALID_USER}    ${EMPTY}', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=username    ${VALID_USER}' },
      { name: 'Fill Text', lib: 'Browser', args: 'id=password    ${EMPTY}' },
    ]},
    { name: 'Click Login Button', lib: 'common.resource', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=login-btn' },
    ]},
    { name: 'Field Validation Error Should Be Visible', lib: 'common.resource', args: 'password', steps: [
      { name: 'Wait For Elements State', lib: 'Browser', args: 'id=password-error    visible' },
    ]},
  ],
  'Logout Clears Session': [
    { name: 'Login As', lib: 'common.resource', args: '${VALID_USER}    ${VALID_PASS}', steps: [
      { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/login' },
      { name: 'Fill Login Form', lib: 'common.resource', args: '${VALID_USER}    ${VALID_PASS}', steps: [
        { name: 'Fill Text', lib: 'Browser', args: 'id=username    ${VALID_USER}' },
        { name: 'Fill Text', lib: 'Browser', args: 'id=password    ${VALID_PASS}' },
      ]},
      { name: 'Click Login Button', lib: 'common.resource', steps: [
        { name: 'Click', lib: 'Browser', args: 'id=login-btn' },
      ]},
      { name: 'Dashboard Should Be Visible', lib: 'common.resource', steps: [
        { name: 'Wait For Elements State', lib: 'Browser', args: 'id=dashboard-header    visible' },
      ]},
    ]},
    { name: 'Click Logout Button', lib: 'common.resource', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=logout-btn' },
    ]},
    { name: 'Login Page Should Be Visible', lib: 'common.resource', steps: [
      { name: 'Wait For Elements State', lib: 'Browser', args: 'id=login-btn    visible' },
    ]},
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/dashboard' },
    { name: 'Should Be Redirected To Login', lib: 'common.resource', steps: [
      { name: 'Get Url', lib: 'Browser', args: 'contains    /login' },
    ]},
  ],
  'Remember Me Persists Session': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/login' },
    { name: 'Fill Login Form', lib: 'common.resource', args: '${VALID_USER}    ${VALID_PASS}', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=username    ${VALID_USER}' },
      { name: 'Fill Text', lib: 'Browser', args: 'id=password    ${VALID_PASS}' },
    ]},
    { name: 'Check Remember Me', lib: 'common.resource', steps: [
      { name: 'Check Checkbox', lib: 'Browser', args: 'id=remember-me' },
    ]},
    { name: 'Click Login Button', lib: 'common.resource', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=login-btn' },
    ]},
    { name: 'Dashboard Should Be Visible', lib: 'common.resource', steps: [
      { name: 'Wait For Elements State', lib: 'Browser', args: 'id=dashboard-header    visible' },
    ]},
  ],

  // ── Search Tests ─────────────────────────────────────────────────────────
  'Search Returns Relevant Results': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/search' },
    { name: 'Enter Search Query', lib: 'search_tests.robot', args: 'laptop', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=search-input    laptop' },
    ]},
    { name: 'Submit Search', lib: 'search_tests.robot', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=search-btn' },
    ]},
    { name: 'Search Results Should Be Visible', lib: 'search_tests.robot', steps: [
      { name: 'Wait For Elements State', lib: 'Browser', args: 'id=results-container    visible' },
    ]},
    { name: 'Result Count Should Be Greater Than', lib: 'search_tests.robot', args: '0', steps: [
      { name: 'Get Element Count', lib: 'Browser', args: 'css=.result-item' },
      { name: 'Should Be True', lib: 'BuiltIn', args: '${count} > 0' },
    ]},
  ],
  'Search With No Results Shows Empty State': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/search' },
    { name: 'Enter Search Query', lib: 'search_tests.robot', args: 'xyzzy_not_a_product_12345', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=search-input    xyzzy_not_a_product_12345' },
    ]},
    { name: 'Submit Search', lib: 'search_tests.robot', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=search-btn' },
    ]},
    { name: 'Empty State Message Should Be Visible', lib: 'search_tests.robot', steps: [
      { name: 'Wait For Elements State', lib: 'Browser', args: 'id=empty-state    visible' },
    ]},
  ],
  'Search Results Can Be Filtered By Category': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/search' },
    { name: 'Enter Search Query', lib: 'search_tests.robot', args: 'phone', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=search-input    phone' },
    ]},
    { name: 'Submit Search', lib: 'search_tests.robot', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=search-btn' },
    ]},
    { name: 'Apply Category Filter', lib: 'search_tests.robot', args: 'Electronics', steps: [
      { name: 'Click', lib: 'Browser', args: 'css=[data-category="Electronics"]' },
    ]},
    { name: 'All Results Should Have Category', lib: 'search_tests.robot', args: 'Electronics', steps: [
      { name: 'Log', lib: 'BuiltIn', args: 'Category filter verified: Electronics' },
    ]},
  ],
  'Search Results Can Be Sorted By Price': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/search' },
    { name: 'Enter Search Query', lib: 'search_tests.robot', args: 'headphones', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=search-input    headphones' },
    ]},
    { name: 'Submit Search', lib: 'search_tests.robot', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=search-btn' },
    ]},
    { name: 'Sort Results By', lib: 'search_tests.robot', args: 'price_asc', steps: [
      { name: 'Select Options By', lib: 'Browser', args: 'id=sort-select    value    price_asc' },
    ]},
    { name: 'Results Should Be Sorted By Price Ascending', lib: 'search_tests.robot', steps: [
      { name: 'Log', lib: 'BuiltIn', args: 'Price sort verified' },
    ]},
  ],
  'Clicking A Result Opens Product Page': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/search' },
    { name: 'Enter Search Query', lib: 'search_tests.robot', args: 'laptop', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=search-input    laptop' },
    ]},
    { name: 'Submit Search', lib: 'search_tests.robot', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=search-btn' },
    ]},
    { name: 'Click First Result', lib: 'search_tests.robot', steps: [
      { name: 'Click', lib: 'Browser', args: 'css=.result-item:first-child' },
    ]},
    { name: 'Product Detail Page Should Be Visible', lib: 'search_tests.robot', steps: [
      { name: 'Wait For Elements State', lib: 'Browser', args: 'id=product-detail    visible' },
    ]},
  ],
  'Pagination Works On Large Result Sets': [
    { name: 'Navigate To', lib: 'Browser', args: '${BASE_URL}/search' },
    { name: 'Enter Search Query', lib: 'search_tests.robot', args: 'a', steps: [
      { name: 'Fill Text', lib: 'Browser', args: 'id=search-input    a' },
    ]},
    { name: 'Submit Search', lib: 'search_tests.robot', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=search-btn' },
    ]},
    { name: 'Click Next Page', lib: 'search_tests.robot', steps: [
      { name: 'Click', lib: 'Browser', args: 'id=pagination-next' },
    ]},
    { name: 'Page Number Should Be', lib: 'search_tests.robot', args: '2', steps: [
      { name: 'Get Text', lib: 'Browser', args: 'id=current-page    equals    2' },
    ]},
  ],

  // ── User Api Tests ────────────────────────────────────────────────────────
  'GET All Users Returns 200': [
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /users' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Should Not Be Empty', lib: 'Collections', args: '${users}' },
  ],
  'GET User By ID Returns Correct User': [
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /users/1' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Should Be Equal', lib: 'BuiltIn', args: '${user}[id]    ${1}' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${user}    email' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${user}    name' },
  ],
  'GET Non-Existent User Returns 404': [
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /users/99999    expected_status=404' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    404' },
  ],
  'POST Create User Returns 201': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'name=John Doe    email=john.doe@example.com    role=viewer' },
    { name: 'POST On Session', lib: 'RequestsLibrary', args: 'api    /users    json=${payload}' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    201' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${created}    id' },
    { name: 'Should Be Equal', lib: 'BuiltIn', args: '${created}[email]    john.doe@example.com' },
  ],
  'POST Create User With Missing Email Returns 400': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'name=No Email User' },
    { name: 'POST On Session', lib: 'RequestsLibrary', args: 'api    /users    json=${payload}    expected_status=400' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    400' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${error}    message' },
  ],
  'PUT Update User Returns 200': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'name=Updated Name    role=admin' },
    { name: 'PUT On Session', lib: 'RequestsLibrary', args: 'api    /users/1    json=${payload}' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Should Be Equal', lib: 'BuiltIn', args: '${updated}[name]    Updated Name' },
  ],
  'DELETE User Returns 204': [
    { name: 'DELETE On Session', lib: 'RequestsLibrary', args: 'api    /users/2    expected_status=204' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    204' },
  ],
  'GET Deleted User Returns 404': [
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /users/2    expected_status=404' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    404' },
  ],
  'GET Users Supports Pagination': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'page=2    limit=5' },
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /users    params=${params}' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${body}    data' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${body}    total' },
  ],

  // ── Product Api Tests ─────────────────────────────────────────────────────
  'GET All Products Returns 200': [
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /products' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Should Not Be Empty', lib: 'Collections', args: '${products}' },
  ],
  'GET Product By ID Returns Correct Data': [
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /products/1' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Should Be Equal', lib: 'BuiltIn', args: '${product}[id]    ${1}' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${product}    name' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${product}    price' },
  ],
  'GET Products Filtered By Category': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'category=Electronics' },
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /products    params=${params}' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Should Not Be Empty', lib: 'Collections', args: '${products}' },
  ],
  'POST Create Product Returns 201': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'name=Laptop Pro    price=999.99    category=Electronics    stock=50' },
    { name: 'POST On Session', lib: 'RequestsLibrary', args: 'api    /products    json=${payload}' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    201' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${created}    id' },
    { name: 'Should Be Equal', lib: 'BuiltIn', args: '${created}[name]    Laptop Pro' },
  ],
  'POST Create Product With Negative Price Returns 400': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'name=Bad Product    price=-10    category=Electronics' },
    { name: 'POST On Session', lib: 'RequestsLibrary', args: 'api    /products    json=${payload}    expected_status=400' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    400' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Dictionary Should Contain Key', lib: 'Collections', args: '${error}    message' },
  ],
  'PUT Update Product Stock': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'stock=75' },
    { name: 'PUT On Session', lib: 'RequestsLibrary', args: 'api    /products/1    json=${payload}' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${updated}[stock]    75' },
  ],
  'GET Products Sorted By Price': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'sort=price_asc' },
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /products    params=${params}' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Log', lib: 'BuiltIn', args: 'Price sort order verified' },
  ],
  'DELETE Product Returns 204': [
    { name: 'DELETE On Session', lib: 'RequestsLibrary', args: 'api    /products/99    expected_status=204' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    204' },
  ],
  'GET Out Of Stock Products': [
    { name: 'Create Dictionary', lib: 'Collections', args: 'in_stock=false' },
    { name: 'GET On Session', lib: 'RequestsLibrary', args: 'api    /products    params=${params}' },
    { name: 'Should Be Equal As Integers', lib: 'BuiltIn', args: '${response.status_code}    200' },
    { name: 'Set Variable', lib: 'BuiltIn', args: '${response.json()}' },
    { name: 'Should Not Be Empty', lib: 'Collections', args: '${products}' },
  ],
};

// ── XML generation ───────────────────────────────────────────────────────────

function buildKwXml(kw, t, failed, failOnLast, indent) {
  const pad = ' '.repeat(indent);
  const status = (failOnLast && !kw.steps) ? 'FAIL' : 'PASS';
  const subXml = kw.steps
    ? kw.steps.map((s, i) => {
        const isLast = i === kw.steps.length - 1;
        return buildKwXml(s, t, failed, failOnLast && isLast, indent + 2);
      }).join('\n')
    : '';
  const argsXml = kw.args ? `\n${pad}  <arg>${kw.args}</arg>` : '';
  const msgXml = (failOnLast && !kw.steps)
    ? `\n${pad}  <msg level="FAIL">AssertionError: Expected assertion to pass\nActual: ${kw.args || 'unexpected value'}</msg>`
    : '';
  return `${pad}<kw name="${kw.name}" library="${kw.lib}">${argsXml}${subXml ? '\n' + subXml : ''}${msgXml}
${pad}  <status status="${status}" start="${rfTimestamp(t)}" elapsed="${(rand(50, 400) / 1000).toFixed(6)}"/>
${pad}</kw>`;
}

function buildTestXml(test, runStart, runIndex) {
  const failed = shouldFail(test.name, runIndex);
  const dur    = rand(800, 5000);
  const start  = runStart + rand(0, 2000);
  const elapsed = (dur / 1000).toFixed(6);
  const status  = failed ? 'FAIL' : 'PASS';

  const tagXml = test.tags.map(t => `        <tag>${t}</tag>`).join('\n');

  const kwDefs = KW_DEFS[test.name] || [
    { name: 'Run Test', lib: 'BuiltIn' },
  ];

  // For failed tests, mark the last top-level keyword as failed
  const kwXmls = kwDefs.map((kw, i) => {
    const isLast = i === kwDefs.length - 1;
    return buildKwXml(kw, start + i * rand(100, 300), failed, failed && isLast, 6);
  }).join('\n');

  const errorXml = failed
    ? `      <msg timestamp="${rfTimestamp(start + dur - 50)}" level="FAIL">AssertionError: Expected assertion to pass\nStack: robot.libraries.BuiltIn.AssertionError</msg>`
    : '';

  return `    <test id="t${Math.random().toString(36).slice(2,8)}" name="${test.name}">
${tagXml}
${kwXmls}
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
        `node "${CLI}" generate --input "${xmlPath}" --output "${REPORT_DIR}" --use-current-timestamp`,
        { cwd: DEMO_DIR, stdio: 'pipe' }
      );
    } catch (e) {
      console.warn(`    ⚠️  Run ${i + 1} generation failed: ${e.message.slice(0, 100)}`);
    }
  }

  console.log('\n✅ Robot Framework demo history generated!');
  console.log(`   Report: ${REPORT_DIR}/index.html`);
}

main().catch(e => { console.error(e); process.exit(1); });
