"use strict";

const RESERVED = 0;
const STRING = 1;
const BOOLEANISH_STRING = 2;
const BOOLEAN = 3;
const OVERLOADED_BOOLEAN = 4;
const NUMERIC = 5;
const POSITIVE_NUMERIC = 6;

function PropertyInfoRecord(name, type, mustUseProperty, attributeName, attributeNamespace) {
  this.acceptsBooleans = type === BOOLEANISH_STRING || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
  this.attributeName = attributeName;
  this.attributeNamespace = attributeNamespace;
  this.mustUseProperty = mustUseProperty;
  this.propertyName = name;
  this.type = type;
}

// When adding attributes to this list, be sure to also add them to
// the `possibleStandardNames` module to ensure casing and incorrect
// name warnings.
const properties = {};

// These props are reserved by React. They shouldn't be written to the DOM.
[
  `children`,
  `dangerouslySetInnerHTML`,
  // TODO: This prevents the assignment of defaultValue to regular
  // elements (not just inputs). Now that ReactDOMInput assigns to the
  // defaultValue property -- do we need this?
  `defaultValue`,
  `defaultChecked`,
  `innerHTML`,
  `suppressContentEditableWarning`,
  `suppressHydrationWarning`,
  `style`
].forEach(
  name => {
    properties[name] = new PropertyInfoRecord(
      name,
      RESERVED,
      false, // mustUseProperty
      name, // attributeName
      null
    );
  } // attributeNamespace
);

// A few React string attributes have a different name.
// This is a mapping from React prop names to the attribute names.
[[`acceptCharset`, `accept-charset`], [`className`, `class`], [`htmlFor`, `for`], [`httpEquiv`, `http-equiv`]].forEach(
  function(_ref) {
    const name = _ref[0],
      attributeName = _ref[1];

    properties[name] = new PropertyInfoRecord(
      name,
      STRING,
      false, // mustUseProperty
      attributeName, // attributeName
      null
    );
  } // attributeNamespace
);

// These are "enumerated" HTML attributes that accept "true" and "false".
// In React, we let users pass `true` and `false` even though technically
// these aren't boolean attributes (they are coerced to strings).
[`contentEditable`, `draggable`, `spellCheck`, `value`].forEach(
  function(name) {
    properties[name] = new PropertyInfoRecord(
      name,
      BOOLEANISH_STRING,
      false, // mustUseProperty
      name.toLowerCase(), // attributeName
      null
    );
  } // attributeNamespace
);

// These are "enumerated" SVG attributes that accept "true" and "false".
// In React, we let users pass `true` and `false` even though technically
// these aren't boolean attributes (they are coerced to strings).
// Since these are SVG attributes, their attribute names are case-sensitive.
[`autoReverse`, `externalResourcesRequired`, `focusable`, `preserveAlpha`].forEach(
  function(name) {
    properties[name] = new PropertyInfoRecord(
      name,
      BOOLEANISH_STRING,
      false, // mustUseProperty
      name, // attributeName
      null
    );
  } // attributeNamespace
);

// These are HTML boolean attributes.
[
  `allowFullScreen`,
  `async`,
  // Note: there is a special case that prevents it from being written to the DOM
  // on the client side because the browsers are inconsistent. Instead we call focus().
  `autoFocus`,
  `autoPlay`,
  `controls`,
  `default`,
  `defer`,
  `disabled`,
  `formNoValidate`,
  `hidden`,
  `loop`,
  `noModule`,
  `noValidate`,
  `open`,
  `playsInline`,
  `readOnly`,
  `required`,
  `reversed`,
  `scoped`,
  `seamless`,
  // Microdata
  `itemScope`
].forEach(
  function(name) {
    properties[name] = new PropertyInfoRecord(
      name,
      BOOLEAN,
      false, // mustUseProperty
      name.toLowerCase(), // attributeName
      null
    );
  } // attributeNamespace
);

// These are the few React props that we set as DOM properties
// rather than attributes. These are all booleans.
[
  `checked`,
  // Note: `option.selected` is not updated if `select.multiple` is
  // disabled with `removeAttribute`. We have special logic for handling this.
  `multiple`,
  `muted`,
  `selected`
].forEach(
  function(name) {
    properties[name] = new PropertyInfoRecord(
      name,
      BOOLEAN,
      true, // mustUseProperty
      name, // attributeName
      null
    );
  } // attributeNamespace
);

// These are HTML attributes that are "overloaded booleans": they behave like
// booleans, but can also accept a string value.
[`capture`, `download`].forEach(
  function(name) {
    properties[name] = new PropertyInfoRecord(
      name,
      OVERLOADED_BOOLEAN,
      false, // mustUseProperty
      name, // attributeName
      null
    );
  } // attributeNamespace
);

// These are HTML attributes that must be positive numbers.
[`cols`, `rows`, `size`, `span`].forEach(
  function(name) {
    properties[name] = new PropertyInfoRecord(
      name,
      POSITIVE_NUMERIC,
      false, // mustUseProperty
      name, // attributeName
      null
    );
  } // attributeNamespace
);

// These are HTML attributes that must be numbers.
[`rowSpan`, `start`].forEach(
  function(name) {
    properties[name] = new PropertyInfoRecord(
      name,
      NUMERIC,
      false, // mustUseProperty
      name.toLowerCase(), // attributeName
      null
    );
  } // attributeNamespace
);

// eslint-disable-next-line no-useless-escape
const CAMELIZE = /[\-\:]([a-z])/g;
const capitalize = function(token) {
  return token[1].toUpperCase();
};

// This is a list of all SVG attributes that need special casing, namespacing,
// or boolean value assignment. Regular attributes that just accept strings
// and have the same names are omitted, just like in the HTML whitelist.
// Some of these attributes can be hard to find. This list was created by
// scrapping the MDN documentation.
[
  `accent-height`,
  `alignment-baseline`,
  `arabic-form`,
  `baseline-shift`,
  `cap-height`,
  `clip-path`,
  `clip-rule`,
  `color-interpolation`,
  `color-interpolation-filters`,
  `color-profile`,
  `color-rendering`,
  `dominant-baseline`,
  `enable-background`,
  `fill-opacity`,
  `fill-rule`,
  `flood-color`,
  `flood-opacity`,
  `font-family`,
  `font-size`,
  `font-size-adjust`,
  `font-stretch`,
  `font-style`,
  `font-variant`,
  `font-weight`,
  `glyph-name`,
  `glyph-orientation-horizontal`,
  `glyph-orientation-vertical`,
  `horiz-adv-x`,
  `horiz-origin-x`,
  `image-rendering`,
  `letter-spacing`,
  `lighting-color`,
  `marker-end`,
  `marker-mid`,
  `marker-start`,
  `overline-position`,
  `overline-thickness`,
  `paint-order`,
  `panose-1`,
  `pointer-events`,
  `rendering-intent`,
  `shape-rendering`,
  `stop-color`,
  `stop-opacity`,
  `strikethrough-position`,
  `strikethrough-thickness`,
  `stroke-dasharray`,
  `stroke-dashoffset`,
  `stroke-linecap`,
  `stroke-linejoin`,
  `stroke-miterlimit`,
  `stroke-opacity`,
  `stroke-width`,
  `text-anchor`,
  `text-decoration`,
  `text-rendering`,
  `underline-position`,
  `underline-thickness`,
  `unicode-bidi`,
  `unicode-range`,
  `units-per-em`,
  `v-alphabetic`,
  `v-hanging`,
  `v-ideographic`,
  `v-mathematical`,
  `vector-effect`,
  `vert-adv-y`,
  `vert-origin-x`,
  `vert-origin-y`,
  `word-spacing`,
  `writing-mode`,
  `xmlns:xlink`,
  `x-height`
].forEach(
  function(attributeName) {
    const name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(
      name,
      STRING,
      false, // mustUseProperty
      attributeName,
      null
    );
  } // attributeNamespace
);

// String SVG attributes with the xlink namespace.
[`xlink:actuate`, `xlink:arcrole`, `xlink:href`, `xlink:role`, `xlink:show`, `xlink:title`, `xlink:type`].forEach(function(attributeName) {
  const name = attributeName.replace(CAMELIZE, capitalize);
  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName,
    `http://www.w3.org/1999/xlink`
  );
});

// String SVG attributes with the xml namespace.
[`xml:base`, `xml:lang`, `xml:space`].forEach(function(attributeName) {
  const name = attributeName.replace(CAMELIZE, capitalize);
  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName,
    `http://www.w3.org/XML/1998/namespace`
  );
});

// These attribute exists both in HTML and SVG.
// The attribute name is case-sensitive in SVG so we can't just use
// the React name like we do for attributes that exist only in HTML.
[`tabIndex`, `crossOrigin`].forEach(
  function(attributeName) {
    properties[attributeName] = new PropertyInfoRecord(
      attributeName,
      STRING,
      false, // mustUseProperty
      attributeName.toLowerCase(), // attributeName
      null
    );
  } // attributeNamespace
);

export function getPropertyInfo(name) {
  return properties.hasOwnProperty(name) ? properties[name] : null;
}

export function shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag) {
  if (propertyInfo !== null) {
    return propertyInfo.type === RESERVED;
  }
  if (isCustomComponentTag) {
    return false;
  }
  if (name.length > 2 && (name[0] === `o` || name[0] === `O`) && (name[1] === `n` || name[1] === `N`)) {
    return true;
  }
  return false;
}

function shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag) {
  if (propertyInfo !== null && propertyInfo.type === RESERVED) {
    return false;
  }
  switch (typeof value) {
    // $FlowIssue symbol is perfectly valid here
    case `function`:
    case `symbol`:
      // eslint-disable-line
      return true;
    case `boolean`: {
      if (isCustomComponentTag) {
        return false;
      }
      if (propertyInfo !== null) {
        return !propertyInfo.acceptsBooleans;
      } else {
        const prefix = name.toLowerCase().slice(0, 5);
        return prefix !== `data-` && prefix !== `aria-`;
      }
    }
    default:
      return false;
  }
}

export function shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag) {
  if (value === null || typeof value === `undefined`) {
    return true;
  }
  if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag)) {
    return true;
  }
  if (isCustomComponentTag) {
    return false;
  }
  if (propertyInfo !== null) {
    switch (propertyInfo.type) {
      case BOOLEAN:
        return !value;
      case OVERLOADED_BOOLEAN:
        return value === false;
      case NUMERIC:
        return isNaN(value);
      case POSITIVE_NUMERIC:
        return isNaN(value) || value < 1;
    }
  }
  return false;
}
