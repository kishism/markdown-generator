// src/lexer.ts

export type InlineToken =
    | { type: "text"; content: string }
    | { type: "bold"; content: InlineToken[] }
    | { type: "italic"; content: InlineToken[] }
    | { type: "link"; href: string; content: InlineToken[] };

export type Token = 
    | { type: "heading"; level: number;  content: InlineToken[] }
    | { type: "paragraph"; content: InlineToken[] }
    | { type: "image"; alt: string; src: string }
    | { type: "link"; href: string; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
    | { type: "code_block"; content: string; lang?: string };

function tokenize(markdown: string): Token[] {
    const lines = markdown.split(/\r?\n/);
    const tokens: Token[] = [];
    let buffer: string[] = [];
    let listBuffer: string[] = [];
    let listType: "ul" | "ol" | null = null;

    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLang: string | undefined;

    const flushList = () => {
        if (listBuffer.length > 0 && listType) {
            tokens.push({ type: listType, items: listBuffer });
            listBuffer = [];
            listType = null;
        }
    };

    const flushParagraph = () => {
        if (buffer.length > 0) {
            tokens.push({ type: "paragraph", content: parseInline(buffer.join(" ")) });
            buffer = [];
        }
    };

    for (const line of lines) {
        const codeFence = line.match(/^```(\w+)?/);
        if (codeFence) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeLang = codeFence[1];
            } else {
                inCodeBlock = false;
                tokens.push({
                    type: "code_block",
                    content: codeBuffer.join("\n"),
                    ...(codeLang ? { lang: codeLang } : {}),
                });
                codeBuffer = [];
                codeLang = undefined;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(line);
            continue;
        }

        const trimmed = line.trim();
        if (!trimmed) {
            flushParagraph();
            flushList();
            continue;
        }

        const handled = handleToken(trimmed);
        if (!handled) {
            buffer.push(trimmed);
        }
    }

    flushParagraph();
    flushList();
    return tokens;

    function handleToken(line: string) {
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch && headingMatch[1] && headingMatch[2]) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            const content = headingMatch[2];
            tokens.push({ type: "heading", level, content: parseInline(headingMatch[2]) });
            return true;
        }
        
        const imageMatch = line.match(/!\[(.*?)]\((.*?)\)/);
        if (imageMatch && imageMatch[1] && imageMatch[2]) {
            flushParagraph();
            flushList();
            const alt = imageMatch[1];
            const src = imageMatch[2];
            tokens.push({ type: "image", src, alt });
            return true;
        }

        const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch && linkMatch[1] && linkMatch[2]) {
            flushParagraph();
            flushList();
            const text = linkMatch[1];
            const href = linkMatch[2];
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
}

function parseInline(text: string): InlineToken[] {
    const tokens: InlineToken[] = [];
    let i = 0;

    while (i < text.length) {
        if (text.slice(i, i + 2) === "**") {
            const end = text.indexOf("**", i + 2);
            if (end !== -1) {
                tokens.push({ type: "bold", content: parseInline(text.slice(i + 2, end)) });
                i = end + 2;
                continue;
            } else {
                tokens.push({ type: "text", content: text.slice(i) });
                break;
            }
        }

        if (text[i] === "*") {
            const end = text.indexOf("*", i + 1);
            if (end !== -1) {
                tokens.push({ type: "italic", content: parseInline(text.slice(i + 1, end)) });
                i = end + 1;
                continue;
            } else {
                tokens.push({ type: "text", content: text.slice(i) });
                break;
            }
        }

        if (text[i] === "[") {
            const closeBracket = text.indexOf("]", i);
            const openParen = text.indexOf("(", closeBracket);
            const closeParen = text.indexOf(")", openParen);
            if (closeBracket !== -1 && openParen === closeBracket + 1 && closeParen !== -1) {
                const linkText = text.slice(i + 1, closeBracket);
                const href = text.slice(openParen + 1, closeParen);
                tokens.push({ type: "link", href, content: parseInline(linkText) });
                i = closeParen + 1;
                continue;
            } else {
                tokens.push({ type: "text", content: text.slice(i, i+1) });
                i++;
                continue;
            }
        }

        let nextMarker = text.slice(i).search(/(\*\*|\*|\[)/);
        if (nextMarker === -1) nextMarker = text.length - i;
        tokens.push({ type: "text", content: text.slice(i, i + nextMarker) });
        i += nextMarker;
    }

    return tokens;
}

module.exports = { tokenize };
