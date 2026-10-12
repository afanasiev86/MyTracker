import { SECTIONS } from './sections.js';

// Вкладки разделов владельца
export default function SectionTabs({ section, onSelect }) {
  return (
    <nav className="tabs" role="tablist" aria-label="Разделы">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          role="tab"
          aria-selected={section === s.id}
          className={section === s.id ? 'tab active' : 'tab'}
          onClick={() => onSelect(s.id)}
        >
          {s.title}
        </button>
      ))}
    </nav>
  );
}
