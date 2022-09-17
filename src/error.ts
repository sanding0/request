import { CustomError as CError } from 'ts-custom-error'

import type { RequestConfig, Response } from './request'

export type ErrorMeta = {
  cause?: any
}

export type NetWorkErrorMeta = {
  cause: {
    config: RequestConfig
    request: XMLHttpRequest
    response?: Response
  }
}

export type ErrorType = {
  network: NetWorkErrorMeta
  runtime: ErrorMeta
  node: ErrorMeta
}

export class CustomError<K extends keyof ErrorType> extends CError {
  cause: any

  errorType: K

  constructor(msg: string, errorType: K, meta?: ErrorType[K]) {
    super(msg)
    this.cause = meta?.cause
    this.errorType = errorType
    // https://github.com/adriengibrat/ts-custom-error#known-limitations
    Object.defineProperty(this, 'name', { value: 'customError' })
  }
}
