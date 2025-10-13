// Using RFC 9457 to format error responses
// https://www.rfc-editor.org/rfc/rfc9457.html#name-detail
export class ErrorResponse extends Error {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string

  constructor(type: string, title: string, status: number, detail?: string, instance?: string) {
    super(status.toString())
    this.type = type
    this.title = title
    this.status = status
    this.detail = detail
    this.instance = instance
  }
}
