const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const root = resolve(__dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const html = read('index.html');
const attr = (tag, key) => tag.match(new RegExp('\\b' + key + '="([^"]*)"'))?.[1];

test('links públicos, JSON-LD e descoberta usam os domínios aprovados', () => {
  const apps = ['https://peso.garciadev.tech/', 'https://refeicao.garciadev.tech/', 'https://tmb.garciadev.tech/'];
  const cards = [...html.matchAll(/<a\b[^>]*class="entry"[^>]*>/g)].map(m => attr(m[0], 'href'));
  assert.deepEqual(cards, apps);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const urls = JSON.stringify(ld);
  for (const url of apps) assert.ok(urls.includes(url), url);
  for (const path of ['index.html', 'robots.txt', 'sitemap.xml', 'llms.txt']) {
    const text = read(path);
    assert.ok(text.includes('https://apps.garciadev.tech/'), path);
    assert.doesNotMatch(text, /apps-hub-beta\.vercel\.app|weight-charts\.vercel\.app|refeicao-livre\.vercel\.app|calculadora-tmb-five\.vercel\.app|bancada\.garciadev\.tech/);
  }
  const canonical = [...html.matchAll(/<link\b[^>]*>/g)].find(m => attr(m[0], 'rel') === 'canonical');
  assert.equal(attr(canonical[0], 'href'), 'https://apps.garciadev.tech/');
  const manifest = JSON.parse(read('site.webmanifest'));
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
});
