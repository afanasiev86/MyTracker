export default function Card({ card, boardId, onPointerDown }) {
  function handlePointerDown(e) {
    onPointerDown(e, card, boardId)
  }

  return (
    <div className="card" data-card-id={card.id} onPointerDown={handlePointerDown}>
      {card.content ?? card.text}
    </div>
  )
}
