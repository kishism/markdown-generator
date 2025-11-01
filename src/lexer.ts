// src/lexer.ts

export type Token = 
    | { type: "heading"; level: number; content: string }
    | { type: "paragraph"; content: string };

function tokenize(markdown: string): Token[] {
    const lines = markdown.split(/\r?\n/);
    const tokens: Token[] = [];
    let buffer: string[] = [];

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

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch && headingMatch[1] && headingMatch[2]) {
            flushParagraph();
            const level = headingMatch[1].length;
            const content = headingMatch[2];
            tokens.push({ type: "heading", level, content });
        } else {
            buffer.push(trimmed);
        }
    }

    flushParagraph();
    return tokens;
}

module.exports = { tokenize };
