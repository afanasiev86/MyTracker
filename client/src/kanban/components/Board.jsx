import Card from './Card.jsx'
import { useFlipDrag } from '../hooks/useFlipDrag.js'
import { computeDragOverlayState } from '../drag/dragOverlayState.js'

export default function Board({ board, dragCardId, dragFromBoardId, dragTarget, onCardPointerDown, scrollContainerRef }) {
  const { sourceIndex, dragOverIndex, placeholderVisible, isAdjacentToSource } = computeDragOverlayState(
    board,
    dragCardId,
    dragFromBoardId,
    dragTarget,
  )
  const containerRef = useFlipDrag(
    [...board.cards.map((c) => c.id), dragOverIndex, placeholderVisible],
    scrollContainerRef,
  )

  return (
    <div className="board" data-board-id={board.id}>
      <h2 className="board-title">{board.title}</h2>
      <div ref={containerRef} className="board-cards">
        {board.cards.map((card, index) => (
          <div key={card.id}>
            {dragOverIndex === index && !isAdjacentToSource(index, sourceIndex) && (
              <div className="card-placeholder" />
            )}
            {card.id === dragCardId ? (
              placeholderVisible ? null : (
                <div className="drop-zone--source">
                  <Card card={card} boardId={board.id} onPointerDown={onCardPointerDown} />
                </div>
              )
            ) : (
              <Card card={card} boardId={board.id} onPointerDown={onCardPointerDown} />
            )}
          </div>
        ))}
        {dragOverIndex === board.cards.length &&
          !isAdjacentToSource(board.cards.length, sourceIndex) && (
            <div className="card-placeholder" />
          )}
        {board.cards.length === 0 && dragOverIndex === null && (
          <div className="board-empty">Нет карточек</div>
        )}
      </div>
    </div>
  )
}
