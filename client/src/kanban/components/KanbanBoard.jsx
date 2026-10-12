import { useRef } from 'react'
import Board from './Board.jsx'
import DragGhost from './DragGhost.jsx'
import { useDragController } from '../drag/useDragController.js'

export default function KanbanBoard({ boards, onCardMove, onCardClick, accentColor }) {
  const containerRef = useRef(null)
  const { drag, handleCardPointerDown } = useDragController(boards, onCardMove, containerRef, onCardClick)

  return (
    <div
      className="boards-wrap"
      ref={containerRef}
      style={accentColor ? { '--kanban-accent': accentColor } : undefined}
    >
      <div className="boards">
        {Object.values(boards).map((board) => (
          <Board
            key={board.id}
            board={board}
            dragCardId={drag?.cardId ?? null}
            dragFromBoardId={drag?.fromBoardId ?? null}
            dragTarget={drag?.target ?? null}
            onCardPointerDown={handleCardPointerDown}
            scrollContainerRef={containerRef}
          />
        ))}
      </div>
      <DragGhost drag={drag} />
    </div>
  )
}
