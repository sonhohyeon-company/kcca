// Post body format, written in a plain textarea and rendered here. Nothing is ever
// interpreted as HTML: React escapes all text, and URLs are allow-listed below.
//
//   ## 소제목 / ### 작은 제목     headings
//   - 항목                        bullet list (consecutive lines)
//   ![설명](/uploads/abc.webp)    image on its own line
//   **굵게**  [링크 글자](https://…)  bare https:// URLs become links (ASCII only, so a
//   Korean particle right after one, as in "…/notice입니다", is not part of the link)
//   blank line = new paragraph, single line break = <br>
import Link from "next/link";
import type { ReactNode } from "react";

const imageLine = /^!\[([^\]\n]*)\]\(([^)\s]+)\)$/;
const headingLine = /^(#{2,3})\s+(.+)$/;
const bulletLine = /^[-*]\s+(.+)$/;
// Link label and URL lengths are capped (here and in toPlainText) so a line of unclosed "[" or
// "[a](" is scanned in linear time, not quadratic.
const inlinePattern =
  /\*\*(.+?)\*\*|\[([^\]\n]{1,300})\]\(([^)\s]{1,2000})\)|(https?:\/\/[^\s<>()\u0080-\uffff]*[^\s<>().,!?'"\u0080-\uffff])/g;

/** Only site-hosted images: uploads and bundled assets, no traversal. */
export function safeImageSrc(src: string) {
  return /^\/(uploads|assets)\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(
    src,
  ) && !src.includes("..")
    ? src
    : null;
}

export function safeHref(href: string) {
  if (/^https?:\/\/[^\s]+$/i.test(href)) return href;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href)) return href;
  if (/^tel:[0-9+\-() ]+$/i.test(href)) return href;
  if (/^\/(?![/\\])/.test(href)) return href;
  return null;
}

function renderLink(href: string, label: ReactNode, key: string) {
  const safe = safeHref(href);
  if (!safe) return <span key={key}>{label}</span>;
  if (/^https?:/i.test(safe)) {
    return (
      <a key={key} href={safe} target="_blank" rel="noopener noreferrer">
        {label}
        <span className="sr-only"> (새 창)</span>
      </a>
    );
  }
  // Files are plain links: next/link would prefetch (download) them.
  if (/^\/(uploads|assets)\//.test(safe)) {
    return (
      <a key={key} href={safe}>
        {label}
      </a>
    );
  }
  return (
    <Link key={key} href={safe}>
      {label}
    </Link>
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(inlinePattern)) {
    const key = `${keyPrefix}-${i++}`;
    const [whole, bold, label, href, bare] = match;
    if (match.index > last) out.push(text.slice(last, match.index));
    if (bold !== undefined) {
      out.push(<strong key={key}>{renderInline(bold, key)}</strong>);
    } else if (label !== undefined) {
      out.push(renderLink(href, label, key));
    } else {
      out.push(renderLink(bare, bare, key));
    }
    last = match.index + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderLines(lines: string[], key: string) {
  return lines.flatMap((line, index) => [
    ...(index ? [<br key={`${key}-br${index}`} />] : []),
    ...renderInline(line, `${key}-${index}`),
  ]);
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "h"; level: 2 | 3; text: string }
  | { type: "img"; src: string; alt: string };

function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  let open: Block | null = null;
  for (const raw of body.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      open = null;
      continue;
    }
    const image = imageLine.exec(line);
    const heading = headingLine.exec(line);
    const bullet = bulletLine.exec(line);
    if (image) {
      const src = safeImageSrc(image[2]);
      if (src) blocks.push({ type: "img", src, alt: image[1] });
      open = null;
    } else if (heading) {
      blocks.push({
        type: "h",
        level: heading[1].length as 2 | 3,
        text: heading[2],
      });
      open = null;
    } else if (bullet) {
      if (open?.type !== "ul") blocks.push((open = { type: "ul", items: [] }));
      open.items.push(bullet[1]);
    } else {
      if (open?.type !== "p") blocks.push((open = { type: "p", lines: [] }));
      open.lines.push(line);
    }
  }
  return blocks;
}

/**
 * A post picture at its natural size. Uploads come through the image optimizer at 1080px (a default
 * deviceSize; enough for a phone at 3x). No srcset: without stored dimensions, width descriptors
 * would shrink pictures narrower than the chosen width. The first picture is usually the LCP.
 */
export function BodyImage({
  src,
  alt,
  first,
}: {
  src: string;
  alt: string;
  first?: boolean;
}) {
  return (
    <figure>
      <img
        src={
          src.startsWith("/uploads/")
            ? `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`
            : src
        }
        alt={alt}
        loading={first ? "eager" : "lazy"}
        fetchPriority={first ? "high" : undefined}
        decoding="async"
      />
    </figure>
  );
}

/**
 * Renders a post body. Use inside an element with className="prose". eager=false when a
 * picture above the body (a cover) is the page's first one.
 */
export function renderBody(body: string, eager = true): ReactNode {
  const blocks = parseBody(body);
  const first = eager ? blocks.findIndex((block) => block.type === "img") : -1;
  return blocks.map((block, index) => {
    const key = `b${index}`;
    switch (block.type) {
      case "img":
        return (
          <BodyImage
            key={key}
            src={block.src}
            alt={block.alt}
            first={index === first}
          />
        );
      case "h":
        return block.level === 2 ? (
          <h2 key={key}>{renderInline(block.text, key)}</h2>
        ) : (
          <h3 key={key}>{renderInline(block.text, key)}</h3>
        );
      case "ul":
        return (
          <ul key={key}>
            {block.items.map((item, i) => (
              <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
            ))}
          </ul>
        );
      default:
        return <p key={key}>{renderLines(block.lines, key)}</p>;
    }
  });
}

/** Plain text for excerpts, search snippets and meta descriptions. */
export function toPlainText(body: string, maxLength = Infinity) {
  const text = parseBody(body)
    .flatMap((block) =>
      block.type === "img"
        ? []
        : block.type === "p"
          ? block.lines
          : block.type === "ul"
            ? block.items
            : [block.text],
    )
    .join(" ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[([^\]\n]{1,300})\]\(([^)\s]{1,2000})\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/** Image URLs in the body, in order (e.g. to pick a cover or og:image). */
export const bodyImages = (body: string) =>
  parseBody(body).flatMap((block) => (block.type === "img" ? [block.src] : []));
