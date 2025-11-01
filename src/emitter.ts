// src/emitter.ts

import type { Node } from './parser'; 
const { parse } = require('./parser');

function nodeToHTML(node: Node): string {
    switch(node.type) {
        case 'Document':
            return node.children?.map(nodeToHTML).join('\n') ?? '';
        case 'Heading':
            const level = Math.min(Math.max(node.level ?? 1, 1), 6);
            return `<h${level}>${node.content ?? ''}</h${level}>`;
        case 'Paragraph':
            return `<p>${node.content ?? ''}</p>`;
        default:
            return '';
    }
}

module.exports  = { nodeToHTML };
