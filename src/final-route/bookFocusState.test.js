import assert from 'node:assert/strict'
import test from 'node:test'
import { books } from '../content/portfolioContent.js'
import {
  BOOK_FOCUS_INITIAL_STATE,
  reduceBookFocus,
} from './bookFocusState.js'

test('every book follows focus, detail, return and close states', () => {
  books.forEach((book) => {
    const focusedState = reduceBookFocus(BOOK_FOCUS_INITIAL_STATE, {
      type: 'focus',
      bookId: book.id,
    })

    assert.deepEqual(focusedState, {
      bookId: book.id,
      detailOpen: false,
    })

    const detailState = reduceBookFocus(focusedState, {
      type: 'open-detail',
    })
    assert.deepEqual(detailState, {
      bookId: book.id,
      detailOpen: true,
    })

    const returnedState = reduceBookFocus(detailState, {
      type: 'close-detail',
    })
    assert.deepEqual(returnedState, focusedState)

    assert.equal(
      reduceBookFocus(returnedState, { type: 'close' }),
      BOOK_FOCUS_INITIAL_STATE,
    )
  })
})

test('book details cannot open before a frame is focused', () => {
  assert.equal(
    reduceBookFocus(BOOK_FOCUS_INITIAL_STATE, {
      type: 'open-detail',
    }),
    BOOK_FOCUS_INITIAL_STATE,
  )
})
