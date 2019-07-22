"use strict";
const React = require(`react`);
import { warning } from "./react-log";

function processContext(type: any, context: any) {
  // type.contextType 不支持
  if (type.contextTypes) {
    const maskedContext = {};
    for (const contextName in type.contextTypes) {
      maskedContext[contextName] = context[contextName];
    }
    return maskedContext;
  } else {
    return {};
  }
}

export function resolve(child, context) {
  function processChild(element, Component) {
    const publicContext = processContext(Component, context);

    let queue = [];
    let replace = false;
    const updater = {
      isMounted() {
        return false;
      },
      enqueueForceUpdate() {
        if (queue === null) {
          // warnNoop(publicInstance, `forceUpdate`);
          return null;
        }
      },
      enqueueReplaceState(publicInstance, completeState) {
        replace = true;
        queue = [completeState];
      },
      enqueueSetState(publicInstance, currentPartialState) {
        if (queue === null) {
          // warnNoop(publicInstance, `setState`);
          return null;
        }
        queue.push(currentPartialState);
      }
    };

    let inst = void 0;
    if (Component.prototype && Component.prototype.isReactComponent) {
      inst = new Component(element.props, publicContext, updater);

      if (typeof Component.getDerivedStateFromProps === `function`) {
        {
          if (inst.state === null || inst.state === undefined) {
            warning(false, `getDerivedStateFromProps: initial state is null`);
          }
        }

        const partialState = Component.getDerivedStateFromProps.call(null, element.props, inst.state);

        {
          if (partialState === undefined) {
            warning(false, `getDerivedStateFromProps: return is null`);
          }
        }

        if (partialState != null) {
          inst.state = Object.assign({}, inst.state, partialState);
        }
      }
    } else {
      // 不考虑hook
      inst = Component(element.props, publicContext);
      if (inst == null || inst.render == null) {
        child = inst;
        return;
      }
    }

    inst.props = element.props;
    inst.context = publicContext;
    inst.updater = updater;

    let initialState = inst.state;
    if (initialState === undefined) {
      inst.state = initialState = null;
    }
    if (typeof inst.componentWillMount === `function`) {
      if (typeof inst.componentWillMount === `function`) {
        // getDerivedStateFromProps 优先级更高
        if (typeof Component.getDerivedStateFromProps !== `function`) {
          inst.componentWillMount();
        }
      }
      if (queue.length) {
        const oldQueue = queue;
        const oldReplace = replace;
        queue = null;
        replace = false;

        if (oldReplace && oldQueue.length === 1) {
          inst.state = oldQueue[0];
        } else {
          let nextState = oldReplace ? oldQueue[0] : inst.state;
          let dontMutate = true;
          for (let i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
            const partial = oldQueue[i];
            const _partialState = typeof partial === `function` ? partial.call(inst, nextState, element.props, publicContext) : partial;
            if (_partialState != null) {
              if (dontMutate) {
                dontMutate = false;
                nextState = Object.assign({}, nextState, _partialState);
              } else {
                Object.assign(nextState, _partialState);
              }
            }
          }
          inst.state = nextState;
        }
      } else {
        queue = null;
      }
    }
    child = inst.render();

    let childContext = void 0;
    if (typeof inst.getChildContext === `function`) {
      const childContextTypes = Component.childContextTypes;
      if (typeof childContextTypes === `object`) {
        childContext = inst.getChildContext();
      }
    }
    if (childContext) {
      context = Object.assign({}, context, childContext);
    }
  }

  while (React.isValidElement(child)) {
    // Safe because we just checked it's an element.
    const element = child;
    const Component = element.type;
    if (typeof Component !== `function`) {
      break;
    }
    processChild(element, Component);
  }

  return { child: child, context: context };
}
