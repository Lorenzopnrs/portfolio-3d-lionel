import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatEventDates,
  formatEventPlace,
  formatEventTime,
  selectUpcomingEvents,
} from './agenda.js'

const NOW = new Date(2027, 2, 15, 18, 30)

test('past events disappear, and the next one comes first', () => {
  const events = [
    { id: 'later', startDate: '2027-06-01' },
    { id: 'past', startDate: '2027-03-14' },
    { id: 'today', startDate: '2027-03-15' },
    { id: 'soon', startDate: '2027-04-02' },
  ]

  assert.deepEqual(
    selectUpcomingEvents(events, NOW).map((event) => event.id),
    ['today', 'soon', 'later'],
  )
})

test('an event spanning several days stays until its last day', () => {
  const events = [
    { endDate: '2027-03-15', id: 'ending', startDate: '2027-03-10' },
    { endDate: '2027-03-14', id: 'over', startDate: '2027-03-10' },
  ]

  assert.deepEqual(
    selectUpcomingEvents(events, NOW).map((event) => event.id),
    ['ending'],
  )
})

test('an event without a valid date is left out', () => {
  assert.deepEqual(
    selectUpcomingEvents(
      [{ id: 'broken', startDate: 'bientôt' }, { id: 'empty' }],
      NOW,
    ),
    [],
  )
})

test('dates read naturally in French', () => {
  assert.equal(
    formatEventDates({ startDate: '2026-12-12' }),
    'Samedi 12 décembre',
  )
  assert.equal(
    formatEventDates({ startDate: '2027-09-01' }),
    'Mercredi 1er septembre',
  )
  assert.equal(
    formatEventDates({ endDate: '2027-03-14', startDate: '2027-03-12' }),
    'Du 12 au 14 mars',
  )
  assert.equal(
    formatEventDates({ endDate: '2027-04-02', startDate: '2027-03-30' }),
    'Du 30 mars au 2 avril',
  )
})

test('hours read the same way, however they were typed', () => {
  const expected = 'de 14\u00a0h à 18\u00a0h'

  for (const typed of [
    '14h-18h',
    '14h - 18h',
    '14H à 18H',
    '14h a 18h',
    '14:00 - 18:00',
    'de 14h à 18h',
    'de 14\u00a0h à 18\u00a0h',
  ]) {
    assert.equal(formatEventTime(typed), expected, typed)
  }

  assert.equal(
    formatEventTime('14h30-18h'),
    'de 14\u00a0h\u00a030 à 18\u00a0h',
  )
  assert.equal(formatEventTime('dès 14h'), 'dès 14\u00a0h')
  assert.equal(formatEventTime('toute la journée'), 'toute la journée')
  assert.equal(formatEventTime(), '')
})

test('the place is shown with whatever is known of it', () => {
  assert.equal(
    formatEventPlace({ city: 'Lyon', venue: 'Librairie du Parc' }),
    'Librairie du Parc, Lyon',
  )
  assert.equal(formatEventPlace({ city: 'Lyon' }), 'Lyon')
  assert.equal(formatEventPlace({}), '')
})
