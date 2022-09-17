import { format as prettyFormat } from 'pretty-format'
import saveAs from 'file-saver'
import type { RequestConfig } from './request'
import CryptoJS from 'crypto-js'


/**
 * Get the sha256 hash of a string
 *
 * @param str {String} The string to hash
 * @returns {String} The sha256 hash of the string
 */
export function hash(str: string): string {
  return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex)
}

/**
 * stringify object with options
 *
 * @param input {Any}
 * @param opts {Options}
 * @returns string
 */
export function stringify(input: unknown, opts?: StringifyOptions): string {
    return prettyFormat(input, opts)
}


export function getRequestHash(config: RequestConfig): string {
    let h: string

    try {
        const data = stringify(config.data)

        h = hash([config.method, config.url, data].join('#'))
    } catch {
        h = ''
    }

    return h
}


/**
 * Check if the object is a promise
 *
 * @param obj {Object}
 * @returns {Boolean}
 */
export function isPromise(obj?: unknown): obj is PromiseLike<any> {
    return (
        !!obj &&
        (typeof obj === 'object' || typeof obj === 'function') &&
        typeof (<any>obj).then === 'function'
    )
}

/**
 * download an url or a Bolb object
 *
 * @param data {string|Blob}
 * @param filename {string}
 */
export function download(data: string | Blob, filename?: string): void {
    saveAs(data, filename)
}

export type ObjectType =
  | 'array'
  | 'arraybuffer'
  | 'bigint'
  | 'bigint64array'
  | 'biguint64array'
  | 'blob'
  | 'boolean'
  | 'dataview'
  | 'date'
  | 'error'
  | 'file'
  | 'float32array'
  | 'float64array'
  | 'formdata'
  | 'function'
  | 'int16array'
  | 'int32array'
  | 'int8array'
  | 'map'
  | 'null'
  | 'number'
  | 'object'
  | 'promise'
  | 'regexp'
  | 'set'
  | 'string'
  | 'symbol'
  | 'uint16array'
  | 'uint32array'
  | 'uint8array'
  | 'uint8clampedarray'
  | 'undefined'
  | 'url'
  | 'urlsearchparams'
  | 'weakmap'
  | 'weakset'
  | string

/**
 * get the type of an object
 *
 * @param obj {Object}
 * @returns {ObjectType}
 */
export function typeOf(obj?: unknown): ObjectType {
  const t = typeof obj

  if (t === 'object') {
    const tt = Object.prototype.toString.call(obj)

    // slice off the first `[object ` and the last `]`
    // eg. [object Set] -> set
    return tt.slice(8, -1).toLowerCase()
  }

  return t
}

