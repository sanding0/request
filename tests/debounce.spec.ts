import Request from "../src";

const baseURL = 'http://jsonplaceholder.typicode.com'

const url = '/posts/1'
describe('debounce usage',()=>{
  test('multiple debounce requests with same params',async()=>{
    const debounce = new Request({
      baseURL,
    })

    let debounceCount = 0
    debounce.addRequestInterceptors(
      (meta)=>{
        debounceCount++
        return meta
      }
    )

    for(let i = 0 ; i < 2 ; i++){
        debounce.request({
          url,
          method:'get',
          debounceInterval:500
        })
        // .then(res=>{
        //   console.log(res.data,'success 1');
        // })
        .catch(e=>{
          console.log('catched 1');
        })

        debounce.request({
          url,
          method:'get',
          debounceInterval:500
        })
        // .then(res=>{
        //   console.log(res.data,'success 2');
        // })
        .catch(e=>{
          console.log('catched 2');
        })

        debounce.request({
          url,
          method:'get',
          debounceInterval:500
        })
        // .then(res=>{
        //   console.log(res.data,'success 3');
        // })
        .catch(e=>{
          console.log('catched 3');
        })
    }

    const count =await new Promise(resolve=>{
      setTimeout(() => {
        resolve(debounceCount)
      }, 2000);
    })

    expect(count).toBe(1)
  })

  test('debounce request',async()=>{
    const debounce = new Request({
      baseURL,
    })
    let debounceCount = 0
    debounce.addRequestInterceptors(
      (meta)=>{
        debounceCount++
        return meta
      }
    )
    const timeout  = 500
    for(let i = 0 ; i < 5 ; i++){
        setTimeout(() => {
          debounce.request({
            url,
            method:'get',
            debounceInterval:timeout
          })
        }, 700*i)
    }

    const count =await new Promise(resolve=>{
      setTimeout(() => {
        resolve(debounceCount)
      }, 10000);
    })

    expect(count).toBe(5)
  })
})
