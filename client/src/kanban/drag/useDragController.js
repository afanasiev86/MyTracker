import { useRef, useState } from 'react'
import { DRAG_THRESHOLD } from './dragConstants.js'
import { measureLayout } from './measureLayout.js'
import { resolveTarget } from './resolveTarget.js'
import { commitDrag } from './commitDrag.js'
import { startAutoScroll } from './autoScroll.js'

export function useDragController(boards, onCardMove, containerRef, onCardClick) {
  const [drag, setDragState] = useState(null)
  // Копия drag для чтения вне рендера: commitDrag вызывается из обработчика, а не из функции-обновления setDrag
  const dragRef = useRef(null)
  function setDrag(next) {
    dragRef.current = typeof next === 'function' ? next(dragRef.current) : next
    setDragState(dragRef.current)
  }
  const dragStateRef = useRef(null)
  const boardsSnapshotRef = useRef(boards)
  boardsSnapshotRef.current = boards

  function handleCardPointerDown(e, card, fromBoardId) {
    if (e.button !== undefined && e.button !== 0) return
    const startX = e.clientX
    const startY = e.clientY
    const pointerId = e.pointerId

    const state = { pointerId, started: false, layouts: null, pointerX: startX, pointerY: startY, stopAutoScroll: null }
    dragStateRef.current = state

    function reresolveTarget() {
      state.layouts = measureLayout(containerRef.current, card.id)
      const target = resolveTarget(state.layouts, boardsSnapshotRef.current, state.pointerX, state.pointerY)
      setDrag((current) => (current ? { ...current, target } : current))
    }

    function handleMove(ev) {
      if (ev.pointerId !== pointerId) return
      state.pointerX = ev.clientX
      state.pointerY = ev.clientY

      if (!state.started) {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return

        state.started = true
        state.layouts = measureLayout(containerRef.current, card.id)
        const initialTarget = resolveTarget(state.layouts, boardsSnapshotRef.current, ev.clientX, ev.clientY)
        setDrag({
          cardId: card.id,
          fromBoardId,
          text: card.text,
          x: ev.clientX,
          y: ev.clientY,
          target: initialTarget,
        })
        requestAnimationFrame(() => {
          state.layouts = measureLayout(containerRef.current, card.id)
        })
        state.stopAutoScroll = startAutoScroll(containerRef.current, () => state.pointerX, reresolveTarget)
        return
      }

      const target = resolveTarget(state.layouts, boardsSnapshotRef.current, ev.clientX, ev.clientY)
      setDrag((current) =>
        current ? { ...current, x: ev.clientX, y: ev.clientY, target } : current,
      )
    }

    function handleUp(ev) {
      if (ev.pointerId !== pointerId) return
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
      document.removeEventListener('pointercancel', handleCancel)
      state.stopAutoScroll?.()

      if (state.started) {
        // Сохранение и сброс drag в одном обработчике попадают в один рендер: карточки не «откатываются» и не перестраиваются заново
        commitDrag(dragRef.current, onCardMove)
        setDrag(null)
      } else {
        onCardClick(card, fromBoardId)
      }
      dragStateRef.current = null
    }

    function handleCancel(ev) {
      if (ev.pointerId !== pointerId) return
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
      document.removeEventListener('pointercancel', handleCancel)
      state.stopAutoScroll?.()

      if (state.started) {
        setDrag(null)
      }
      dragStateRef.current = null
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
    document.addEventListener('pointercancel', handleCancel)
  }

  return { drag, handleCardPointerDown }
}
