# request


## Example

```typescript
import Request from 'request'

const service = new Request({
  // RequestOptions
  baseURL, //required
  baseRequestType,
  headers,
  timeout,
})

//send request
service.request(url, data, config)
```

## Interceptors

You can intercept requests or responses before they are handled by `then`

### SetTypeSkippers

```typescript
const service = new Request({
  //baseURL:'xxx',

  //baseRequestType has default value 'base'
  //set value here will change the interceptor's default request type
  //when u need a individual skipper
  baseRequestType: 'base', //'base' | 'json' | 'download' | 'upload' | string
})

//send request
service.request(url, data, {
  //.... ,
  requestType: 'donwload', // 'json'|'download'|'upload' | string
})
```

### SetInterceptors

```typescript
// every interceptor has default type equals to the baseRequestType
service.addRequestInterceptors(
  {
    //you can add object param
    callback: (meta) => {
      meta.headers['p-auth'] = '1234'
    },
    type: 'json',
  },
  {
    callback: (meta) => {
      meta.headers.ppp = 'xxx'
    }, //of course u can ignore the "type" property
  },
  (meta) => {
    //can add function param too
    meta.url = '/xxx'
  }
)

service.addResponseInterceptors(
  {
    callback: (response) => {
      return response.data
    },
    type: 'download',
  },
  (response) => {
    if (response.data.code === '200') {
      return response.data.data
    }
    throw new Error(response.data.message || 'doError - Error')
  }
)
```

### SetSkippers

```typescript
//if u want to skip all request/response interceptors
service.setRequestInterceptorSkipper((url) => {
  //...
  //return boolean
})
service.setResponseInterceptorSkipper((url) => {
  //same
})
```

## Handling Errors

 if u wanna handle the error , use the 'error' event

```typescript
service.addEventListener('error', (err) => {
  console.log(err.message) // error message
  console.log(err.errorType) // 'node'|'network'|'runtime'
  console.log(err.cause) //the error reason
  if (err.errorType === 'network') {
    //status!==200
    consle.log(err.cause.config) //RequestConfig
    consle.log(err.cause.request) //XMLHttpRequest
    consle.log(err.cause.response) //undefined | Response
  }
})
```

 when the request send with the same data&url&method momentarily, use the 'warn' event to handle it

```typescript
service.addEventListener('warn', (err) => {
  console.log(err.config)
  console.log(err.cancel)
  err.cancel()
})
```

## API

- request
  - [Install](#install)
  - [Example](#example)
  - [Interceptors](#interceptors)
    - [SetTypeSkippers](#settypeskippers)
    - [SetInterceptors](#setinterceptors)
    - [SetSkippers](#setskippers)
  - [Handling Errors](#handling-errors)
  - [API](#api)
    - [addRequestInterceptors](#addrequestinterceptors)
    - [addResponseInterceptors](#addresponseinterceptors)
    - [upload](#upload)
    - [download](#download)

### addRequestInterceptors

```typescript
service.addRequestInterceptors(
  {
    callback: (meta) => {},
    type: 'xx',
  },
  (mata) => {},
  {
    callback: (meta) => {},
  }
)
```

### addResponseInterceptors

> same as the addRequestInterceptors

### upload

> data: FormData
>
> config: RequestConfig

```typescript
service.upload(
  url,
  data,
  (progress) => {
    const precent = progress.loaded / progress.total
  },
  config
)
```

### download

> config : RequestConfig
>
> filename: string| (()=>string)

```typescript
service.download(url,data?,config?,filename)
```
