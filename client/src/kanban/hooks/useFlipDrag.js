import { useLayoutEffect, useRef } from 'react'
import { getScrollDelta } from './scrollCompensation.js'

const FLIP_DURATION = 250

function getCurrentTranslate(el) {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform)
  return { x: matrix.m41, y: matrix.m42 }
}

function getLayoutRect(el) {
  const rect = el.getBoundingClientRect()
  const translate = getCurrentTranslate(el)
  return {
    left: rect.left - translate.x,
    top: rect.top - translate.y,
  }
}

export function useFlipDrag(dependencyKey, scrollContainerRef) {
  const containerRef = useRef(null)
  const prevRectsRef = useRef(new Map())
  const prevScrollLeftRef = useRef(scrollContainerRef?.current?.scrollLeft ?? 0)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const { dx: scrollDeltaX, scrollLeft } = getScrollDelta(scrollContainerRef?.current, prevScrollLeftRef.current)
    prevScrollLeftRef.current = scrollLeft

    const prevRects = prevRectsRef.current
    const cardEls = container.querySelectorAll('[data-card-id]')
    const nextRects = new Map()

    cardEls.forEach((el) => {
      const id = el.dataset.cardId
      const newRect = getLayoutRect(el)
      nextRects.set(id, newRect)

      const prevRect = prevRects.get(id)
      if (!prevRect) return

      // Компенсируем смещение всей доски из-за авто-скролла к краю (autoScroll.js) —
      // иначе FLIP путает "колонка уехала под курсор" с "карточки переставились местами".
      const deltaX = prevRect.left - newRect.left - scrollDeltaX
      const deltaY = prevRect.top - newRect.top

      if (deltaX === 0 && deltaY === 0) return

      el.style.transition = 'none'
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`

      requestAnimationFrame(() => {
        el.style.transition = `transform ${FLIP_DURATION}ms ease`
        el.style.transform = ''
      })
    })

    const cleanup = () => {
      cardEls.forEach((el) => {
        el.style.transition = ''
        el.style.transform = ''
      })
    }
    const timeoutId = setTimeout(cleanup, FLIP_DURATION)

    prevRectsRef.current = nextRects

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencyKey.join(',')])

  return containerRef
}
