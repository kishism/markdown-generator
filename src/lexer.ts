// src/lexer.ts

export type Token = 
    | { type: "heading"; level: number; content: string }
    | { type: "paragraph"; content: string }
    | { type: "image"; alt: string; src: string }
    | { type: "link"; href: string; text: string }

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

        return false;
    }

    flushParagraph();
    return tokens;
}

module.exports = { tokenize };
