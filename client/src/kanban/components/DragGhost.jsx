export default function DragGhost({ drag }) {
  if (!drag) return null

  return (
    <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
      {drag.text}
    </div>
  )
}
