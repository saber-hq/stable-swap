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
var __spread =
  (this && this.__spread) ||
  function () {
    for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
    return ar;
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
      __spread(buffer)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidTY0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvdTY0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUE0QjtBQUM1QixnREFBdUI7QUFFdkI7O0dBRUc7QUFDSDtJQUErQiw2QkFBRTtJQUMvQixtQkFBWSxDQUFxQjtlQUMvQixrQkFBTSxDQUFDLENBQUM7SUFDVixDQUFDO0lBRUQ7O09BRUc7SUFDSCw0QkFBUSxHQUFSO1FBQ0UsSUFBTSxDQUFDLEdBQUcsaUJBQU0sT0FBTyxXQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEMsSUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2xCLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7UUFDRCxnQkFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFFNUMsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hCLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7T0FFRztJQUNJLG9CQUFVLEdBQWpCLFVBQWtCLE1BQWM7UUFDOUIsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSw0QkFBMEIsTUFBTSxDQUFDLE1BQVEsQ0FBQyxDQUFDO1FBQ3ZFLE9BQU8sSUFBSSxlQUFFLENBQ1gsU0FBSSxNQUFNLEVBQ1AsT0FBTyxFQUFFO2FBQ1QsR0FBRyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQSxPQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFHLENBQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBL0IsQ0FBK0IsQ0FBQzthQUMzQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQ1gsRUFBRSxDQUNILENBQUM7SUFDSixDQUFDO0lBQ0gsZ0JBQUM7QUFBRCxDQUFDLEFBbENELENBQStCLGVBQUUsR0FrQ2hDO0FBbENZLDhCQUFTIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCI7XG5cbi8qKlxuICogU29tZSBhbW91bnQgb2YgdG9rZW5zXG4gKi9cbmV4cG9ydCBjbGFzcyBOdW1iZXJVNjQgZXh0ZW5kcyBCTiB7XG4gIGNvbnN0cnVjdG9yKG46IG51bWJlciB8IE51bWJlclU2NCkge1xuICAgIHN1cGVyKG4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgdG8gQnVmZmVyIHJlcHJlc2VudGF0aW9uXG4gICAqL1xuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IGEgPSBzdXBlci50b0FycmF5KCkucmV2ZXJzZSgpO1xuICAgIGNvbnN0IGIgPSBCdWZmZXIuZnJvbShhKTtcbiAgICBpZiAoYi5sZW5ndGggPT09IDgpIHtcbiAgICAgIHJldHVybiBiO1xuICAgIH1cbiAgICBhc3NlcnQoYi5sZW5ndGggPCA4LCBcIk51bWJlcnU2NCB0b28gbGFyZ2VcIik7XG5cbiAgICBjb25zdCB6ZXJvUGFkID0gQnVmZmVyLmFsbG9jKDgpO1xuICAgIGIuY29weSh6ZXJvUGFkKTtcbiAgICByZXR1cm4gemVyb1BhZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBOdW1iZXJ1NjQgZnJvbSBCdWZmZXIgcmVwcmVzZW50YXRpb25cbiAgICovXG4gIHN0YXRpYyBmcm9tQnVmZmVyKGJ1ZmZlcjogQnVmZmVyKTogTnVtYmVyVTY0IHtcbiAgICBhc3NlcnQoYnVmZmVyLmxlbmd0aCA9PT0gOCwgYEludmFsaWQgYnVmZmVyIGxlbmd0aDogJHtidWZmZXIubGVuZ3RofWApO1xuICAgIHJldHVybiBuZXcgQk4oXG4gICAgICBbLi4uYnVmZmVyXVxuICAgICAgICAucmV2ZXJzZSgpXG4gICAgICAgIC5tYXAoKGkpID0+IGAwMCR7aS50b1N0cmluZygxNil9YC5zbGljZSgtMikpXG4gICAgICAgIC5qb2luKFwiXCIpLFxuICAgICAgMTZcbiAgICApO1xuICB9XG59XG4iXX0=
