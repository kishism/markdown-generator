// src/lexer.ts

export type Token = 
    | { type: "heading"; level: number; content: string }
    | { type: "paragraph"; content: string }
    | { type: "image"; alt: string; src: string }
    | { type: "link"; href: string; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] };

function tokenize(markdown: string): Token[] {
    const lines = markdown.split(/\r?\n/);
    const tokens: Token[] = [];
    let buffer: string[] = [];
    let listBuffer: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = () => {
        if (listBuffer.length > 0 && listType) {
            tokens.push({ type: listType, items: listBuffer });
            listBuffer = [];
            listType = null;
        }
    };

    const flushParagraph = () => {
        if (buffer.length > 0) {
            tokens.push({ type: "paragraph", content: buffer.join(" ") });
            buffer = [];
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            flushParagraph();
            continue;
        }

        const handled = handleToken(trimmed);
        if (!handled) {
            buffer.push(trimmed);
        }
    }

    function handleToken(line: string) {
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch && headingMatch[1] && headingMatch[2]) {
            flushParagraph();
            const level = headingMatch[1].length;
            const content = headingMatch[2];
            tokens.push({ type: "heading", level, content });
            return true;
        }
        
        const imageMatch = line.match(/!\[(.*?)]\((.*?)\)/);
        if (imageMatch && imageMatch[1] && imageMatch[2]) {
            flushParagraph();
            const alt = imageMatch[1];
            const src = imageMatch[2];
            tokens.push({ type: "image", src, alt });
            return true;
        }

        const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch && linkMatch[1] && linkMatch[2]) {
            flushParagraph();
            const href = linkMatch[1];
            const text = linkMatch[2];
            tokens.push({ type: "link", href, text });
            return true;
        }

        const ulMatch = line.match(/^[-*+]\s+(.*)$/);
        if (ulMatch?.[1]) {
            if (listType !== "ul") flushList();
            listType = "ul";
            listBuffer.push(ulMatch[1]);
            return true; 
        }

        const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (olMatch?.[2]) {
            if (listType !== "ol") flushList();
            listType = "ol";
            listBuffer.push(olMatch[2]);
            return true; 
        }

        flushList();
        return false;
    }

    flushParagraph();
    flushList(); 
    return tokens;
}

module.exports = { tokenize };
