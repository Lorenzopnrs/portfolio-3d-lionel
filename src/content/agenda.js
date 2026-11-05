const WEEKDAY = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'UTC',
  weekday: 'long',
})
const MONTH = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  timeZone: 'UTC',
})

const HOUR = /(\d{1,2})\s*(?:h|:)(?:\s*(\d{2})(?!\s*[h:]))?/gi
const HOUR_RANGE =
  /^(\d+\u00a0h(?:\u00a0\d{2})?)\s*(?:-|–|—|à|a)\s*(\d+\u00a0h(?:\u00a0\d{2})?)$/

// Calendar dates are read as UTC, so the visitor's time zone never shifts a day.
function parseDate(value) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDay(date) {
  const day = date.getUTCDate()

  return `${day === 1 ? '1er' : day} ${MONTH.format(date)}`
}

function getTodayKey(now) {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

// Only what is still to come is listed, so the year would add nothing.
// An event stays visible until the end of its last day.
export function selectUpcomingEvents(events, now = new Date()) {
  const today = getTodayKey(now)

  return events
    .filter(
      (event) =>
        parseDate(event.startDate) &&
        (event.endDate || event.startDate) >= today,
    )
    .sort((left, right) =>
      left.startDate.localeCompare(right.startDate),
    )
}

export function formatEventDates({ endDate, startDate }) {
  const start = parseDate(startDate)
  const end = endDate ? parseDate(endDate) : null

  if (!start) {
    return ''
  }

  if (!end || endDate === startDate) {
    const weekday = WEEKDAY.format(start)

    return `${weekday[0].toUpperCase()}${weekday.slice(1)} ${formatDay(start)}`
  }

  if (MONTH.format(start) === MONTH.format(end)) {
    const day = start.getUTCDate()

    return `Du ${day === 1 ? '1er' : day} au ${formatDay(end)}`
  }

  return `Du ${formatDay(start)} au ${formatDay(end)}`
}

// Whoever fills in the Studio, the hours read the same way on the site:
// « 14h-18h », « 14:00 - 18:00 » and « 14h à 18h » give « de 14 h à 18 h ».
export function formatEventTime(time = '') {
  const tidied = time
    .trim()
    .replace(HOUR, (_, hour, minutes) =>
      minutes && minutes !== '00'
        ? `${Number(hour)}\u00a0h\u00a0${minutes}`
        : `${Number(hour)}\u00a0h`,
    )
  const range = tidied.match(HOUR_RANGE)

  return range ? `de ${range[1]} à ${range[2]}` : tidied
}

export function formatEventPlace({ city, venue }) {
  return [venue, city].filter(Boolean).join(', ')
}
