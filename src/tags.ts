"use strict";

// 自我闭合的标签
export const omittedCloseTags = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true
};

// 会吃掉换行符的标签
export const newlineEatingTags = {
  listing: true,
  pre: true,
  textarea: true
};
