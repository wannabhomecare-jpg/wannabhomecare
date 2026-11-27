/**
 * 문구의 줄바꿈(\n)과 목록('· ' 로 시작하는 줄)을 그린다. 글자는 바꾸지 않는다.
 */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: ({ type: "p"; text: string } | { type: "ul"; items: string[] })[] = [];
  for (const line of lines) {
    if (line.startsWith("· ")) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.items.push(line.slice(2));
      else blocks.push({ type: "ul", items: [line.slice(2)] });
    } else if (line.trim()) blocks.push({ type: "p", text: line });
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i}>{b.text}</p>
        ) : (
          <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-brand-500">
            {b.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
