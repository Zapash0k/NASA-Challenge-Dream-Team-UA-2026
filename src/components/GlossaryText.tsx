import { useState, type ReactNode } from 'react';
import glossaryData from '../content/glossary.json';

type GlossaryEntry = {
  term: string;
  short: string;
};

const GLOSSARY = glossaryData as Record<string, GlossaryEntry>;

// Сортуємо ключі від довших до коротших, щоб уникнути часткових збігів
const TERM_KEYS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
const ESCAPED_KEYS = TERM_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const TERM_REGEX = new RegExp(`(?<![a-zA-Z/])(${ESCAPED_KEYS.join('|')})(?![a-zA-Z/])`, 'gi');

function findGlossaryEntry(word: string): GlossaryEntry | undefined {
  const lower = word.toLowerCase();
  const matchedKey = TERM_KEYS.find((k) => k.toLowerCase() === lower);
  return matchedKey ? GLOSSARY[matchedKey] : undefined;
}

export function TermTooltip({
  termKey,
  children,
}: {
  termKey: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const entry = findGlossaryEntry(termKey);

  if (!entry) {
    return <>{children ?? termKey}</>;
  }

  return (
    <span
      className="glossary-term-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
      }}
    >
      <span className="glossary-term">
        {children ?? termKey}
        <span className="glossary-badge" aria-hidden="true">?</span>
      </span>

      {open && (
        <span className="glossary-popover" role="tooltip">
          <strong className="glossary-popover-title">{entry.term}</strong>
          <span className="glossary-popover-body">{entry.short}</span>
        </span>
      )}
    </span>
  );
}

export default function GlossaryText({ text }: { text: string }) {
  if (!text) return null;

  const parts = text.split(TERM_REGEX);

  return (
    <>
      {parts.map((part, idx) => {
        const entry = findGlossaryEntry(part);
        if (entry) {
          return (
            <TermTooltip key={idx} termKey={part}>
              {part}
            </TermTooltip>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}