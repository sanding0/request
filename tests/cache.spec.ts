import Request from '../src'
import { getRequestHash } from '../src/utils'

const baseURL = 'http://jsonplaceholder.typicode.com'

const commonParams = {
  url:'/posts/1',
  withCache:true
}

const putParams = {...commonParams, method:'put',data:''}
const deleteParams = {...commonParams, method:'delete',data:''}
const patchParams = {...commonParams, method:'patch',data:''}
const requestParams = {...commonParams, method:'get',data:''}

describe('cache less than maxLength',()=>{
  test('below maxLength',async ()=>{
    const service = new Request({
      baseURL,
      cache:{
        maxLength:3,
      }
    })

    let count = 0
    service.addRequestInterceptors(
      (meta)=>{
        count++
        return meta
      }
    )

    for(let i=0;i<6;i++){
      await service.request(requestParams)
      await service.put('/posts/1','',{withCache:true})
      await service.delete('/posts/1','',{ withCache:true})
    }

    const cache = service.getCache()

    expect(cache.has(getRequestHash(putParams))).toBe(true)
    expect(cache.has(getRequestHash(requestParams))).toBe(true)
    expect(cache.has(getRequestHash(deleteParams))).toBe(true)
    expect(count).toBe(3)
  })

  test('beyond max length',async ()=>{
    const service = new Request({
      baseURL,
      cache:{
        maxLength:3
      }
    })
    let count = 0
    service.addRequestInterceptors(
      (meta)=>{
        count++
        return meta
      }
    )

    for(let i = 0 ; i < 6 ; i++){
      await service.request(requestParams)
      await service.put('/posts/1','',putParams)
      await service.delete('/posts/1','',deleteParams)
    }
    expect(count).toBe(3)

    await service.patch('/posts/1','',patchParams)
    await service.request(requestParams)
    const cache = service.getCache()
    expect(cache.has(getRequestHash(requestParams))).toBe(true)
    expect(cache.has(getRequestHash(patchParams))).toBe(true)
    expect(cache.has(getRequestHash(deleteParams))).toBe(true)
    expect(cache.has(getRequestHash(putParams))).toBe(false)

    expect(count).toBe(5)
  })
})


describe('cache max age',()=>{
  test('beyond max age',async()=>{
    const timeout = 500
    const service = new Request({
      baseURL,
      cache:{
        maxLength:3,
        maxAge:timeout
      }
    })
    let count = 0
    service.addRequestInterceptors(
      (meta)=>{
        count++
        return meta
      }
    )

    for(let i = 0 ; i < 5 ; i++){
      await new Promise(resolve=>{
        setTimeout(async() => {
           resolve(await service.request(requestParams))
        }, timeout);
      })
    }

    expect(count).toBe(5)

  })

  test('below max age',async()=>{
    const timeout = 500
    const service = new Request({
      baseURL,
      cache:{
        maxLength:3,
        maxAge:timeout
      }
    })
    let count = 0
    service.addRequestInterceptors(
      (meta)=>{
        count++
        return meta
      }
    )

    for(let i = 0 ; i < 5 ; i++){
      await new Promise(resolve=>{
        setTimeout(async() => {
            resolve(await service.request(requestParams))
        }, timeout);
      })
    }

    expect(count).toBe(5)
  })
})
