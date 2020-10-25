"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Numberu64 = void 0;
var assert_1 = __importDefault(require("assert"));
var bn_js_1 = __importDefault(require("bn.js"));
/**
 * Some amount of tokens
 */
var Numberu64 = /** @class */ (function (_super) {
    __extends(Numberu64, _super);
    function Numberu64(n) {
        return _super.call(this, n) || this;
    }
    /**
     * Convert to Buffer representation
     */
    Numberu64.prototype.toBuffer = function () {
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
    Numberu64.fromBuffer = function (buffer) {
        assert_1.default(buffer.length === 8, "Invalid buffer length: " + buffer.length);
        return new bn_js_1.default(__spread(buffer).reverse()
            .map(function (i) { return ("00" + i.toString(16)).slice(-2); })
            .join(""), 16);
    };
    return Numberu64;
}(bn_js_1.default));
exports.Numberu64 = Numberu64;
