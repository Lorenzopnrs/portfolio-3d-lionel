export const BOOK_FOCUS_INITIAL_STATE = Object.freeze({
  bookId: null,
  detailOpen: false,
})

export function reduceBookFocus(state, action) {
  if (action.type === 'focus' && action.bookId) {
    return {
      bookId: action.bookId,
      detailOpen: false,
    }
  }

  if (action.type === 'open-detail') {
    return state.bookId
      ? { ...state, detailOpen: true }
      : state
  }

  if (action.type === 'close-detail') {
    return state.detailOpen
      ? { ...state, detailOpen: false }
      : state
  }

  if (action.type === 'close') {
    return BOOK_FOCUS_INITIAL_STATE
  }

  return state
}
