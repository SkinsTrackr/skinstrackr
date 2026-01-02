/**
 * Extracts the clean error message from an Electron IPC error.
 * Electron wraps errors from the main process with:
 * "Error invoking remote method 'method-name': Error: actual message"
 *
 * @param error - The error object caught from an IPC call
 * @returns The clean error message
 */
export function getCleanErrorMessage(error: unknown): string {
  const err = error as Partial<{ message: string }>

  if (!err.message) {
    return 'An unknown error occurred'
  }

  // Pattern: "Error invoking remote method 'xxx': Error: ACTUAL_MESSAGE"
  const match = err.message.match(/Error invoking remote method '[^']+': (?:Error: )?(.+)/)

  if (match && match[1]) {
    return match[1]
  }

  // If pattern doesn't match, return the original message
  return err.message
}
