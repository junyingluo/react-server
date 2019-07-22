"use strict";
const React = require(`react`);
const toArray = React.Children.toArray;
import * as REACT from "./react-types";
import { warning } from "./react-log";
import { getPropertyInfo, shouldRemoveAttribute, shouldIgnoreAttribute } from "./react-property";

// 取出context
function maskContext(type, context) {
  const contextTypes = type.contextTypes;
  if (!contextTypes) {
    return {};
  }
  const maskedContext = {};
  for (const contextName in contextTypes) {
    maskedContext[contextName] = context[contextName];
  }
  return maskedContext;
}

function processContext(type, context) {
  const contextType = type.contextType;
  // 第一个if语句，不太清楚？
  if (typeof contextType === `object` && contextType !== null) {
    return contextType[0];
  } else {
    const maskedContext = maskContext(type, context);
    return maskedContext;
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

    {
      if (child === undefined && inst.render._isMockFunction) {
        // This is probably bad practice. Consider warning here and
        // deprecating this convenience.
        child = null;
      }
    }

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

function escapeHtml(string) {
  const matchHtmlRegExp = /["'&<>]/;
  const str = `` + string;
  const match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  let escape = void 0;
  let html = ``;
  let index = void 0;
  let lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        // "
        escape = `&quot;`;
        break;
      case 38:
        // &
        escape = `&amp;`;
        break;
      case 39:
        // '
        escape = `&#x27;`; // modified from escape-html; used to be '&#39'
        break;
      case 60:
        // <
        escape = `&lt;`;
        break;
      case 62:
        // >
        escape = `&gt;`;
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}

export function escapeTextForBrowser(text) {
  if (typeof text === `boolean` || typeof text === `number`) {
    // this shortcircuit helps perf for types that we know will never have
    // special characters, especially given that this function is used often
    // for numeric dom ids.
    return `` + text;
  }
  return escapeHtml(text);
}

const styleNameCache = {};
function hyphenateStyleName(name) {
  const uppercasePattern = /([A-Z])/g;
  const msPattern = /^ms-/;
  return name
    .replace(uppercasePattern, `-$1`)
    .toLowerCase()
    .replace(msPattern, `-ms-`);
}
const processStyleName = function(styleName) {
  if (styleNameCache.hasOwnProperty(styleName)) {
    return styleNameCache[styleName];
  }
  const result = hyphenateStyleName(styleName);
  styleNameCache[styleName] = result;
  return result;
};

function dangerousStyleValue(name, value, isCustomProperty) {
  const isEmpty = value == null || typeof value === `boolean` || value === ``;
  if (isEmpty) {
    return ``;
  }

  const isUnitlessNumber = {
    animationIterationCount: true,
    borderImageOutset: true,
    borderImageSlice: true,
    borderImageWidth: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    columns: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridArea: true,
    gridRow: true,
    gridRowEnd: true,
    gridRowSpan: true,
    gridRowStart: true,
    gridColumn: true,
    gridColumnEnd: true,
    gridColumnSpan: true,
    gridColumnStart: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,

    // SVG-related properties
    fillOpacity: true,
    floodOpacity: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeDashoffset: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true
  };

  if (!isCustomProperty && typeof value === `number` && value !== 0 && !(isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name])) {
    return value + `px`; // Presumes implicit 'px' suffix for unitless numbers
  }

  return (`` + value).trim();
}

function createMarkupForStyles(styles) {
  let serialized = ``;
  let delimiter = ``;
  for (const styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) {
      continue;
    }
    const isCustomProperty = styleName.indexOf(`--`) === 0;
    const styleValue = styles[styleName];
    {
      /*
      if (!isCustomProperty) {
        warnValidStyle$1(styleName, styleValue);
      }
      */
    }
    if (styleValue != null) {
      serialized += delimiter + processStyleName(styleName) + `:`;
      serialized += dangerousStyleValue(styleName, styleValue, isCustomProperty);

      delimiter = `;`;
    }
  }
  return serialized || null;
}

export function flattenOptionChildren(children) {
  if (children === undefined || children === null) {
    return children;
  }
  let content = ``;
  // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.
  React.Children.forEach(children, function(child) {
    if (child == null) {
      return;
    }
    content += child;
    {
      if (typeof child !== `string` && typeof child !== `number`) {
        warning(false, `Only strings and numbers are supported as <option> children.`);
      }
    }
  });
  return content;
}

function isCustomComponent(tagName, props) {
  if (tagName.indexOf(`-`) === -1) {
    return typeof props.is === `string`;
  }
  switch (tagName) {
    // These are reserved SVG and MathML elements.
    // We don't mind this whitelist too much because we expect it to never grow.
    // The alternative is to track the namespace in a few places which is convoluted.
    // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
    case `annotation-xml`:
    case `color-profile`:
    case `font-face`:
    case `font-face-src`:
    case `font-face-uri`:
    case `font-face-format`:
    case `font-face-name`:
    case `missing-glyph`:
      return false;
    default:
      return true;
  }
}

function quoteAttributeValueForBrowser(value) {
  return `"` + escapeTextForBrowser(value) + `"`;
}

function createMarkupForCustomAttribute(name, value) {
  return name + `=` + quoteAttributeValueForBrowser(value);
}

function createMarkupForProperty(name, value) {
  const BOOLEAN = 3;
  const OVERLOADED_BOOLEAN = 4;
  const propertyInfo = getPropertyInfo(name);
  if (name !== `style` && shouldIgnoreAttribute(name, propertyInfo, false)) {
    return ``;
  }
  if (shouldRemoveAttribute(name, value, propertyInfo, false)) {
    return ``;
  }
  if (propertyInfo !== null) {
    const attributeName = propertyInfo.attributeName;
    const type = propertyInfo.type;

    if (type === BOOLEAN || (type === OVERLOADED_BOOLEAN && value === true)) {
      return attributeName + `=""`;
    } else {
      return attributeName + `=` + quoteAttributeValueForBrowser(value);
    }
  } /*if (isAttributeNameSafe(name))*/ else {
    return name + `=` + quoteAttributeValueForBrowser(value);
  }
  return ``;
}

export function createOpenTagMarkup(tagVerbatim, tagLowercase, props, namespace, makeStaticMarkup, isRootElement) {
  let ret = `<` + tagVerbatim;

  for (const propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    let propValue = props[propKey];
    if (propValue == null) {
      continue;
    }
    if (propKey === `style`) {
      propValue = createMarkupForStyles(propValue);
    }
    let markup = null;
    if (isCustomComponent(tagLowercase, props)) {
      const RESERVED_PROPS = {
        children: null,
        dangerouslySetInnerHTML: null,
        suppressContentEditableWarning: null,
        suppressHydrationWarning: null
      };
      if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
        markup = createMarkupForCustomAttribute(propKey, propValue);
      }
    } else {
      markup = createMarkupForProperty(propKey, propValue);
    }
    if (markup) {
      ret += ` ` + markup;
    }
  }

  // For static pages, no need to put React ID and checksum. Saves lots of
  // bytes.
  if (makeStaticMarkup) {
    return ret;
  }

  if (isRootElement) {
    ret += ` data-reactroot=""`;
  }
  return ret;
}

export function flattenTopLevelChildren(children) {
  if (!React.isValidElement(children)) {
    return toArray(children);
  }
  const element = children;
  if (element.type !== REACT.FRAGMENT_TYPE) {
    return [element];
  }
  const fragmentChildren = element.props.children;
  if (!React.isValidElement(fragmentChildren)) {
    return toArray(fragmentChildren);
  }
  const fragmentChildElement = fragmentChildren;
  return [fragmentChildElement];
}
