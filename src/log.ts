"use strict";

function log(level: boolean, condition: boolean, format: string, ...args: string[]) {
  if (format === undefined) {
    throw new Error(`invariant requires an error message argument`);
  }
  if (!condition) {
    if (args != undefined) {
      let argIndex = 0;
      format = format.replace(/%s/g, function() {
        return args[argIndex++];
      });
    }
    if (level) {
      console.error(format);
    } else {
      console.log(format);
    }
  }
}

// 严重错误
export const invariant = log.bind(null, true);
// 警告错误
export const warning = log.bind(null, false);
