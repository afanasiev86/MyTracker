export function getScrollDelta(scrollContainer, prevScrollLeft) {
  if (!scrollContainer) return { dx: 0, scrollLeft: 0 }
  const scrollLeft = scrollContainer.scrollLeft
  return { dx: scrollLeft - prevScrollLeft, scrollLeft }
}
