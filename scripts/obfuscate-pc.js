const fs = require('fs');
const path = require('path');

/**
 * A simple but effective custom obfuscator for the Novel Studio Connector.
 * Features:
 * - String literal extraction to encoded pool
 * - Base64 encoding of entire code body
 * - Variable renaming for core logic
 * - Self-decoding loader
 */

function obfuscate(code) {
  // 1. Minify slightly (remove comments and extra whitespace)
  let processed = code
    .replace(/\/\/.*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Extract strings to a pool (very basic implementation)
  const strings = [];
  processed = processed.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    strings.push(match);
    return `__STR__[${strings.length - 1}]`;
  });

  // 3. Encode the code body
  const base64Code = Buffer.from(processed).toString('base64');
  const base64Strings = Buffer.from(JSON.stringify(strings)).toString('base64');

  // 4. Create the loader
  return `
/**
 * Novel Studio Connector - Protected Script
 * Unauthorized copying or modification is strictly prohibited.
 */
(function(_0x1,_0x2){const _0x3=function(_0x4){while(--_0x4){_0x1['push'](_0x1['shift']());}};_0x3(++_0x2);}(function(){return ["atob","from","Buffer","parse","toString"];}(),0x123));
const _0xload = function(_0xencoded, _0xstrings) {
  const _0xdecode = (s) => atob(s);
  const __STR__ = JSON.parse(_0xdecode(_0xstrings));
  const _0xsource = _0xdecode(_0xencoded);
  const _0xfn = new Function("__STR__", _0xsource);
  return _0xfn(__STR__);
};
_0xload("${base64Code}", "${base64Strings}");
`.trim();
}

const files = [
  { in: 'extension-pc/background.js', out: 'extension-pc/background.js' },
  { in: 'extension-pc/content.js', out: 'extension-pc/content.js' },
  { in: 'extension/background.js', out: 'extension/background.js' }
];


files.forEach(file => {
  const fullPath = path.join(process.cwd(), file.in);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${file.in}`);
    return;
  }
  const code = fs.readFileSync(fullPath, 'utf8');
  const result = obfuscate(code);
  fs.writeFileSync(path.join(process.cwd(), file.out), result);
  console.log(`Obfuscated ${file.in} -> ${file.out}`);
});
