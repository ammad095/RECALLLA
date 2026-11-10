// ============================================================
// FILE PATH:  recalla/src/ui/Markdown.jsx
// PURPOSE:    Just enough Markdown for Recalla's answers: paragraphs,
//             bullet and numbered lists, bold, italics, inline code.
//             Builds React elements — never raw HTML — so a reply can
//             never inject markup into the page.
// ============================================================

// **bold**, *italic* / _italic_, `code`
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

function inline(text, key) {
  return text.split(INLINE).map((part, i) => {
    const k = `${key}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={k} className="font-medium">{part.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(part)) return <code key={k} className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    if (/^(\*[^*].*\*|_[^_].*_)$/.test(part)) return <em key={k}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function Markdown({ text = "" }) {
  const blocks = [];
  let list = null;   // { ordered, items }
  let para = [];

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", lines: para });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: "list", ...list });
    list = null;
  };

  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const number = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^#{1,4}\s+(.*)$/);

    if (bullet || number) {
      flushPara();
      const ordered = Boolean(number);
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push((bullet || number)[1]);
    } else if (!line.trim()) {
      flushPara(); flushList();
    } else if (heading) {
      flushPara(); flushList();
      blocks.push({ type: "h", text: heading[1] });
    } else if (list && /^\s{2,}/.test(raw)) {
      // An indented line continues the previous list item.
      list.items[list.items.length - 1] += ` ${line.trim()}`;
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara(); flushList();

  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) => {
        if (b.type === "h") return <p key={i} className="font-medium">{inline(b.text, i)}</p>;
        if (b.type === "list") {
          const Tag = b.ordered ? "ol" : "ul";
          return (
            <Tag key={i} className={`space-y-1.5 pl-5 ${b.ordered ? "list-decimal" : "list-disc"} marker:text-subtle`}>
              {b.items.map((item, j) => <li key={j} className="pl-1">{inline(item, `${i}-${j}`)}</li>)}
            </Tag>
          );
        }
        return (
          <p key={i}>
            {b.lines.map((l, j) => (
              <span key={j}>{j > 0 && <br />}{inline(l, `${i}-${j}`)}</span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
