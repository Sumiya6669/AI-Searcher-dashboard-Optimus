import type { ReactNode } from 'react';

/**
 * Разбор ответа модели. Полноценный markdown здесь не нужен и вреден: ответ
 * приходит из внешнего сценария, и подставлять его в разметку как html значило
 * бы отдать оформление страницы во власть текста. Поэтому разбираются только
 * три вещи, которые модель действительно использует, — абзацы, перечисления и
 * полужирный, — а всё остальное остаётся текстом.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((part, index) => {
    const key = `${keyBase}-${index}`;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-[var(--color-ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;

interface Block {
  kind: 'text' | 'list';
  lines: string[];
}

function toBlocks(source: string): Block[] {
  const blocks: Block[] = [];

  for (const raw of source.split('\n')) {
    const line = raw.replace(/^#{1,6}\s+/, '').trimEnd();
    if (line.trim() === '') continue;

    const kind: Block['kind'] = BULLET.test(line) ? 'list' : 'text';
    const value = kind === 'list' ? line.replace(BULLET, '') : line.trim();
    const last = blocks[blocks.length - 1];

    if (last && last.kind === kind && kind === 'list') {
      last.lines.push(value);
    } else {
      blocks.push({ kind, lines: [value] });
    }
  }

  return blocks;
}

export function Answer({ text }: { text: string }) {
  const blocks = toBlocks(text);

  return (
    <div className="space-y-2 text-[13.5px] leading-6 text-[var(--color-ink-2)]">
      {blocks.map((block, index) =>
        block.kind === 'list' ? (
          <ul key={index} className="space-y-1 pl-4">
            {block.lines.map((line, i) => (
              <li key={i} className="list-disc">
                {inline(line, `${index}-${i}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>{inline(block.lines[0] ?? '', String(index))}</p>
        ),
      )}
    </div>
  );
}
