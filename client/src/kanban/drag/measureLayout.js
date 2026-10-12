export function measureLayout(containerEl, excludeCardId) {
  const boardEls = [...containerEl.querySelectorAll('[data-board-id]')]
  return boardEls.map((boardEl) => {
    const rect = boardEl.getBoundingClientRect()
    const cardEls = [...boardEl.querySelectorAll('.card')].filter(
      (el) => el.dataset.cardId !== excludeCardId,
    )
    const midpoints = cardEls.map((el) => {
      const cardRect = el.getBoundingClientRect()
      return { cardId: el.dataset.cardId, midpoint: cardRect.top + cardRect.height / 2 }
    })
    return { boardId: boardEl.dataset.boardId, left: rect.left, right: rect.right, midpoints }
  })
}
