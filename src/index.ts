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

const customTemplatePathFile = path.join(__dirname, "../projects")
const files: string[] = fs.readdirSync(customTemplatePathFile);
let atomTemplateFile = files.find((f: string) => f.endsWith(".html"));

let atomTemplate: string = "";

if (atomTemplateFile) {
    try {
        atomTemplate = fs.readFileSync(
            path.join(customTemplatePathFile, atomTemplateFile),
            "utf-8"
        );
    } catch {
        atomTemplate = "";
    }
}

const validateTemplate = 
   (atomTemplate.includes("<html>") || atomTemplate.includes("<!DOCTYPE html>")) &&
    atomTemplate.includes("<head>") && 
    atomTemplate.includes("<body>");

let html = "";

if (validateTemplate) {
    html = atomTemplate.replace(
        /<body.*?>[\s\S]*<\/body>/i,
    `<body>\n${nodeToHTML(ast)}\n</body>`
    )
} else {
html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Blog Post</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f7f7;
      color: #333;
      display: flex;
      justify-content: center; 
      padding-top: 50px;
    }

    .content {
      max-width: 700px; 
      background-color: #fff;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-radius: 8px;
    }

    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
    }

    p {
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    img {
      max-width: 100%;
      display: block;
      margin: 1rem 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="content">
    ${nodeToHTML(ast)}
  </div>
</body>
</html>
`;
}

const outputDir = path.join(__dirname, '../dist');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const mdFileName = "example.md"; // this needs to be dynamically detected
const outputFileName = mdFileName.replace(/\.md$/, ".html");
const outputPath = path.join(outputDir, outputFileName);
fs.writeFileSync(outputPath, html)

console.log(`HTML successfully generated at ${outputPath}`);