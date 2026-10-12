export function commitDrag(drag, onCardMove) {
  if (!drag || drag.target === null || drag.target === undefined) return
  if (drag.target.index === null || drag.target.index === undefined) return

  onCardMove({
    cardId: drag.cardId,
    fromBoardId: drag.fromBoardId,
    toBoardId: drag.target.boardId,
    toIndex: drag.target.index,
  })
}
