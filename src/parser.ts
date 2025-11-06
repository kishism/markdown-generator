// src/parser.ts

import type { Token, InlineToken } from "./lexer";

export interface Node {
    type: "Document" 
        | "Heading" 
        | "Paragraph" 
        | "Image" 
        | "Link"
        | "UL"
        | "OL"
        | "LI"
        | "CodeBlock"
        | "Text"
        | "Bold"
        | "Italic"
        | "Break"
        | "HR";

    children?: Node[]

    // Heading & Paragraph
    level?: number;

    // Inline text
    content?: string;

    // Image
    alt?: string;
    src?: string;

    // Link
    href?: string;
    text?: string;

    // Codeblock
    lang?: string | undefined;
}

function parseInlineTokens(inlines: InlineToken[]): Node[] {
    return inlines.map(token => {
        switch (token.type) {
            case "text":
                return { type: "Text", content: token.content };
            case "bold":
                return { type: "Bold", children: parseInlineTokens(token.content) };
            case "italic":
                return { type: "Italic", children: parseInlineTokens(token.content) };
            case "link":
                return { type: "Link", href: token.href, children: parseInlineTokens(token.content) };
            case "break":
                return { type: "Break" };
        }
    });
}

function parse(tokens: Token[]): Node {
    const root: Node = {
        type: "Document",
        children: [],
    };

    for (const token of tokens) {
        switch (token.type) {
            case "heading":
                root.children!.push({
                    type: "Heading",
                    level: token.level,
                    children: parseInlineTokens(token.content),
                });
                break;

            case "paragraph":
                root.children!.push({
                    type: "Paragraph",
                    children: parseInlineTokens(token.content),
                });
                break;
            
            case "link":
                root.children!.push({
                    type: "Link",
                    href: token.href,
                    children: [{ type: "Text", content: token.text }],
                });
                break;

            case "image":
                root.children!.push({
                    type: "Image",
                    alt: token.alt,
                    src: token.src,
                });
                break;

            case "ul":
                root.children!.push({
                    type: "UL",
                    children: token.items.map(item => ({
                        type: "LI",
                        children: parseInlineTokens([{ type: "text", content: item }])
                    }))
                });
                break;

            case "ol":
                root.children!.push({
                    type: "OL",
                    children: token.items.map(item => ({
                        type: "LI",
                        children: parseInlineTokens([{ type: "text", content: item }])
                    }))
                });
                break;

            case "code_block":
                root.children!.push({
                    type: "CodeBlock",
                    content: token.content,
                    lang: token.lang,
                });
                break;

            case "hr":
                root.children!.push({ type: "HR" });
                break;
        }
    }

    return root;
}

module.exports = { parse };