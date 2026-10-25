import { PanelIcon } from './Icons'

// A drop-down panel: a button with an icon, the title and a one-line summary, and the content
// underneath when it is open. Only one panel is open at a time (the parent holds `open`); the
// button at the bottom of an open panel closes it and returns to the list.
export default function Panel({ id, icon, title, summary, open, onToggle, onHome, homeLabel = 'Home', children }) {
  const isOpen = open === id
  return (
    <div className={`panel${isOpen ? ' open' : ''}`}>
      <button className="panel-head" onClick={() => onToggle(isOpen ? null : id)} aria-expanded={isOpen}>
        {icon && <PanelIcon name={icon} />}
        <span className="panel-text">
          <span className="panel-title">{title}</span>
          <span className="panel-sum">{summary}</span>
        </span>
        <span className="panel-chev" aria-hidden="true">▾</span>
      </button>
      {isOpen && (
        <div className="panel-body">
          {children}
          <button className="panel-home" onClick={onHome}>{homeLabel}</button>
        </div>
      )}
    </div>
  )
}
