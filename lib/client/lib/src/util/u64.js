"use strict";
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError(
          "Class extends value " + String(b) + " is not a constructor or null"
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __read =
  (this && this.__read) ||
  function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
      r,
      ar = [],
      e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error: error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"])) m.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    return ar;
  };
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberU64 = void 0;
var assert_1 = __importDefault(require("assert"));
var bn_js_1 = __importDefault(require("bn.js"));
/**
 * Some amount of tokens
 */
var NumberU64 = /** @class */ (function (_super) {
  __extends(NumberU64, _super);
  function NumberU64(n) {
    return _super.call(this, n) || this;
  }
  /**
   * Convert to Buffer representation
   */
  NumberU64.prototype.toBuffer = function () {
    var a = _super.prototype.toArray.call(this).reverse();
    var b = Buffer.from(a);
    if (b.length === 8) {
      return b;
    }
    assert_1.default(b.length < 8, "Numberu64 too large");
    var zeroPad = Buffer.alloc(8);
    b.copy(zeroPad);
    return zeroPad;
  };
  /**
   * Construct a Numberu64 from Buffer representation
   */
  NumberU64.fromBuffer = function (buffer) {
    assert_1.default(
      buffer.length === 8,
      "Invalid buffer length: " + buffer.length
    );
    return new bn_js_1.default(
      __spreadArray([], __read(buffer))
        .reverse()
        .map(function (i) {
          return ("00" + i.toString(16)).slice(-2);
        })
        .join(""),
      16
    );
  };
  return NumberU64;
})(bn_js_1.default);
exports.NumberU64 = NumberU64;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidTY0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWwvdTY0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUE0QjtBQUM1QixnREFBdUI7QUFFdkI7O0dBRUc7QUFDSDtJQUErQiw2QkFBRTtJQUMvQixtQkFBWSxDQUFxQjtlQUMvQixrQkFBTSxDQUFDLENBQUM7SUFDVixDQUFDO0lBRUQ7O09BRUc7SUFDSCw0QkFBUSxHQUFSO1FBQ0UsSUFBTSxDQUFDLEdBQUcsaUJBQU0sT0FBTyxXQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEMsSUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2xCLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7UUFDRCxnQkFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFFNUMsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hCLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7T0FFRztJQUNJLG9CQUFVLEdBQWpCLFVBQWtCLE1BQWM7UUFDOUIsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSw0QkFBMEIsTUFBTSxDQUFDLE1BQVEsQ0FBQyxDQUFDO1FBQ3ZFLE9BQU8sSUFBSSxlQUFFLENBQ1gseUJBQUksTUFBTSxHQUNQLE9BQU8sRUFBRTthQUNULEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUEsT0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBRyxDQUFBLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQS9CLENBQStCLENBQUM7YUFDM0MsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUNYLEVBQUUsQ0FDSCxDQUFDO0lBQ0osQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQWxDRCxDQUErQixlQUFFLEdBa0NoQztBQWxDWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiO1xuXG4vKipcbiAqIFNvbWUgYW1vdW50IG9mIHRva2Vuc1xuICovXG5leHBvcnQgY2xhc3MgTnVtYmVyVTY0IGV4dGVuZHMgQk4ge1xuICBjb25zdHJ1Y3RvcihuOiBudW1iZXIgfCBOdW1iZXJVNjQpIHtcbiAgICBzdXBlcihuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRvIEJ1ZmZlciByZXByZXNlbnRhdGlvblxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBhID0gc3VwZXIudG9BcnJheSgpLnJldmVyc2UoKTtcbiAgICBjb25zdCBiID0gQnVmZmVyLmZyb20oYSk7XG4gICAgaWYgKGIubGVuZ3RoID09PSA4KSB7XG4gICAgICByZXR1cm4gYjtcbiAgICB9XG4gICAgYXNzZXJ0KGIubGVuZ3RoIDwgOCwgXCJOdW1iZXJ1NjQgdG9vIGxhcmdlXCIpO1xuXG4gICAgY29uc3QgemVyb1BhZCA9IEJ1ZmZlci5hbGxvYyg4KTtcbiAgICBiLmNvcHkoemVyb1BhZCk7XG4gICAgcmV0dXJuIHplcm9QYWQ7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgTnVtYmVydTY0IGZyb20gQnVmZmVyIHJlcHJlc2VudGF0aW9uXG4gICAqL1xuICBzdGF0aWMgZnJvbUJ1ZmZlcihidWZmZXI6IEJ1ZmZlcik6IE51bWJlclU2NCB7XG4gICAgYXNzZXJ0KGJ1ZmZlci5sZW5ndGggPT09IDgsIGBJbnZhbGlkIGJ1ZmZlciBsZW5ndGg6ICR7YnVmZmVyLmxlbmd0aH1gKTtcbiAgICByZXR1cm4gbmV3IEJOKFxuICAgICAgWy4uLmJ1ZmZlcl1cbiAgICAgICAgLnJldmVyc2UoKVxuICAgICAgICAubWFwKChpKSA9PiBgMDAke2kudG9TdHJpbmcoMTYpfWAuc2xpY2UoLTIpKVxuICAgICAgICAuam9pbihcIlwiKSxcbiAgICAgIDE2XG4gICAgKTtcbiAgfVxufVxuIl19
