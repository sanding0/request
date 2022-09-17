import { download } from './utils'
import { typeOf } from './utils'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponseHeaders,
  Canceler,
  Method as AxiosMethod,
} from 'axios'
import axios from 'axios'
import type { Handler } from 'mitt'

import Emitter, { Events } from './emitter'
import { CustomError } from './error'
import type {
  InterceptorType,
  Meta,
  RequestInterceptor,
  ResponseInterceptor,
  Skipper,
} from './interceptor-manager'
import InterceptorManager from './interceptor-manager'
import { getRequestHash } from './utils'

export type RequestType = InterceptorType

export type RequestOptions = Pick<
  AxiosRequestConfig,
  | 'baseURL'
  | 'headers'
  | 'paramsSerializer'
  | 'timeout'
  | 'timeoutErrorMessage'
  | 'withCredentials'
  | 'onUploadProgress'
  | 'onDownloadProgress'
  | 'maxContentLength'
  | 'maxBodyLength'
  | 'httpAgent'
  | 'httpsAgent'
  | 'proxy'
  | 'decompress'
> & {
  baseURL: string
  baseRequestType?: RequestType
}

export type Response<T = any, D = any> = {
  data: T
  status: number
  statusText: string
  headers: AxiosResponseHeaders
  config: AxiosRequestConfig<D>
}

export type RequestConfig = Pick<
  AxiosRequestConfig,
  | 'url'
  | 'method'
  | 'headers'
  | 'onDownloadProgress'
  | 'onUploadProgress'
  | 'timeout'
  | 'timeoutErrorMessage'
  | 'data'
  | 'responseType'
  | 'params'
  | 'signal'
  | 'cancelToken'
> & {
  requestType?: RequestType | string
}

export type Instance = AxiosInstance

export type Method = AxiosMethod

export type Data = any

export type Params = Record<string, unknown> | null

export type ProgressEvent = {
  total: number
  loaded: number
}

export default class Request {
  #service: Instance

  #emitter?: Emitter

  #initConfig: RequestOptions

  #baseRequestType: RequestType

  #abortKeys: string[] = []

  #interceptorManager: InterceptorManager = new InterceptorManager()

  constructor({ baseRequestType = 'base', ...restConfig }: RequestOptions) {
    this.#service = axios.create(restConfig)
    this.#initConfig = restConfig
    this.#baseRequestType = baseRequestType

    this.#useRequestInterceptors()
    this.#useResponseInterceptors()
  }

  get emiter(): Emitter | undefined {
    return this.#emitter
  }

  #removeAbortHash(config: RequestConfig): void {
    const key = getRequestHash(config)

    this.#abortKeys.splice(this.#abortKeys.indexOf(key), 1)
  }

  #useRequestInterceptors(): void {
    this.#service.interceptors.request.use(
      (config: RequestConfig) => {
        return this.#interceptorManager.doRequest(
          config as Meta,
          config.requestType || this.#baseRequestType
        )
      },
      (err) => {
        this.#emitter?.emit('error', err)

        return Promise.reject(err)
      }
    )
  }

  #useResponseInterceptors(): void {
    this.#service.interceptors.response.use(
      async (res) => {
        const config: RequestConfig = res.config

        this.#removeAbortHash(config)

        let response: Promise<Response> | Response

        try {
          response = await this.#interceptorManager.doResponse(
            res,
            config.requestType || this.#baseRequestType
          )
        } catch (e: any) {
          const message = typeof e === 'string' ? e : e.message || 'response interceptor error'

          const error = new CustomError(message, 'runtime', {
            cause: e,
          })

          this.#emitter?.emit('error', error)
          throw error
        }

        return response
      },
      (err) => {
        if (err.config) {
          this.#removeAbortHash(err.config)
        }

        if (axios.isCancel(err)) {
          return Promise.reject(new Error('request canceled'))
        }
        this.#emitter?.emit('error', new CustomError('network error', 'network', { cause: err }))

        return Promise.reject(err)
      }
    )
  }

  #setInterceptorManager(manager: InterceptorManager) {
    this.#interceptorManager = manager
  }

  /**
   * 添加请求拦截
   * @param interceptor :RequestCallBack
   * @returns :removeFunction
   */
  public addRequestInterceptors(...interceptors: RequestInterceptor[]): void {
    // this.#interceptorManager.clearRequestObserver()
    for (const item of interceptors) {
      if (typeof item === 'function') {
        this.#interceptorManager.addRequestObserver({
          type: this.#baseRequestType,
          callback: item,
        })
      } else if (typeof item === 'object') {
        if ('type' in item && !!item.type) {
          this.#interceptorManager.addRequestObserver(item)
        } else {
          item.type = this.#baseRequestType
          this.#interceptorManager.addRequestObserver(item)
        }
      }
    }
  }

  public removeRequestInterceptors(...interceptors: RequestInterceptor[]) {
    for (const item of interceptors) {
      this.#interceptorManager.removeRequestObserver(item)
    }
  }

  public removeResponseInterceptors(...interceptor: ResponseInterceptor[]) {
    for (const item of interceptor) {
      this.#interceptorManager.removeResponseObserver(item)
    }
  }

  public clearResponseInterceptors(type?: RequestType | string) {
    this.#interceptorManager.clearResponseObserver(type)
  }

  public clearRequestInterceptors(type?: RequestType | string) {
    this.#interceptorManager.clearRequestObserver(type)
  }

  /**
   * 添加响应拦截
   * @param interceptor :ResponseCallBack
   * @returns :removeFunction
   */
  public addResponseInterceptors(...interceptors: ResponseInterceptor[]): void {
    for (const item of interceptors) {
      if (typeof item === 'function') {
        this.#interceptorManager.addResponseObserver({
          type: this.#baseRequestType,
          callback: item,
        })
      } else if (typeof item === 'object') {
        if ('type' in item && !!item.type) {
          this.#interceptorManager.addResponseObserver(item)
        } else {
          item.type = this.#baseRequestType
          this.#interceptorManager.addResponseObserver(item)
        }
      }
    }
  }

  /**
   * 添加事件监听
   * @param event :eventName
   * @param handler :handler
   */
  public addEventListener<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    if (!this.#emitter) {
      this.#emitter = new Emitter()
    }
    this.#emitter.on(event, handler)
  }

  /**
   * 筛选url，跳过响应拦截器
   * @param skipper : (url:string)=>boolean
   */
  public setResponseInterceptorSkipper(skipper: Skipper) {
    this.#interceptorManager.setResponseSkipper(skipper)
  }

  /**
   * 筛选url，跳过请求拦截器
   * @param skipper : (url:string)=>boolean
   */
  public setRequestInterceptorSkipper(skipper: Skipper) {
    this.#interceptorManager.setRequestSkipper(skipper)
  }

  /**
   * 克隆当前状态的request实例
   * @param config :like Axios Config
   * @returns Request
   */
  public clone(config?: RequestOptions): Request {
    const service = new Request({ ...this.#initConfig, ...config })

    service.#setInterceptorManager(this.#interceptorManager.clone())

    return service
  }

  public getUri(config?: RequestConfig): string {
    return this.#service.getUri(config)
  }

  public request<R = Response<Data>, D = Data>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<R> {
    const newConfig: RequestConfig = {
      requestType: this.#baseRequestType,
      ...config,
      url,
      data,
    }

    const key = getRequestHash(newConfig)

    // if AbortController is supported, use it
    if (typeof AbortController !== 'undefined') {
      const controller = new AbortController()

      newConfig.signal = controller.signal

      this.#addAbortKeys(key, newConfig, (message) => {
        controller.abort(message)
      })
    } else {
      newConfig.cancelToken = new axios.CancelToken((cancel) => {
        this.#addAbortKeys(key, newConfig, cancel)
      })
    }

    return this.#service.request(newConfig)
  }

  #addAbortKeys(key: string, config: RequestConfig, cancel: Canceler): void {
    if (this.#abortKeys.includes(key)) {
      this.#emitter?.emit('warn', {
        config,
        cancel,
      })
    } else {
      this.#abortKeys.push(key)
    }
  }

  public get<R = Response<Data>, P = Params>(
    url: string,
    params?: P,
    config?: RequestConfig
  ): Promise<R> {
    return this.request<R>(url, null, { ...config, method: 'get', params })
  }

  public delete<R = Response<Data>, D = Data>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<R> {
    return this.request<R>(url, data, { ...config, method: 'delete' })
  }

  public head<R = Response<Data>>(url: string, config?: RequestConfig): Promise<R> {
    return this.request<R>(url, '', { ...config, method: 'head' })
  }

  public options<R = Response<Data>>(url: string, config?: RequestConfig): Promise<R> {
    return this.request<R>(url, '', { ...config, method: 'options' })
  }

  public post<R = Response<Data>, D = Data>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<R> {
    return this.request<R>(url, data, { ...config, method: 'post' })
  }

  public put<R = Response<Data>, D = Data>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<R> {
    return this.request<R>(url, data, { ...config, method: 'put' })
  }

  public patch<R = Response<Data>, D = Data>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<R> {
    return this.request<R>(url, data, { ...config, method: 'patch' })
  }

  /**
   * 上传formData
   * @param url :url
   * @param data :formData
   * @param onUploadProgress : (progressEvent: {total:number loaded:number}) => void
   * @param config :RequestConfig
   * @returns
   */
  public upload<R = Response<Data>>(
    url: string,
    data: FormData,
    onUploadProgress?: (progressEvent: ProgressEvent) => void,
    config?: RequestConfig
  ): Promise<R> {
    if (typeOf(data) !== 'formdata') {
      throw new CustomError('upload require formData', 'runtime')
    }

    return this.request<R>(url, data, {
      ...config,
      onUploadProgress,
    })
  }

  /**
   * 下载文件, get
   * @param url :url
   * @param data :data
   * @param config: RequestConfig
   * @param filename: string | callback
   */
  public async download<D = Data>(
    url: string,
    data?: D,
    config?: RequestConfig,
    filename?: string | (() => string)
  ): Promise<void> {
    const res = await this.request(url, data, {
      method: 'get',
      ...config,
    })
    let resType

    try {
      resType = typeOf(res.data)
    } catch {
      throw new CustomError(
        'watch out the responseInterceptors, set the requestType and interceptor type to skip the interceptor',
        'runtime'
      )
    }

    const fileNameStr = typeof filename === 'function' ? filename() : filename

    if (resType === 'arraybuffer') {
      const blob = new Blob([res.data])

      download(blob, fileNameStr)
    } else if (resType === 'blob') {
      download(res.data, fileNameStr)
    } else if (res.data.data && typeOf(res.data.data) === 'string') {
      download(res.data.data, fileNameStr)
    } else {
      throw new CustomError(
        'download query should response blob | string | arrayBuffer type',
        'runtime'
      )
    }
  }
}
