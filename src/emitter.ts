// src/emitter.ts

import type { Node } from './parser'; 

type VisitorMap = {
    [K in Exclude<Node['type'], 'Document'>]: (node: Node) => string;
};  

function renderChildren(node: Node): string {
    return node.children?.map(nodeToHTML).join('') ?? '';
}

const visitors: VisitorMap = {
    Heading: (n: Node) => {
        const level = Math.min(Math.max(n.level ?? 1, 1), 6);
        return `<h${level}>${renderChildren(n)}</h${level}>`;
    },

    Paragraph: (n: Node) => `<p>${renderChildren(n)}</p>`,
    Image: (n: Node) => `<img src="${n.src ?? ''}" alt="${n.alt ?? ''}" />`,
    Link: (n: Node) => `<a href="${n.href ?? ''}">${renderChildren(n)}</a>`,
    UL: (n: Node) => `<ul>\n${n.children?.map(nodeToHTML).join('\n') ?? ''}\n</ul>`,
    OL: (n: Node) => `<ol>\n${n.children?.map(nodeToHTML).join('\n') ?? ''}\n</ol>`,
    LI: (n: Node) => `<li>${renderChildren(n)}</li>`,
    CodeBlock: (n: Node) => {
        const langClass = n.lang ? ` class="language-${n.lang}"` : "";
        return `<pre><code${langClass}>${escapeHTML(n.content ?? "")}</code></pre>`;
    },
    Text: (n: Node) => escapeHTML(n.content ?? ""),
    Bold: (n: Node) => `<strong>${renderChildren(n)}</strong>`,
    Italic: (n: Node) => `<em>${renderChildren(n)}</em>`,
};


function escapeHTML(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
}
  
function nodeToHTML(node: Node): string {
    if (node.type === 'Document') {
        return node.children?.map(nodeToHTML).join('\n') ?? '';
    }

    return visitors[node.type]?.(node) ?? '';
}

// function nodeToHTML(node: Node): string {
//     switch(node.type) {
//         case 'Document':
//             return node.children?.map(nodeToHTML).join('\n') ?? '';
//         case 'Heading':
//             const level = Math.min(Math.max(node.level ?? 1, 1), 6);
//             return `<h${level}>${node.content ?? ''}</h${level}>`;
//         case 'Paragraph':
//             return `<p>${node.content ?? ''}</p>`;
//         case 'Image':
//             return `<img src="${node.src ?? ''}" alt="${node.alt ?? ''}" />`;
//         default:
//             return '';
//     }
// }

module.exports  = { nodeToHTML };
