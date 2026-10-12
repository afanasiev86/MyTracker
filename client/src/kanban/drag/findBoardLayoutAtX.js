export function findBoardLayoutAtX(layouts, clientX) {
  const matched = layouts.find((b) => clientX >= b.left && clientX < b.right)
  if (matched) return matched

  return clientX < layouts[0].left ? layouts[0] : layouts[layouts.length - 1]
}
