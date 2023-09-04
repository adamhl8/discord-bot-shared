// Removes null and undefined from properties of T.
// Keys passed to K are excluded from null/undefined removal.
type NoNullProperties<T, K extends keyof T = never> = {
  [P in keyof T]: P extends K ? T[P] : Exclude<T[P], null | undefined>
}

function assertPropertyNotNull<T, K extends keyof T>(
  obj: T,
  prop: K,
  error: Error,
): asserts obj is T & Record<K, NonNullable<T[K]>> {
  if (!obj[prop]) {
    throw error
  }
}

export { assertPropertyNotNull }
export type { NoNullProperties }
