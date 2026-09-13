#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const source = process.argv[2] || path.join(projectRoot, 'orhanakyavuz-v4', 'assets', 'images', 'logo-source.png');
const output = path.join(projectRoot, 'orhanakyavuz-v4', 'assets', 'icons');

if (!fs.existsSync(source)) {
  console.error('Source image not found:', source);
  console.error('Place your master logo at:', source);
  process.exit(1);
}

fs.mkdirSync(output, { recursive: true });

console.log('Generating favicons from:', source);
console.log('Output folder:', output);

// Use npx favicons to generate icon set. This keeps the workspace free of heavy image deps.
const res = spawnSync('npx', [
  '--yes',
  'favicons',
  source,
  '--output',
  output,
  '--icons',
  'android,appleIcon,coast,firefox,windows,yandex,favicons'
], { stdio: 'inherit' });

if (res.error) {
  console.error('Error running favicons:', res.error);
  process.exit(1);
}

process.exit(res.status);
