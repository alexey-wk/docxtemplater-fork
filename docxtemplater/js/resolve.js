"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function moduleResolve(part, options) {
  var moduleResolved;

  for (var i = 0, l = options.modules.length; i < l; i++) {
    var _module = options.modules[i];
    moduleResolved = _module.resolve(part, options);

    if (moduleResolved) {
      return moduleResolved;
    }
  }

  return false;
}

function resolve(options) {
  var resolved = [];
  var baseNullGetter = options.baseNullGetter;
  var compiled = options.compiled,
      scopeManager = options.scopeManager;

  options.nullGetter = function (part, sm) {
    return baseNullGetter(part, sm || scopeManager);
  };

  options.resolved = resolved;
  var errors = [];
  return Promise.all(compiled.map(function (part) {
    return Promise.resolve().then(function () {
      var moduleResolved = moduleResolve(part, options);

      if (moduleResolved) {
        return moduleResolved.then(function (value) {
          resolved.push({
            tag: part.value,
            value: value,
            lIndex: part.lIndex
          });
        });
      }

      if (part.type === "placeholder") {
        return scopeManager.getValueAsync(part.value, {
          part: part
        }).then(function (value) {
          if (value == null) {
            value = options.nullGetter(part);
          }

          resolved.push({
            tag: part.value,
            value: value,
            lIndex: part.lIndex
          });
          return value;
        });
      }

      return;
    })["catch"](function (e) {
      if (e.length > 1) {
        errors.push.apply(errors, _toConsumableArray(e));
      } else {
        errors.push(e);
      }
    });
  }).filter(function (a) {
    return a;
  })).then(function () {
    return {
      errors: errors,
      resolved: resolved
    };
  });
}

module.exports = resolve;