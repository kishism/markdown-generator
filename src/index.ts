// src/index.ts

const fs = require('fs');
const path = require('path');

import type { Token } from './lexer';
const { tokenize } = require('./lexer');
const { parse } = require("./parser");
const { nodeToHTML } = require('./emitter');

const projectDir = path.join(__dirname, "../projects");
const distDir = path.join(__dirname, "../dist");
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

// -- Parse Front Matter and Validate Template
function parseFrontMatter(markdown: string) {
  const match = markdown.match(/^---\s*([\s\S]+?)\s*---/);
  if (!match) 
    return {
      metadata: {}, 
      content: markdown 
    };

    const rawRead = match[1];
    const metadata: Record<string, string> = {};
    rawRead?.trim().split(/\r?\n/).forEach(line => {
      const [key, ...rest] = line.split(":");
      if (key && rest.length === 0) {
        console.warn(`> Ignoring invalid frontmatter line: "${line}"`);
    }
    
      if (key && rest.length > 0) {
        metadata[key.trim()] = rest.join(":").trim();
      }
    });

    const content = markdown.slice(match[0].length).trim();
    return { metadata, content };
}

function getDefaultTemplate(content: string) {
  return `
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
  h1,h2,h3,h4,h5,h6 { font-weight: 600; margin-top: 1.5rem; margin-bottom: 1rem; }
  p { line-height: 1.6; margin-bottom: 1rem; }
  img { max-width: 100%; display: block; margin: 1rem 0; border-radius: 4px; }
</style>
</head>
<body>
<div class="content">
  ${content}
</div>
</body>
</html>`;
}

function validateTemplate(template: string) {
  const lower = template.toLowerCase();
  return (
      (lower.includes("<html>") || lower.includes("<!DOCTYPE html>")) &&
      lower.includes("<head>") &&
      lower.includes("<body>")
  );
}

// --- Compiler Logic ---
const mdFiles = fs.readdirSync(projectDir).filter((f: string) => f.endsWith(".md"));
if (mdFiles.length === 0) throw new Error("No Markdown file found");

for (const mdFile of mdFiles) {
    if (!mdFile) continue;

    const markdownRaw = fs.readFileSync(path.join(projectDir, mdFile), "utf-8");
    if (!markdownRaw.trim()) {
      console.warn(`> Skipping empty file: ${mdFile}`);
      continue;
    }
    
    const { metadata, content } = parseFrontMatter(markdownRaw);

    const tokens: Token[] = tokenize(content);
    const ast = parse(tokens);
    const htmlFragment = nodeToHTML(ast);

    let atomTemplate = "";
    if (metadata.template) {
        const templatePath = path.join(projectDir, path.basename(metadata.template));
        if (fs.existsSync(templatePath)) {
            atomTemplate = fs.readFileSync(templatePath, "utf-8");
        }
    }

    let finalHTML = "";
    if (atomTemplate && validateTemplate(atomTemplate)) {
        finalHTML = atomTemplate.replace(
            /<body.*?>[\s\S]*<\/body>/i,
            `<body>\n${htmlFragment}\n</body>`
        );
    } else {
        finalHTML = getDefaultTemplate(htmlFragment);
    }

    const outputFileName = mdFile.replace(/\.md$/, ".html");
    const outputPath = path.join(distDir, outputFileName);
    if (fs.existsSync(outputPath)) {
      console.warn(`> Overwriting existing file: ${outputFileName}`);
    }
    fs.writeFileSync(outputPath, finalHTML, "utf-8");

    console.log(`> Generated ${outputFileName} using template "${metadata.template || "default"}"`);
}