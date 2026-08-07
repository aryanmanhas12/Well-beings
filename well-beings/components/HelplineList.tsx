import { helplineHref } from "@/lib/helplines";
import { HelplineEntry } from "@/lib/types";

/**
 * One renderer for every surface that lists helplines — the crisis dialog,
 * the crisis card in chat, the results banner and the support tab.
 *
 * It exists because those four had drifted into four slightly different
 * layouts, and only one of them made the number tappable. A person reaching
 * any of them is having the same bad moment; they should all behave the same.
 *
 * The number itself is the link. On a phone that dials or opens a message
 * with the keyword pre-filled; on desktop `tel:` is inert, which is fine —
 * the text is still selectable and the name still carries its website.
 */
export function HelplineList({
  lines,
  tone = "surface",
}: {
  lines: HelplineEntry[];
  /** "accent" for the crisis gradients, which supply their own contrast. */
  tone?: "surface" | "accent";
}) {
  const nameColor = tone === "accent" ? "var(--color-accent-100)" : "var(--color-text)";
  const metaColor = tone === "accent" ? "var(--color-accent-300)" : "var(--color-neutral-500)";
  const contactColor = tone === "accent" ? "var(--color-accent-200)" : "var(--color-accent-300)";
  const border =
    tone === "accent"
      ? "1px solid color-mix(in srgb, var(--color-accent-300) 25%, transparent)"
      : "1px solid var(--color-divider)";

  return (
    <div>
      {lines.map((h) => {
        const href = helplineHref(h);
        return (
          <div
            key={h.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap",
              padding: "10px 0",
              borderTop: border,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: nameColor }}>
                {/* The name links to the operator's own site, so "is this real?"
                    is answerable without leaving for a search engine. */}
                {h.url ? (
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "underline", textDecorationColor: metaColor }}
                  >
                    {h.name}
                  </a>
                ) : (
                  h.name
                )}
              </div>
              {(h.who || h.hours) && (
                <div style={{ fontSize: 11, color: metaColor, textWrap: "pretty" }}>
                  {[h.who, h.hours].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            {href ? (
              <a
                href={href}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                style={{ fontWeight: 500, color: contactColor, whiteSpace: "nowrap", fontSize: 13.5 }}
              >
                {h.contact}
              </a>
            ) : (
              <span style={{ fontWeight: 500, color: contactColor, whiteSpace: "nowrap", fontSize: 13.5 }}>
                {h.contact}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
