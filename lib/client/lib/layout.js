"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StableSwapLayout = exports.PublicKeyLayout = void 0;
var BufferLayout = __importStar(require("buffer-layout"));
/**
 * Layout for a public key
 */
exports.PublicKeyLayout = function (property) {
    if (property === void 0) { property = "publicKey"; }
    return BufferLayout.blob(32, property);
};
/**
 * Layout for stable swap state
 */
exports.StableSwapLayout = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("nonce"),
    exports.PublicKeyLayout("tokenProgramId"),
    exports.PublicKeyLayout("tokenAccountA"),
    exports.PublicKeyLayout("tokenAccountB"),
    exports.PublicKeyLayout("tokenPool"),
    exports.PublicKeyLayout("mintA"),
    exports.PublicKeyLayout("mintB"),
    BufferLayout.nu64("ampFactor"),
    BufferLayout.nu64("feeNumerator"),
    BufferLayout.nu64("feeDenominator"),
]);
