"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _require = require("./doc-utils"),
    getRightOrNull = _require.getRightOrNull,
    getRight = _require.getRight,
    getLeft = _require.getLeft,
    getLeftOrNull = _require.getLeftOrNull,
    concatArrays = _require.concatArrays,
    chunkBy = _require.chunkBy,
    isTagStart = _require.isTagStart,
    isTagEnd = _require.isTagEnd,
    isContent = _require.isContent,
    last = _require.last,
    first = _require.first;

var _require2 = require("./errors"),
    XTTemplateError = _require2.XTTemplateError,
    throwExpandNotFound = _require2.throwExpandNotFound,
    getLoopPositionProducesInvalidXMLError = _require2.getLoopPositionProducesInvalidXMLError;

function lastTagIsOpenTag(tags, tag) {
  if (tags.length === 0) {
    return false;
  }

  var innerLastTag = last(tags).tag.substr(1);
  var innerCurrentTag = tag.substr(2, tag.length - 3);
  return innerLastTag.indexOf(innerCurrentTag) === 0;
}

function addTag(tags, tag) {
  tags.push({
    tag: tag
  });
  return tags;
}

function getListXmlElements(parts) {
  /*
  get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
  returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
  */
  var tags = parts.filter(function (part) {
    return part.type === "tag";
  });
  var result = [];

  for (var i = 0, tag; i < tags.length; i++) {
    tag = tags[i].value; // closing tag

    if (tag[1] === "/") {
      if (lastTagIsOpenTag(result, tag)) {
        result.pop();
      } else {
        result = addTag(result, tag);
      }
    } else if (tag[tag.length - 2] !== "/") {
      result = addTag(result, tag);
    }
  }

  return result;
}

function has(name, xmlElements) {
  for (var i = 0; i < xmlElements.length; i++) {
    var xmlElement = xmlElements[i];

    if (xmlElement.tag.indexOf("<".concat(name)) === 0) {
      return true;
    }
  }

  return false;
}

function getExpandToDefault(postparsed, pair, expandTags) {
  var parts = postparsed.slice(pair[0].offset, pair[1].offset);
  var xmlElements = getListXmlElements(parts);
  var closingTagCount = xmlElements.filter(function (xmlElement) {
    return xmlElement.tag[1] === "/";
  }).length;
  var startingTagCount = xmlElements.filter(function (xmlElement) {
    var tag = xmlElement.tag;
    return tag[1] !== "/" && tag[tag.length - 2] !== "/";
  }).length;

  if (closingTagCount !== startingTagCount) {
    return {
      error: getLoopPositionProducesInvalidXMLError({
        tag: first(pair).part.value,
        offset: [first(pair).part.offset, last(pair).part.offset]
      })
    };
  }

  var _loop = function _loop(i, len) {
    var _expandTags$i = expandTags[i],
        contains = _expandTags$i.contains,
        expand = _expandTags$i.expand,
        onlyTextInTag = _expandTags$i.onlyTextInTag;

    if (has(contains, xmlElements)) {
      if (onlyTextInTag) {
        var left = getLeftOrNull(postparsed, contains, pair[0].offset);
        var right = getRightOrNull(postparsed, contains, pair[1].offset);

        if (left === null || right === null) {
          return "continue";
        }

        var chunks = chunkBy(postparsed.slice(left, right), function (p) {
          if (isTagStart(contains, p)) {
            return "start";
          }

          if (isTagEnd(contains, p)) {
            return "end";
          }

          return null;
        });

        if (chunks.length <= 2) {
          return "continue";
        }

        var firstChunk = first(chunks);
        var lastChunk = last(chunks);
        var firstContent = firstChunk.filter(isContent);
        var lastContent = lastChunk.filter(isContent);

        if (firstContent.length !== 1 || lastContent.length !== 1) {
          return "continue";
        }
      }

      return {
        v: {
          value: expand
        }
      };
    }
  };

  for (var i = 0, len = expandTags.length; i < len; i++) {
    var _ret = _loop(i, len);

    switch (_ret) {
      case "continue":
        continue;

      default:
        if (_typeof(_ret) === "object") return _ret.v;
    }
  }

  return false;
}

function expandOne(part, index, postparsed, options) {
  var expandTo = part.expandTo || options.expandTo;

  if (!expandTo) {
    return postparsed;
  }

  var right, left;

  try {
    left = getLeft(postparsed, expandTo, index);
    right = getRight(postparsed, expandTo, index);
  } catch (rootError) {
    if (rootError instanceof XTTemplateError) {
      throwExpandNotFound(_objectSpread({
        part: part,
        rootError: rootError,
        postparsed: postparsed,
        expandTo: expandTo,
        index: index
      }, options.error));
    }

    throw rootError;
  }

  var leftParts = postparsed.slice(left, index);
  var rightParts = postparsed.slice(index + 1, right + 1);
  var inner = options.getInner({
    postparse: options.postparse,
    index: index,
    part: part,
    leftParts: leftParts,
    rightParts: rightParts,
    left: left,
    right: right,
    postparsed: postparsed
  });

  if (!inner.length) {
    inner.expanded = [leftParts, rightParts];
    inner = [inner];
  }

  return concatArrays([postparsed.slice(0, left), inner, postparsed.slice(right + 1)]);
}

function expandToOne(postparsed, options) {
  var errors = [];

  if (postparsed.errors) {
    errors = postparsed.errors;
    postparsed = postparsed.postparsed;
  }

  for (var i = 0, len = postparsed.length; i < len; i++) {
    var part = postparsed[i];

    if (options.lIndex != null && part.lIndex <= options.lIndex) {
      continue;
    }

    if (part.type === "placeholder" && part.module === options.moduleName) {
      try {
        postparsed = expandOne(part, i, postparsed, options);
      } catch (error) {
        if (error instanceof XTTemplateError) {
          errors.push(error);
        } else {
          throw error;
        }
      }

      options.lIndex = part.lIndex;
      return expandToOne({
        postparsed: postparsed,
        errors: errors
      }, options);
    }
  }

  return {
    postparsed: postparsed,
    errors: errors
  };
}

module.exports = {
  expandToOne: expandToOne,
  getExpandToDefault: getExpandToDefault
};