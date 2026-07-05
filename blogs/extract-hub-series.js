#!/usr/bin/env node
/** Extract blog hub series metadata from ../content.js into _plain/hub-series.json */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, '..', 'content.js');
const OUT = path.join(ROOT, '_plain', 'hub-series.json');
const KEYS = [
  'blogHubTitle',
  'blogHubReadMore',
  'embodiedSeries',
  'trainingEnvSeries',
  'worldModelSeries',
  'policyDataSeries',
  'pipelineSeries',
  'methodLandscapeSeries',
];

const code = fs.readFileSync(CONTENT, 'utf8');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(code, ctx);

const RESUME = ctx.window.RESUME;
const LANGS = ctx.window.LANGS || ['zh'];
const out = {};

for (const lang of LANGS) {
  if (!RESUME[lang]) continue;
  out[lang] = {};
  for (const k of KEYS) {
    if (RESUME[lang][k] != null) out[lang][k] = RESUME[lang][k];
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('wrote', path.relative(ROOT, OUT));
