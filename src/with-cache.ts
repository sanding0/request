interface CacheNodeManage {
  append: (key: unknown) => void;
  lastNode: () => CacheNode;
  find: (key: unknown) => CacheNode | null;
  remove: (key: unknown) => unknown;
  removeFirst: () => unknown;
}

type LruParam = {
  maxLength: number;
  maxAge: number;
};

class CacheNode {
  pre: CacheNode | null;
  next: CacheNode | null;
  index: unknown;
  constructor(index?: unknown) {
    this.index = index;
    this.next = null;
    this.pre = null;
  }
}

class CacheNodeManager implements CacheNodeManage{
  node:CacheNode
  head:CacheNode
  length:number = 0
  constructor(){
    this.node = new CacheNode()
    this.head = this.node
  }

  append(key: unknown) :void{
    const lastNode = this.lastNode()
    const newNode = new CacheNode(key)
    lastNode.next = newNode
    newNode.pre = lastNode
    this.length++
  }

  lastNode():CacheNode{
    let {head} = this
    while(head.next){
      head=head.next
    }
    return head
  }

  find(key: unknown):CacheNode | null{
    let {head} = this
    while(head.index!==key){
      if(!head.next) return null
      head = head.next
    }
    return head
  }

  remove(key:unknown):unknown{
    let remoevNode = this.find(key)
    let removeKey = null
    if(remoevNode){
      removeKey = remoevNode.index
      let nextNode = remoevNode?.next
      let preNode = remoevNode?.pre
      remoevNode=null
      if(preNode){
        if(nextNode){
          nextNode.pre = preNode
          preNode.next = nextNode
        }else{
          preNode.next =null
        }
      }else if(nextNode){
        nextNode.pre = null
      }
    }
    return removeKey
  }

  removeFirst(){
    const {head} = this
    let remoevNode = head.next
    let key = null
    if(remoevNode){
      key = remoevNode.index
      if(remoevNode.next){
        remoevNode.next.pre = head
        head.next = remoevNode.next
      }else{
        head.next = null
      }
    }
    remoevNode = null
    this.length--
    return key
  }

}

export class LRUCache{
  #capacity:number
  #map:Map<any,any>
  #cacheNodeManager:CacheNodeManager
  #maxAge:number
  #ageMap:Map<any,any>
  constructor({maxLength,maxAge}:LruParam){
    this.#capacity = maxLength
    this.#map = new Map()
    this.#cacheNodeManager = new CacheNodeManager()
    this.#maxAge = maxAge
    this.#ageMap = new Map()
  }

  get(key:unknown){
    if(this.#map.has(key)){
      this.#cacheNodeManager.remove(key)
      this.#cacheNodeManager.append(key)
      if(this.#cacheNodeManager.length>this.#capacity){
        this.#cacheNodeManager.removeFirst()
      }
      return this.#map.get(key)??-1
    }
  }

  deleteAge(key:unknown){
    clearTimeout(this.#ageMap.get(key))
  }

  set(key:unknown,value:unknown){
    const timeout = setTimeout(()=>{
      this.#map.delete(this.#cacheNodeManager.remove(key))
    },this.#maxAge)
    if(this.#map.has(key)){
      this.#cacheNodeManager.remove(key)
      this.#cacheNodeManager.append(key)
      this.#map.set(key,value)
      clearTimeout(this.#ageMap.get(key))
      this.#ageMap.set(key,timeout)
      return
    }
    this.#cacheNodeManager.append(key)
    if(this.#cacheNodeManager.length>this.#capacity){
      const removed = this.#cacheNodeManager.removeFirst()
      if(this.#map.size>=this.#capacity){
        this.#map.delete(removed)
        this.deleteAge(key)
      }
    }
    this.#map.set(key,value)
    this.#ageMap.set(key,value)
  }

  has(key:unknown){
    return this.#map.has(key)
  }

  delete(key:unknown){
    if(this.#map.has(key)){
      this.#map.delete(key)
      this.deleteAge(key)
      this.#cacheNodeManager.remove(key)
    }
  }
}


export function withCache(fn:Function,key:string,lru:LRUCache){
  return function(this:any,...args:any[]){
    let cacheDisabled = false
    if(args.some((param:Record<string,unknown>)=>'without_cache' in param&&!param.without_cache)){
      cacheDisabled = true
      args = args.map(v=>{
        delete v['without_cache']
        return v
      })
    }

    if(cacheDisabled){
      if(lru.has(key)){
        lru.delete(key)
      }
      return fn.apply(this,args)
    }else{
      if(lru.has(key)){
        return lru.get(key)
      }else{
        const res = fn.apply(this,args)
        lru.set(key,res)
        return res
      }
    }
  }
}
