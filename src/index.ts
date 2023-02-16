import Request from './request'

export type { Events } from './emitter'
export type { CustomError, ErrorMeta, ErrorType, NetWorkErrorMeta } from './error'
export type {
  Meta,
  RequestInterceptor,
  RequestInterceptorCallback,
  RequestInterceptorObject,
  ResponseInterceptor,
  ResponseInterceptorCallback,
  ResponseInterceptorObject,
  Skipper,
} from './interceptor-manager'
export type {
  Data,
  Params,
  ProgressEvent,
  RequestConfig,
  RequestOptions,
  Response,
} from './request'

export default Request
