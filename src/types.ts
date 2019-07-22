"use strict";

const hasSymbol = typeof Symbol === `function` && Symbol.for;
export const PORTAL_TYPE = hasSymbol ? Symbol.for(`react.portal`) : 0xeaca;
export const FRAGMENT_TYPE = hasSymbol ? Symbol.for(`react.fragment`) : 0xeacb;
export const STRICT_MODE_TYPE = hasSymbol ? Symbol.for(`react.strict_mode`) : 0xeacc;
export const PROFILER_TYPE = hasSymbol ? Symbol.for(`react.profiler`) : 0xead2;
export const PROVIDER_TYPE = hasSymbol ? Symbol.for(`react.provider`) : 0xeacd;
export const CONTEXT_TYPE = hasSymbol ? Symbol.for(`react.context`) : 0xeace;
export const CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for(`react.concurrent_mode`) : 0xeacf;
export const FORWARD_REF_TYPE = hasSymbol ? Symbol.for(`react.forward_ref`) : 0xead0;
export const SUSPENSE_TYPE = hasSymbol ? Symbol.for(`react.suspense`) : 0xead1;
export const MEMO_TYPE = hasSymbol ? Symbol.for(`react.memo`) : 0xead3;
export const LAZY_TYPE = hasSymbol ? Symbol.for(`react.lazy`) : 0xead4;

function getWrappedName(outerType, innerType, wrapperName) {
  const functionName = innerType.displayName || innerType.name || ``;
  return outerType.displayName || (functionName !== `` ? `${wrapperName}(${functionName})` : wrapperName);
}

export function getComponentName(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }
  if (typeof type === `function`) {
    return type.displayName || type.name || null;
  }
  if (typeof type === `string`) {
    return type;
  }
  switch (type) {
    case CONCURRENT_MODE_TYPE:
      return `ConcurrentMode`;
    case FRAGMENT_TYPE:
      return `Fragment`;
    case PORTAL_TYPE:
      return `Portal`;
    case PROFILER_TYPE:
      return `Profiler`;
    case STRICT_MODE_TYPE:
      return `StrictMode`;
    case SUSPENSE_TYPE:
      return `Suspense`;
  }
  if (typeof type === `object`) {
    switch (type.$$typeof) {
      case CONTEXT_TYPE:
        return `Context.Consumer`;
      case PROVIDER_TYPE:
        return `Context.Provider`;
      case FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, `ForwardRef`);
      case MEMO_TYPE:
        return getComponentName(type.type);
      case LAZY_TYPE: {
        // todo
      }
    }
  }
  return null;
}
