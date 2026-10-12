export function findIndexAtY(boardLayout, board, clientY) {
  for (let i = 0; i < boardLayout.midpoints.length; i++) {
    if (clientY < boardLayout.midpoints[i].midpoint) {
      return board.cards.findIndex((c) => c.id === boardLayout.midpoints[i].cardId)
    }
  }
  return board.cards.length
}
