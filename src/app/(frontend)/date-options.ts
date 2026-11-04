export const activities = [
  'Dinner Date',
  'Movie Night',
  'Walk with Coffee',
  'Beer / Wine',
  'Surprise',
  'Museum',
  'Minigolf',
  'PARTY!',
] as const

export type Activity = (typeof activities)[number]
