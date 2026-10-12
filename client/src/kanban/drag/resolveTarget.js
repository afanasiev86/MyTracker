import { findBoardLayoutAtX } from './findBoardLayoutAtX.js'
import { findIndexAtY } from './findIndexAtY.js'

export function resolveTarget(layouts, boardsSnapshot, clientX, clientY) {
  const boardLayout = findBoardLayoutAtX(layouts, clientX)
  const board = boardsSnapshot[boardLayout.boardId]
  const index = findIndexAtY(boardLayout, board, clientY)
  return { boardId: boardLayout.boardId, index }
}
