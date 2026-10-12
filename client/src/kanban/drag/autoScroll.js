const EDGE_ZONE = 60 // px от края контейнера, где начинается автоскролл
const MAX_SPEED = 18 // px за кадр у самого края

function computeSpeed(distanceFromEdge) {
  const clamped = Math.max(0, Math.min(EDGE_ZONE, distanceFromEdge))
  return MAX_SPEED * (1 - clamped / EDGE_ZONE)
}

export function startAutoScroll(containerEl, getPointerX, onScroll) {
  let rafId = null

  function tick() {
    const rect = containerEl.getBoundingClientRect()
    const x = getPointerX()
    const distanceFromLeft = x - rect.left
    const distanceFromRight = rect.right - x

    let dx = 0
    if (distanceFromLeft < EDGE_ZONE) dx = -computeSpeed(distanceFromLeft)
    else if (distanceFromRight < EDGE_ZONE) dx = computeSpeed(distanceFromRight)

    if (dx !== 0) {
      const before = containerEl.scrollLeft
      containerEl.scrollLeft += dx
      if (containerEl.scrollLeft !== before) onScroll()
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(rafId)
}
