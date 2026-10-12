export function moveCard(boards, { cardId, fromBoardId, toBoardId, toIndex }) {
  const fromCards = [...boards[fromBoardId].cards]
  const cardIndex = fromCards.findIndex((c) => c.id === cardId)
  if (cardIndex === -1) return boards

  const [card] = fromCards.splice(cardIndex, 1)

  const toCards = fromBoardId === toBoardId ? fromCards : [...boards[toBoardId].cards]
  let insertIndex = toIndex === null || toIndex === undefined ? toCards.length : toIndex
  if (fromBoardId === toBoardId && cardIndex < insertIndex) insertIndex -= 1
  toCards.splice(insertIndex, 0, card)

  return {
    ...boards,
    [fromBoardId]: { ...boards[fromBoardId], cards: fromCards },
    [toBoardId]: { ...boards[toBoardId], cards: toCards },
  }
}
