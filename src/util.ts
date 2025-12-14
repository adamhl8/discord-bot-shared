import type { Result } from "ts-explicit-errors"
import { isErr } from "ts-explicit-errors"

export async function handleCallback(fn: () => Result | Promise<Result>) {
  const result = await fn()
  if (isErr(result)) console.error(result.messageChain)
}
