// src/index.ts

const fs = require('fs');
const path = require('path');

import type { Token } from './lexer';
const { tokenize } = require('./lexer');
const { parse } = require("./parser");
const { nodeToHTML } = require('./emitter');

const mdPath = path.join(__dirname, '../projects/example.md');
const markdown = fs.readFileSync(mdPath, 'utf-8');

const tokens: Token[] = tokenize(markdown);
console.log("Tokenizing..\n", tokens);

const ast = parse(tokens);
console.log("Constructing AST\n", JSON.stringify(ast, null, 2))

const html = 
`<!DOCTYPE HTML>
<head>
<title> Produced HTML </title>
</head>
<body>
${nodeToHTML(ast)}
</body>
</html>`

const outputDir = path.join(__dirname, '../dist');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const outputPath = path.join(outputDir, 'example.html');
fs.writeFileSync(outputPath, html)

console.log(`HTML successfully generated at ${outputPath}`);