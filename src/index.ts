const stream = require(`stream`);
import ReactDOMServerRenderer from "./react-render";

export const ReactVersion = `16.8.6`;

// https://www.jianshu.com/p/8738832e7515
class ReactMarkupReadableStream extends stream.Readable {
  constructor(element, makeStaticMarkup) {
    super({});
    this.partialRenderer = new ReactDOMServerRenderer(element, makeStaticMarkup);
  }

  _destroy(err, callback) {
    this.partialRenderer.destroy();
    callback(err);
  }

  _read(size) {
    try {
      this.push(this.partialRenderer.read(size));
    } catch (err) {
      this.destroy(err);
    }
  }
}

export function renderToString(element, flag: boolean = false) {
  const renderer = new ReactDOMServerRenderer(element, flag);
  try {
    return renderer.read(Infinity);
  } finally {
    renderer.destroy();
  }
}

export function renderToNodeStream(element, flag: boolean = false) {
  return new ReactMarkupReadableStream(element, flag);
}
