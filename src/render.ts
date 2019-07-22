import { escapeTextForBrowser, flattenOptionChildren, createOpenTagMarkup, flattenTopLevelChildren } from "./react-util";
import { invariant, warning } from "./react-log";
import { resolve } from "./resolve";
import * as REACT from "./react-types";
import * as TAGS from "./react-tags";

const React = require(`react`);
const toArray = React.Children.toArray;

export default class ReactDOMServerRenderer {
  stack = [];
  makeStaticMarkup: false;
  exhausted = false;
  currentSelectValue = null;
  previousWasTextNode = false;
  // Context (new API)
  contextIndex = -1;
  contextStack = [];
  contextValueStack = [];

  constructor(children: any, makeStaticMarkup: any) {
    this.stack = [
      {
        type: null,
        children: flattenTopLevelChildren(children),
        childIndex: 0,
        context: {},
        footer: ``
      }
    ];
    this.makeStaticMarkup = makeStaticMarkup;
  }

  destroy() {
    if (!this.exhausted) {
      this.exhausted = true;
      this.clearProviders();
    }
  }

  pushProvider(provider) {
    // 之所以需要push，是因为可以存在多个相同的Provider
    const index = ++this.contextIndex;
    const context = provider.type._context;
    const previousValue = context[0];
    this.contextStack[index] = context;
    this.contextValueStack[index] = previousValue;
    context[0] = provider.props.value;
  }

  popProvider() {
    const index = this.contextIndex;
    const context = this.contextStack[index];
    const previousValue = this.contextValueStack[index];
    this.contextStack[index] = null;
    this.contextValueStack[index] = null;
    this.contextIndex--;
    context[0] = previousValue;
  }

  clearProviders() {
    // Restore any remaining providers on the stack to previous values
    for (let index = this.contextIndex; index >= 0; index--) {
      const _context = this.contextStack[index];
      const previousValue = this.contextValueStack[index];
      _context[0] = previousValue;
    }
  }

  read(bytes) {
    if (this.exhausted) {
      return null;
    }
    let out = ``;
    while (out.length < bytes) {
      if (this.stack.length === 0) {
        this.exhausted = true;
        break;
      }
      const frame = this.stack[this.stack.length - 1];
      // 表示节点完结
      if (frame.childIndex >= frame.children.length) {
        const _footer = frame.footer;
        if (_footer !== ``) {
          this.previousWasTextNode = false;
        }
        this.stack.pop();
        if (frame.type === `select`) {
          this.currentSelectValue = null;
        } else if (frame.type != null && frame.type.type != null && frame.type.type.$$typeof === REACT.PROVIDER_TYPE) {
          this.popProvider();
        } else if (frame.type === REACT.SUSPENSE_TYPE) {
          invariant(false, `ReactDOMServer does not yet support Suspense.`);
        }
        // Flush output
        out += _footer;
        continue;
      }
      const child = frame.children[frame.childIndex++];
      out += this.render(child, frame.context);
    }
    return out;
  }

  render(child, context) {
    if (typeof child === `string` || typeof child === `number`) {
      const text = `` + child;
      if (text === ``) {
        return ``;
      }
      if (this.makeStaticMarkup) {
        return escapeTextForBrowser(text);
      }
      // 插入`<!-- -->`用作区分
      if (this.previousWasTextNode) {
        return `<!-- -->` + escapeTextForBrowser(text);
      }
      this.previousWasTextNode = true;
      return escapeTextForBrowser(text);
    } else {
      let nextChild = void 0;
      // resolve 处理组件，如果是 child 是普通的 dom 解决，就直接返回
      const _resolve = resolve(child, context);
      nextChild = _resolve.child;
      context = _resolve.context;

      if (nextChild === null || nextChild === false) {
        return ``;
      } else if (!React.isValidElement(nextChild)) {
        if (nextChild != null && nextChild.$$typeof != null) {
          // Catch unexpected special types early.
          const $$typeof = nextChild.$$typeof;
          if ($$typeof === REACT.PORTAL_TYPE) {
            invariant(false, `Portals are not currently supported`);
          }
          // Catch-all to prevent an infinite loop if React.Children.toArray() supports some new type.
          invariant(false, `Unknown element-like object type: %s. This is likely a bug in React. Please file an issue.`, $$typeof.toString());
        }
        const nextChildren = toArray(nextChild);
        const frame = {
          type: null,
          children: nextChildren,
          childIndex: 0,
          context: context,
          footer: ``
        };
        this.stack.push(frame);
        return ``;
      }
      // Safe because we just checked it's an element.
      const nextElement = nextChild;
      const elementType = nextElement.type;

      // 如果是 dom 节点，就直接输出
      if (typeof elementType === `string`) {
        return this.renderDOM(nextElement, context);
      }

      switch (elementType) {
        case REACT.STRICT_MODE_TYPE:
        case REACT.CONCURRENT_MODE_TYPE:
        case REACT.PROFILER_TYPE:
        case REACT.FRAGMENT_TYPE: {
          const _frame = {
            type: null,
            children: toArray(nextChild.props.children),
            childIndex: 0,
            context: context,
            footer: ``
          };
          this.stack.push(_frame);
          return ``;
        }
        case REACT.SUSPENSE_TYPE:
          invariant(false, `ReactDOMServer does not yet support Suspense.`);
        // eslint-disable-next-line-no-fallthrough
        default:
          break;
      }
      if (typeof elementType === `object` && elementType !== null) {
        switch (elementType.$$typeof) {
          case REACT.FORWARD_REF_TYPE: {
            const element = nextChild;
            let _nextChildren4 = void 0;
            // const componentIdentity = {};
            // repareToUseHooks(componentIdentity);
            _nextChildren4 = elementType.render(element.props, element.ref);
            // _nextChildren4 = finishHooks(elementType.render, element.props, _nextChildren4, element.ref);
            _nextChildren4 = toArray(_nextChildren4);
            const _frame4 = {
              type: null,
              children: _nextChildren4,
              childIndex: 0,
              context: context,
              footer: ``
            };
            this.stack.push(_frame4);
            return ``;
          }
          case REACT.MEMO_TYPE: {
            this.stack.push({
              type: null,
              children: [React.createElement(elementType.type, Object.assign({ ref: nextChild.ref }, nextChild.props))],
              childIndex: 0,
              context: context,
              footer: ``
            });
            return ``;
          }
          case REACT.PROVIDER_TYPE: {
            const provider = nextChild;
            const nextProps = provider.props;
            this.pushProvider(provider);

            this.stack.push({
              type: provider,
              children: toArray(nextProps.children),
              childIndex: 0,
              context: context,
              footer: ``
            });
            return ``;
          }
          case REACT.CONTEXT_TYPE: {
            let reactContext = nextChild.type;
            // The logic below for Context differs depending on PROD or DEV mode. In
            // DEV mode, we create a separate object for Context.Consumer that acts
            // like a proxy to Context. This proxy object adds unnecessary code in PROD
            // so we use the old behaviour (Context.Consumer references Context) to
            // reduce size and overhead. The separate object references context via
            // a property called "_context", which also gives us the ability to check
            // in DEV mode if this property exists or not and warn if it does not.
            {
              if (reactContext._context === undefined) {
                // This may be because it's a Context (rather than a Consumer).
                // Or it may be because it's older React where they're the same thing.
                // We only want to warn if we're sure it's a new React.
                if (reactContext !== reactContext.Consumer) {
                  warning(
                    false,
                    `Rendering <Context> directly is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?`
                  );
                }
              } else {
                reactContext = reactContext._context;
              }
            }
            this.stack.push({
              type: nextChild,
              children: toArray(nextChild.props.children(reactContext[0])),
              childIndex: 0,
              context: context,
              footer: ``
            });
            return ``;
          }
          case REACT.LAZY_TYPE:
            invariant(false, `ReactDOMServer does not yet support lazy-loaded components.`);
        }
      }

      // 非合法类型，报错
      invariant(
        false,
        `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: %s`,
        elementType == null ? elementType : typeof elementType
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renderDOM(element, context) {
    const tag = element.type.toLowerCase();
    let props = element.props;
    if (tag === `input`) {
      {
        // defaultChecked和checked必须居其一，否则出现警告
        if (props.checked !== undefined && props.defaultChecked !== undefined) {
          warning(false, `%s contains an input of type %s with both checked and defaultChecked props. `, props.type);
        }
        // defaultValue和value必须居其一，否则出现警告
        if (props.value !== undefined && props.defaultValue !== undefined) {
          warning(false, `%s contains an input of type %s with both value and defaultValue props. `, props.type);
        }
      }

      props = Object.assign(
        {
          type: undefined
        },
        props,
        {
          defaultChecked: undefined,
          defaultValue: undefined,
          value: props.value != null ? props.value : props.defaultValue,
          checked: props.checked != null ? props.checked : props.defaultChecked
        }
      );
    } else if (tag === `textarea`) {
      {
        // defaultValue和value必须居其一，否则出现警告
        if (props.value !== undefined && props.defaultValue !== undefined) {
          warning(false, `Textarea elements must be either controlled or uncontrolled`);
        }
      }

      let initialValue = props.value;
      if (initialValue == null) {
        let defaultValue = props.defaultValue;
        // TODO (yungsters): Remove support for children content in <textarea>.
        if (props.children != null) {
          warning(false, `Use the \`defaultValue\` or \`value\` props instead of setting children on <textarea>.`);
        }
        if (defaultValue == null) {
          defaultValue = ``;
        }
        initialValue = defaultValue;
      }

      props = Object.assign({}, props, {
        value: undefined,
        children: `` + initialValue
      });
    } else if (tag === `select`) {
      {
        const valuePropNames = [`value`, `defaultValue`];
        for (let i = 0; i < valuePropNames.length; i++) {
          const propName = valuePropNames[i];
          if (props[propName] == null) {
            continue;
          }
          const isArray = Array.isArray(props[propName]);
          if (props.multiple && !isArray) {
            warning(false, `The \`%s\` prop supplied to <select> must be an array if \`multiple\` is true.`, propName);
          } else if (!props.multiple && isArray) {
            warning(false, `The \`%s\` prop supplied to <select> must be a scalar value if \`multiple\` is false.`, propName);
          }
        }

        if (props.value !== undefined && props.defaultValue !== undefined) {
          warning(false, `Select elements must be either controlled or uncontrolled`);
        }
      }
      this.currentSelectValue = props.value != null ? props.value : props.defaultValue;
      props = Object.assign({}, props, {
        value: undefined
      });
    } else if (tag === `option`) {
      let selected = null;
      const selectValue = this.currentSelectValue;
      const optionChildren = flattenOptionChildren(props.children);
      if (selectValue != null) {
        let value = void 0;
        if (props.value != null) {
          value = props.value + ``;
        } else {
          value = optionChildren;
        }
        selected = false;
        if (Array.isArray(selectValue)) {
          // multiple
          for (let j = 0; j < selectValue.length; j++) {
            if (`` + selectValue[j] === value) {
              selected = true;
              break;
            }
          }
        } else {
          selected = `` + selectValue === value;
        }

        props = Object.assign(
          {
            selected: undefined,
            children: undefined
          },
          props,
          {
            selected: selected,
            children: optionChildren
          }
        );
      }
    }

    // out 输出前半部分, footer 输出后半部分
    let out = createOpenTagMarkup(element.type, tag, props, this.makeStaticMarkup, this.stack.length === 1);
    let footer = ``;
    // omittedCloseTags 表示是否自我闭合
    if (TAGS.omittedCloseTags.hasOwnProperty(tag)) {
      out += `/>`;
    } else {
      out += `>`;
      footer = `</` + element.type + `>`;
    }

    // 如果 child 是文字或数字，直接输出
    let innerMarkup: any = null;
    if (props.dangerouslySetInnerHTML != null && props.dangerouslySetInnerHTML.__html != null) {
      innerMarkup = props.dangerouslySetInnerHTML.__html;
    } else if (typeof props.children === `string` || typeof props.children === `number`) {
      innerMarkup = escapeTextForBrowser(props.children);
    }

    let children = void 0;
    if (innerMarkup != null) {
      children = [];
      // 有些标签会吃掉换行符（\n），所以需要补上
      if (TAGS.newlineEatingTags[tag] && innerMarkup.charAt(0) === `\n`) {
        out += `\n`;
      }
      out += innerMarkup;
    } else {
      children = toArray(props.children);
    }
    const frame = {
      type: tag,
      children: children,
      childIndex: 0,
      context: context,
      footer: footer
    };
    this.stack.push(frame);
    this.previousWasTextNode = false;
    return out;
  }
}
