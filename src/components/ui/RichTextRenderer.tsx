/**
 * Rich text renderer (§12.2, §23).
 *
 * Every link is sanitised through the protocol allowlist before it reaches the
 * DOM, external links get the correct `rel` plus an accessible-name hint, and
 * embeds must pass the provider allowlist or they are dropped silently.
 */

import type { RichText, RichTextBlock, RichTextSpan } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { canRenderImage } from "@/content/policy";
import { isAllowedEmbed, sanitizeUrl } from "@/lib/security/url";
import { ResponsiveImage } from "./ResponsiveImage";
import { ExternalIcon } from "./index";
import styles from "./rich-text.module.css";

function renderSpans(spans: RichTextSpan[]) {
  return spans.map((span, index) => {
    let node: React.ReactNode = span.text;

    for (const mark of span.marks ?? []) {
      if (mark.type === "strong") node = <strong>{node}</strong>;
      else if (mark.type === "em") node = <em>{node}</em>;
      else if (mark.type === "code") node = <code>{node}</code>;
      else if (mark.type === "link") {
        const href = sanitizeUrl(mark.href);
        // A blocked protocol degrades to plain text rather than a dead link.
        if (!href) continue;
        node = mark.isExternal ? (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {node}
            <ExternalIcon />
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        ) : (
          <a href={href}>{node}</a>
        );
      }
    }

    return <span key={index}>{node}</span>;
  });
}

function renderBlock(block: RichTextBlock, index: number, policy: PolicyContext) {
  switch (block.type) {
    case "paragraph":
      return <p key={index}>{renderSpans(block.spans)}</p>;

    case "heading": {
      const Heading = `h${block.level}` as "h2" | "h3" | "h4";
      return <Heading key={index}>{renderSpans(block.spans)}</Heading>;
    }

    case "list": {
      const List = block.style === "number" ? "ol" : "ul";
      return (
        <List key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderSpans(item)}</li>
          ))}
        </List>
      );
    }

    case "blockquote":
      return (
        <figure key={index} className={styles.quote}>
          <blockquote>
            <p className="type-quote">{renderSpans(block.spans)}</p>
          </blockquote>
          {block.attribution ? <figcaption>{block.attribution}</figcaption> : null}
        </figure>
      );

    case "image": {
      if (!canRenderImage(block.image, policy)) return null;
      return (
        <figure key={index} className={styles.figure}>
          <ResponsiveImage
            image={block.image}
            policy={policy}
            sizes="(min-width: 992px) 760px, 100vw"
            fit="cover"
          />
          {block.image.caption ? <figcaption>{block.image.caption}</figcaption> : null}
        </figure>
      );
    }

    case "embed": {
      if (!isAllowedEmbed(block.provider, block.url)) return null;
      return (
        <div key={index} className={styles.embed}>
          <iframe
            src={block.url}
            title={block.title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      );
    }
  }
}

export function RichTextRenderer({
  value,
  policy,
  className,
}: {
  value: RichText | undefined;
  policy: PolicyContext;
  className?: string;
}) {
  if (!value?.length) return null;
  return (
    <div className={[styles.richText, className].filter(Boolean).join(" ")}>
      {value.map((block, index) => renderBlock(block, index, policy))}
    </div>
  );
}
