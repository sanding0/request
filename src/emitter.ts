import type { Canceler } from 'axios'
import type { Emitter as Emitt, Handler } from 'mitt'
import mitt from 'mitt'

import { CustomError } from './error'
import type { RequestConfig } from './request'

export type Events = {
  error: CustomError<any>
  warn: {
    config: RequestConfig
    cancel: Canceler
  }
}

export default class Emitter {
  #mitt: Emitt<Events>

  constructor() {
    this.#mitt = mitt()
  }

  on<T extends keyof Events>(t: T, handler: Handler<Events[T]>): void {
    this.#mitt.on<T>(t, handler)
  }

  emit<T extends keyof Events>(t: T, evt: Events[T]): void {
    this.#mitt.emit<T>(t, evt)
  }
}
