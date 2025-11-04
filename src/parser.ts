// src/parser.ts

import type { Token } from "./lexer";

export interface Node {
    type: 
        "Document" | "Heading" | "Paragraph" | "Image" | "Link";
    children?: Node[]

    // Heading & Paragraph
    level?: number;
    content?: string;

    // Image
    alt?: string;
    src?: string;

    // Link
    href?: string;
    text?: string;
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
            });
        } else if (token.type === 'link') {
            root.children!.push({
                type: "Link",
                href: token.href,
                text: token.text,
            });
        }
    }

    return root;
}

module.exports = { parse };