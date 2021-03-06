"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require("../doc-utils"),
    mergeObjects = _require.mergeObjects,
    chunkBy = _require.chunkBy,
    last = _require.last,
    isParagraphStart = _require.isParagraphStart,
    isParagraphEnd = _require.isParagraphEnd,
    isContent = _require.isContent,
    startsWith = _require.startsWith;

var wrapper = require("../module-wrapper");

var moduleName = "loop";

function hasContent(parts) {
  return parts.some(function (part) {
    return isContent(part);
  });
}

function getFirstMeaningFulPart(parsed) {
  for (var i = 0, len = parsed.length; i < len; i++) {
    if (parsed[i].type !== "content") {
      return parsed[i];
    }
  }

  return null;
}

function isInsideParagraphLoop(part) {
  var firstMeaningfulPart = getFirstMeaningFulPart(part.subparsed);
  return firstMeaningfulPart != null && firstMeaningfulPart.tag !== "w:t";
}

function getPageBreakIfApplies(part) {
  if (part.hasPageBreak) {
    if (isInsideParagraphLoop(part)) {
      return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    }
  }

  return "";
}

function isEnclosedByParagraphs(parsed) {
  if (parsed.length === 0) {
    return false;
  }

  return isParagraphStart(parsed[0]) && isParagraphEnd(last(parsed));
}

function getOffset(chunk) {
  return hasContent(chunk) ? 0 : chunk.length;
}

function addPageBreakAtEnd(subRendered) {
  var found = false;
  var i = subRendered.parts.length - 1;

  for (var j = subRendered.parts.length - 1; i >= 0; i--) {
    var p = subRendered.parts[j];

    if (p === "</w:p>" && !found) {
      found = true;
      subRendered.parts.splice(j, 0, '<w:r><w:br w:type="page"/></w:r>');
      break;
    }
  }

  if (!found) {
    subRendered.parts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
  }
}

function addPageBreakAtBeginning(subRendered) {
  subRendered.parts.unshift('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
}

function dropHeaderFooterRefs(parts) {
  return parts.filter(function (text) {
    if (startsWith(text, "<w:headerReference") || startsWith(text, "<w:footerReference")) {
      return false;
    }

    return true;
  });
}

function hasPageBreak(chunk) {
  return chunk.some(function (part) {
    if (part.tag === "w:br" && part.value.indexOf('w:type="page"') !== -1) {
      return true;
    }
  });
}

function getSectPrHeaderFooterChangeCount(chunks) {
  var collectSectPr = false;
  var sectPrCount = 0;
  chunks.forEach(function (part) {
    if (part.tag === "w:sectPr" && part.position === "start") {
      collectSectPr = true;
    }

    if (collectSectPr) {
      if (part.tag === "w:headerReference" || part.tag === "w:footerReference") {
        sectPrCount++;
        collectSectPr = false;
      }
    }

    if (part.tag === "w:sectPr" && part.position === "end") {
      collectSectPr = false;
    }
  });
  return sectPrCount;
}

var LoopModule = /*#__PURE__*/function () {
  function LoopModule() {
    _classCallCheck(this, LoopModule);

    this.name = "LoopModule";
    this.prefix = {
      start: "#",
      end: "/",
      dash: /^-([^\s]+)\s(.+)$/,
      inverted: "^"
    };
  }

  _createClass(LoopModule, [{
    key: "parse",
    value: function parse(placeHolderContent, _ref) {
      var match = _ref.match,
          getValue = _ref.getValue,
          getValues = _ref.getValues;
      var module = moduleName;
      var type = "placeholder";
      var _this$prefix = this.prefix,
          start = _this$prefix.start,
          inverted = _this$prefix.inverted,
          dash = _this$prefix.dash,
          end = _this$prefix.end;

      if (match(start, placeHolderContent)) {
        return {
          type: type,
          value: getValue(start, placeHolderContent),
          expandTo: "auto",
          module: module,
          location: "start",
          inverted: false
        };
      }

      if (match(inverted, placeHolderContent)) {
        return {
          type: type,
          value: getValue(inverted, placeHolderContent),
          expandTo: "auto",
          module: module,
          location: "start",
          inverted: true
        };
      }

      if (match(end, placeHolderContent)) {
        return {
          type: type,
          value: getValue(end, placeHolderContent),
          module: module,
          location: "end"
        };
      }

      if (match(dash, placeHolderContent)) {
        var _getValues = getValues(dash, placeHolderContent),
            _getValues2 = _slicedToArray(_getValues, 3),
            expandTo = _getValues2[1],
            value = _getValues2[2];

        return {
          type: type,
          value: value,
          expandTo: expandTo,
          module: module,
          location: "start",
          inverted: false
        };
      }

      return null;
    }
  }, {
    key: "getTraits",
    value: function getTraits(traitName, parsed) {
      if (traitName !== "expandPair") {
        return;
      }

      return parsed.reduce(function (tags, part, offset) {
        if (part.type === "placeholder" && part.module === moduleName && part.subparsed == null) {
          tags.push({
            part: part,
            offset: offset
          });
        }

        return tags;
      }, []);
    }
  }, {
    key: "postparse",
    value: function postparse(parsed, _ref2) {
      var basePart = _ref2.basePart;

      if (basePart) {
        basePart.sectPrCount = getSectPrHeaderFooterChangeCount(parsed);
      }

      if (!basePart || basePart.expandTo !== "auto" || basePart.module !== moduleName || !isEnclosedByParagraphs(parsed)) {
        return parsed;
      }

      var level = 0;
      var chunks = chunkBy(parsed, function (p) {
        if (isParagraphStart(p)) {
          level++;

          if (level === 1) {
            return "start";
          }
        }

        if (isParagraphEnd(p)) {
          level--;

          if (level === 0) {
            return "end";
          }
        }

        return null;
      });

      if (chunks.length <= 2) {
        return parsed;
      }

      var firstChunk = chunks[0];
      var lastChunk = last(chunks);
      var firstOffset = getOffset(firstChunk);
      var lastOffset = getOffset(lastChunk);
      basePart.hasPageBreak = hasPageBreak(lastChunk);
      basePart.hasPageBreakBeginning = hasPageBreak(firstChunk);

      if (firstOffset === 0 || lastOffset === 0) {
        return parsed;
      }

      return parsed.slice(firstOffset, parsed.length - lastOffset);
    }
  }, {
    key: "render",
    value: function render(part, options) {
      if (part.type !== "placeholder" || part.module !== moduleName) {
        return null;
      }

      var totalValue = [];
      var errors = [];

      function loopOver(scope, i, length) {
        var scopeManager = options.scopeManager.createSubScopeManager(scope, part.value, i, part, length);
        var subRendered = options.render(mergeObjects({}, options, {
          compiled: part.subparsed,
          tags: {},
          scopeManager: scopeManager
        }));

        if (part.hasPageBreak && i === length - 1 && isInsideParagraphLoop(part)) {
          addPageBreakAtEnd(subRendered);
        }

        if (part.sectPrCount === 1) {
          if (i !== 0 || scopeManager.scopePathItem.some(function (i) {
            return i !== 0;
          })) {
            subRendered.parts = dropHeaderFooterRefs(subRendered.parts);
          }
        }

        if (part.hasPageBreakBeginning && isInsideParagraphLoop(part)) {
          addPageBreakAtBeginning(subRendered);
        }

        totalValue = totalValue.concat(subRendered.parts);
        errors = errors.concat(subRendered.errors || []);
      }

      var result;

      try {
        result = options.scopeManager.loopOver(part.value, loopOver, part.inverted, {
          part: part
        });
      } catch (e) {
        errors.push(e);
        return {
          errors: errors
        };
      } // if the loop is showing empty content


      if (result === false) {
        return {
          value: getPageBreakIfApplies(part) || "",
          errors: errors
        };
      }

      var contains = options.fileTypeConfig.tagShouldContain || [];
      return {
        value: options.joinUncorrupt(totalValue, contains),
        errors: errors
      };
    }
  }, {
    key: "resolve",
    value: function resolve(part, options) {
      if (part.type !== "placeholder" || part.module !== moduleName) {
        return null;
      }

      var sm = options.scopeManager;
      var promisedValue = Promise.resolve().then(function () {
        return sm.getValue(part.value, {
          part: part
        });
      });
      var promises = [];

      function loopOver(scope, i, length) {
        var scopeManager = sm.createSubScopeManager(scope, part.value, i, part, length);
        promises.push(options.resolve({
          filePath: options.filePath,
          modules: options.modules,
          baseNullGetter: options.baseNullGetter,
          resolve: options.resolve,
          compiled: part.subparsed,
          tags: {},
          scopeManager: scopeManager
        }));
      }

      var errorList = [];
      return promisedValue.then(function (value) {
        sm.loopOverValue(value, loopOver, part.inverted);
        return Promise.all(promises).then(function (r) {
          return r.map(function (_ref3) {
            var resolved = _ref3.resolved,
                errors = _ref3.errors;

            if (errors.length > 0) {
              errorList.push.apply(errorList, _toConsumableArray(errors));
            }

            return resolved;
          });
        }).then(function (value) {
          if (errorList.length > 0) {
            throw errorList;
          }

          return value;
        });
      });
    }
  }]);

  return LoopModule;
}();

module.exports = function () {
  return wrapper(new LoopModule());
};