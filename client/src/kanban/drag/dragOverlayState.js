function isAdjacentToSource(index, sourceIndex) {
  if (sourceIndex === -1) return false
  return index === sourceIndex || index === sourceIndex + 1
}

export function computeDragOverlayState(board, dragCardId, dragFromBoardId, dragTarget) {
  const sourceIndex = board.cards.findIndex((c) => c.id === dragCardId)
  const dragOverIndex = dragTarget && dragTarget.boardId === board.id ? dragTarget.index : null
  const isSameBoardDrag =
    dragTarget !== null && dragFromBoardId === board.id && dragTarget.boardId === board.id
  const placeholderVisible =
    isSameBoardDrag && dragOverIndex !== null && !isAdjacentToSource(dragOverIndex, sourceIndex)

  return { sourceIndex, dragOverIndex, placeholderVisible, isAdjacentToSource }
}
