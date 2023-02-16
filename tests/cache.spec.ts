import Request from '..'

const baseURL = 'http://jsonplaceholder.typicode.com'

describe('cache less than maxLength',()=>{
  test('less than maxLength',async ()=>{
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
      await service.request({
        url:'/posts/1',
        method:'get',
        withCache:true
      })
      await service.put('/posts/1','',{
        withCache:true
      })
      await service.delete('/posts/1','',{
        withCache:true
      })
    }
    expect(count).toBe(3)

  })
})
