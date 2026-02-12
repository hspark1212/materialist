export class ApplicationError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApplicationError"
  }
}
