import { isPromise } from './utils'
import type { AxiosRequestHeaders } from 'axios'

import { CustomError } from './error'
import type { Response } from './request'

export type InterceptorType = 'base' | 'json' | 'download' | 'upload' | string

export type Meta<D = any> = {
  headers: AxiosRequestHeaders
  data?: D
  url?: string
}

export type RequestInterceptorCallback = (meta: Meta) => Meta

export type RequestInterceptorObject = {
  type: InterceptorType
  callback: RequestInterceptorCallback
}

export type RequestInterceptor =
  | (RequestInterceptorObject & { type?: InterceptorType })
  | RequestInterceptorCallback

export type ResponseInterceptorCallback<T = unknown> = (res: Response) => T | Promise<T>

export type ResponseInterceptorObject<T = unknown> = {
  type: InterceptorType
  callback: ResponseInterceptorCallback<T>
}

export type ResponseInterceptor<T = unknown> =
  | (ResponseInterceptorObject & { type?: InterceptorType })
  | ResponseInterceptorCallback<T>

export type Skipper = (url: string) => boolean

export type InterceptorManagerConfig = {
  responseInterceptors: ResponseInterceptorObject[]
  requestInterceptors: RequestInterceptorObject[]
  responseSkipper: Skipper
  requestSkipper: Skipper
}

const defaultSkipper = () => false

export default class InterceptorManager {
  #responseInterceptors: ResponseInterceptorObject[]

  #requestInterceptors: RequestInterceptorObject[]

  #responseSkipper: Skipper

  #requestSkipper: Skipper

  constructor(cfg?: Partial<InterceptorManagerConfig>) {
    this.#requestInterceptors = cfg?.requestInterceptors || []
    this.#responseInterceptors = cfg?.responseInterceptors || []
    this.#requestSkipper = cfg?.requestSkipper || defaultSkipper
    this.#responseSkipper = cfg?.responseSkipper || defaultSkipper
  }

  clone() {
    return new InterceptorManager({
      requestInterceptors: [...this.#requestInterceptors],
      requestSkipper: this.#requestSkipper,
      responseInterceptors: [...this.#responseInterceptors],
      responseSkipper: this.#responseSkipper,
    })
  }

  addRequestObserver(ob: RequestInterceptorObject) {
    this.#requestInterceptors.push(ob)
  }

  addResponseObserver<T = unknown>(ob: ResponseInterceptorObject<T>) {
    this.#responseInterceptors.push(ob)
  }

  clearResponseObserver(iType?: InterceptorType) {
    if (iType) {
      this.#responseInterceptors = this.#responseInterceptors.filter((item) => item.type !== iType)
    } else {
      this.#responseInterceptors.splice(0, this.#responseInterceptors.length)
    }
  }

  clearRequestObserver(iType?: InterceptorType) {
    if (iType) {
      this.#requestInterceptors = this.#requestInterceptors.filter((item) => item.type !== iType)
    } else {
      this.#requestInterceptors.splice(0, this.#requestInterceptors.length)
    }
  }

  removeRequestObserver(interceptor: RequestInterceptor): void {
    const index =
      typeof interceptor === 'function'
        ? this.#requestInterceptors.findIndex((item) => item.callback === interceptor)
        : this.#requestInterceptors.findIndex(({ callback, type }) => {
            return type === interceptor.type && callback === interceptor.callback
          })

    if (index > -1) {
      this.#requestInterceptors.splice(index, 1)
    }
  }

  removeResponseObserver(interceptor: ResponseInterceptor): void {
    const index =
      typeof interceptor === 'function'
        ? this.#responseInterceptors.findIndex((item) => item.callback === interceptor)
        : this.#responseInterceptors.indexOf(interceptor)

    if (index > -1) {
      this.#responseInterceptors.splice(index, 1)
    }
  }

  setResponseSkipper(skipper: Skipper) {
    this.#responseSkipper = skipper
  }

  setRequestSkipper(skipper: Skipper) {
    this.#requestSkipper = skipper
  }

  #requestNext(newMeta: Meta, observers: RequestInterceptorObject[]): Meta {
    const observer = observers.shift()

    if (observer) {
      observer.callback(newMeta)

      return this.#requestNext(newMeta, observers)
    }

    return newMeta
  }

  doRequest(meta: Meta, iType: InterceptorType) {
    const url = meta.url

    if (url && this.#requestSkipper(url)) {
      return meta
    }

    const observers = this.#requestInterceptors.filter((item) => {
      return item.type === iType
    })

    try {
      const newMeta = this.#requestNext(meta, observers)

      Object.assign(meta, newMeta)
    } catch (e) {
      throw new CustomError(`request interceptor errror`, 'runtime', {
        cause: e,
      })
    }

    return meta
  }

  async #responseNext(newData: any, observers: ResponseInterceptorObject[]): Promise<any> {
    const observer = observers.shift()

    if (observer) {
      const res = observer.callback(newData)

      if (isPromise(res)) {
        return this.#responseNext(await res, observers)
      }

      return this.#responseNext(res, observers)
    }

    return newData
  }

  doResponse(response: Response, iType: InterceptorType): Promise<Response> | Response {
    if (response.config.url && this.#responseSkipper(response.config.url)) {
      return response
    }

    const observers = this.#responseInterceptors.filter((item) => {
      return item.type === iType
    })

    return this.#responseNext(response, observers)
  }
}
