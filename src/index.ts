import ReactDOMServerRenderer from "./render";

export const ReactVersion = `16.8.6`;

export function renderToString(element: any, flag: boolean = false) {
  const renderer = new ReactDOMServerRenderer(element, flag);
  try {
    return renderer.read(Infinity);
  } finally {
    renderer.destroy();
  }
}
