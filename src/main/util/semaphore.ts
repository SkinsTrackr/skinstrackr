export default class Semaphore {
  private permits: number
  private queue: (() => void)[]

  constructor(initialPermits: number) {
    this.permits = initialPermits
    this.queue = []
  }

  public async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const acquirePermit = () => {
        if (this.permits > 0) {
          this.permits--
          resolve()
        } else {
          this.queue.push(acquirePermit)
        }
      }

      acquirePermit()
    })
  }

  public release(): void {
    this.permits++
    const next = this.queue.shift()
    if (next) {
      next()
    }
  }
}
