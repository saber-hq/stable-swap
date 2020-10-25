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
exports.withdrawInstruction = exports.depositInstruction = exports.swapInstruction = exports.createInitSwapInstruction = void 0;
var BufferLayout = __importStar(require("buffer-layout"));
var web3_js_1 = require("@solana/web3.js");
var u64_1 = require("./util/u64");
exports.createInitSwapInstruction = function (tokenSwapAccount, authority, tokenAccountA, tokenAccountB, tokenPool, tokenAccountPool, swapProgramId, nonce, ampFactor, feeNumerator, feeDenominator) {
    var keys = [
        { pubkey: tokenSwapAccount.publicKey, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: tokenAccountA, isSigner: false, isWritable: false },
        { pubkey: tokenAccountB, isSigner: false, isWritable: false },
        { pubkey: tokenPool, isSigner: false, isWritable: true },
        { pubkey: tokenAccountPool, isSigner: false, isWritable: true },
    ];
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        BufferLayout.nu64("ampFactor"),
        BufferLayout.nu64("feeNumerator"),
        BufferLayout.nu64("feeDenominator"),
        BufferLayout.u8("nonce"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    {
        var encodeLength = dataLayout.encode({
            instruction: 0,
            nonce: nonce,
            ampFactor: ampFactor,
            feeNumerator: feeNumerator,
            feeDenominator: feeDenominator,
        }, data);
        data = data.slice(0, encodeLength);
    }
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
exports.swapInstruction = function (tokenSwap, authority, userSource, poolSource, poolDestination, userDestination, swapProgramId, tokenProgramId, amountIn, minimumAmountOut) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        BufferLayout.nu64("amountIn"),
        BufferLayout.nu64("minimumAmountOut"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 1,
        amountIn: new u64_1.Numberu64(amountIn).toBuffer(),
        minimumAmountOut: new u64_1.Numberu64(minimumAmountOut).toBuffer(),
    }, data);
    var keys = [
        { pubkey: tokenSwap, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: userSource, isSigner: false, isWritable: true },
        { pubkey: poolSource, isSigner: false, isWritable: true },
        { pubkey: poolDestination, isSigner: false, isWritable: true },
        { pubkey: userDestination, isSigner: false, isWritable: true },
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
exports.depositInstruction = function (tokenSwap, authority, sourceA, sourceB, intoA, intoB, poolToken, poolAccount, swapProgramId, tokenProgramId, tokenAmountA, tokenAmountB, minimumPoolTokenAmount) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        BufferLayout.nu64("poolTokenAmount"),
        BufferLayout.nu64("maximumTokenA"),
        BufferLayout.nu64("maximumTokenB"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 2,
        tokenAmountA: new u64_1.Numberu64(tokenAmountA).toBuffer(),
        tokenAmountB: new u64_1.Numberu64(tokenAmountB).toBuffer(),
        minimumPoolTokenAmount: new u64_1.Numberu64(minimumPoolTokenAmount).toBuffer(),
    }, data);
    var keys = [
        { pubkey: tokenSwap, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: sourceA, isSigner: false, isWritable: true },
        { pubkey: sourceB, isSigner: false, isWritable: true },
        { pubkey: intoA, isSigner: false, isWritable: true },
        { pubkey: intoB, isSigner: false, isWritable: true },
        { pubkey: poolToken, isSigner: false, isWritable: true },
        { pubkey: poolAccount, isSigner: false, isWritable: true },
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
exports.withdrawInstruction = function (tokenSwap, authority, poolMint, sourcePoolAccount, fromA, fromB, userAccountA, userAccountB, swapProgramId, tokenProgramId, poolTokenAmount, minimumTokenA, minimumTokenB) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        BufferLayout.nu64("poolTokenAmount"),
        BufferLayout.nu64("minimumTokenA"),
        BufferLayout.nu64("minimumTokenB"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 3,
        poolTokenAmount: new u64_1.Numberu64(poolTokenAmount).toBuffer(),
        minimumTokenA: new u64_1.Numberu64(minimumTokenA).toBuffer(),
        minimumTokenB: new u64_1.Numberu64(minimumTokenB).toBuffer(),
    }, data);
    var keys = [
        { pubkey: tokenSwap, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: poolMint, isSigner: false, isWritable: true },
        { pubkey: sourcePoolAccount, isSigner: false, isWritable: true },
        { pubkey: fromA, isSigner: false, isWritable: true },
        { pubkey: fromB, isSigner: false, isWritable: true },
        { pubkey: userAccountA, isSigner: false, isWritable: true },
        { pubkey: userAccountB, isSigner: false, isWritable: true },
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
