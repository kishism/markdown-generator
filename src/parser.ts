// src/parser.ts

import type { Token } from "./lexer";

export interface Node {
    type: 
        "Document" | "Heading" | "Paragraph" | "Image";
    children?: Node[]
    level?: number;
    content?: string;

    alt?: string;
    src?: string;
}

function parse(tokens: Token[]): Node {
    const root: Node = {
        type: "Document",
        children: [],
    };

    for (const token of tokens) {
        if (token.type === "heading") {
            root.children!.push({
                type: "Heading",
                level: token.level,
                content: token.content,
            });
        } else if (token.type === 'paragraph') {
            root.children!.push({
                type: "Paragraph",
                content: token.content,
            });
        } else if (token.type === 'image') {
            root.children!.push({
                type: "Image",
                alt: token.alt,
                src: token.src,
            })
        }
    }

    return root;
}

module.exports = { parse };