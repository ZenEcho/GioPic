export function deprecate<T extends (...args: any[]) => any>(fn: T, _msg: string): T {
  return fn
}

export function debuglog(_set: string) {
  return () => {}
}

export function inherits(ctor: any, superCtor: any) {
  if (typeof Object.setPrototypeOf === 'function') {
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype)
  } else {
    const proto = Object.create(superCtor.prototype)
    Object.assign(proto, ctor.prototype)
    ctor.prototype = proto
  }
  ;(ctor as any).super_ = superCtor
}

const util = {
  deprecate,
  debuglog,
  inherits,
}

export default util

