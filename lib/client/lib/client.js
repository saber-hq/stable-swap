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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StableSwap = void 0;
var web3_js_1 = require("@solana/web3.js");
var instructions = __importStar(require("./instructions"));
var layout = __importStar(require("./layout"));
var account_1 = require("./util/account");
var send_and_confirm_transaction_1 = require("./util/send-and-confirm-transaction");
var u64_1 = require("./util/u64");
/**
 * A program to exchange tokens against a pool of liquidity
 */
var StableSwap = /** @class */ (function () {
    /**
     * Create a new StableSwap client object
     * @param connection
     * @param stableSwap
     * @param swapProgramId
     * @param tokenProgramId
     * @param poolToken
     * @param authority
     * @param tokenAccountA
     * @param tokenAccountB
     * @param mintA
     * @param mintB
     * @param ampFactor
     * @param feeNumerator
     * @param feeDenominator
     * @param payer
     */
    function StableSwap(connection, stableSwap, swapProgramId, tokenProgramId, poolToken, authority, tokenAccountA, tokenAccountB, mintA, mintB, ampFactor, feeNumerator, feeDenominator, payer) {
        this.connection = connection;
        this.stableSwap = stableSwap;
        this.swapProgramId = swapProgramId;
        this.tokenProgramId = tokenProgramId;
        this.poolToken = poolToken;
        this.authority = authority;
        this.tokenAccountA = tokenAccountA;
        this.tokenAccountB = tokenAccountB;
        this.mintA = mintA;
        this.mintB = mintB;
        this.ampFactor = ampFactor;
        this.feeNumerator = feeNumerator;
        this.feeDenominator = feeDenominator;
        this.payer = payer;
    }
    /**
     * Get the minimum balance for the token swap account to be rent exempt
     *
     * @return Number of lamports required
     */
    StableSwap.getMinBalanceRentForExemptStableSwap = function (connection) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(layout.StableSwapLayout.span)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Load an onchain StableSwap program
     * @param connection The connection to use
     * @param address
     * @param programId Address of the onchain StableSwap program
     * @param payer Pays for the transaction
     */
    StableSwap.loadStableSwap = function (connection, address, programId, payer) {
        return __awaiter(this, void 0, void 0, function () {
            var data, stableSwapData, _a, authority, poolToken, tokenAccountA, tokenAccountB, mintA, mintB, tokenProgramId, ampFactor, feeNumerator, feeDenominator;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, account_1.loadAccount(connection, address, programId)];
                    case 1:
                        data = _b.sent();
                        stableSwapData = layout.StableSwapLayout.decode(data);
                        if (!stableSwapData.isInitialized) {
                            throw new Error("Invalid token swap state");
                        }
                        return [4 /*yield*/, web3_js_1.PublicKey.findProgramAddress([address.toBuffer()], programId)];
                    case 2:
                        _a = __read.apply(void 0, [_b.sent(), 1]), authority = _a[0];
                        poolToken = new web3_js_1.PublicKey(stableSwapData.tokenPool);
                        tokenAccountA = new web3_js_1.PublicKey(stableSwapData.tokenAccountA);
                        tokenAccountB = new web3_js_1.PublicKey(stableSwapData.tokenAccountB);
                        mintA = new web3_js_1.PublicKey(stableSwapData.mintA);
                        mintB = new web3_js_1.PublicKey(stableSwapData.mintB);
                        tokenProgramId = new web3_js_1.PublicKey(stableSwapData.tokenProgramId);
                        ampFactor = u64_1.Numberu64.fromBuffer(stableSwapData.ampFactor);
                        feeNumerator = u64_1.Numberu64.fromBuffer(stableSwapData.feeNumerator);
                        feeDenominator = u64_1.Numberu64.fromBuffer(stableSwapData.feeDenominator);
                        return [2 /*return*/, new StableSwap(connection, address, programId, tokenProgramId, poolToken, authority, tokenAccountA, tokenAccountB, mintA, mintB, ampFactor, feeNumerator, feeDenominator, payer)];
                }
            });
        });
    };
    /**
     * Create a new StableSwap instance
     * @param connection
     * @param payer
     * @param stableSwapAccount
     * @param authority
     * @param tokenAccountA
     * @param tokenAccountB
     * @param poolToken
     * @param mintA
     * @param mintB
     * @param tokenAccountPool
     * @param swapProgramId
     * @param tokenProgramId
     * @param nonce
     * @param ampFactor
     * @param feeNumerator
     * @param feeDenominator
     */
    StableSwap.createStableSwap = function (connection, payer, stableSwapAccount, authority, tokenAccountA, tokenAccountB, poolToken, mintA, mintB, tokenAccountPool, swapProgramId, tokenProgramId, nonce, ampFactor, feeNumerator, feeDenominator) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, stableSwap, balanceNeeded, instruction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stableSwap = new StableSwap(connection, stableSwapAccount.publicKey, swapProgramId, tokenProgramId, poolToken, authority, tokenAccountA, tokenAccountB, mintA, mintB, new u64_1.Numberu64(ampFactor), new u64_1.Numberu64(feeNumerator), new u64_1.Numberu64(feeDenominator), payer);
                        return [4 /*yield*/, StableSwap.getMinBalanceRentForExemptStableSwap(connection)];
                    case 1:
                        balanceNeeded = _a.sent();
                        transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.createAccount({
                            fromPubkey: payer.publicKey,
                            newAccountPubkey: stableSwapAccount.publicKey,
                            lamports: balanceNeeded,
                            space: layout.StableSwapLayout.span,
                            programId: swapProgramId,
                        }));
                        instruction = instructions.createInitSwapInstruction(stableSwapAccount, authority, tokenAccountA, tokenAccountB, poolToken, tokenAccountPool, swapProgramId, nonce, ampFactor, feeNumerator, feeDenominator);
                        transaction.add(instruction);
                        return [4 /*yield*/, send_and_confirm_transaction_1.sendAndConfirmTransaction("createAccount and InitializeSwap", connection, transaction, payer, stableSwapAccount)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, stableSwap];
                }
            });
        });
    };
    /**
     * Swap token A for token B
     * @param userSource
     * @param poolSource
     * @param poolDestination
     * @param userDestination
     * @param amountIn
     * @param minimumAmountOut
     */
    StableSwap.prototype.swap = function (userSource, poolSource, poolDestination, userDestination, amountIn, minimumAmountOut) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, send_and_confirm_transaction_1.sendAndConfirmTransaction("swap", this.connection, new web3_js_1.Transaction().add(instructions.swapInstruction(this.stableSwap, this.authority, userSource, poolSource, poolDestination, userDestination, this.swapProgramId, this.tokenProgramId, amountIn, minimumAmountOut)), this.payer)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Deposit tokens into the pool
     * @param userAccountA
     * @param userAccountB
     * @param poolAccount
     * @param tokenAmountA
     * @param tokenAmountB
     * @param minimumPoolTokenAmount
     */
    StableSwap.prototype.deposit = function (userAccountA, userAccountB, poolAccount, tokenAmountA, tokenAmountB, minimumPoolTokenAmount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, send_and_confirm_transaction_1.sendAndConfirmTransaction("deposit", this.connection, new web3_js_1.Transaction().add(instructions.depositInstruction(this.stableSwap, this.authority, userAccountA, userAccountB, this.tokenAccountA, this.tokenAccountB, this.poolToken, poolAccount, this.swapProgramId, this.tokenProgramId, tokenAmountA, tokenAmountB, minimumPoolTokenAmount)), this.payer)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Withdraw tokens from the pool
     * @param userAccountA
     * @param userAccountB
     * @param poolAccount
     * @param poolTokenAmount
     * @param minimumTokenA
     * @param minimumTokenB
     */
    StableSwap.prototype.withdraw = function (userAccountA, userAccountB, poolAccount, poolTokenAmount, minimumTokenA, minimumTokenB) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, send_and_confirm_transaction_1.sendAndConfirmTransaction("withdraw", this.connection, new web3_js_1.Transaction().add(instructions.withdrawInstruction(this.stableSwap, this.authority, this.poolToken, poolAccount, this.tokenAccountA, this.tokenAccountB, userAccountA, userAccountB, this.swapProgramId, this.tokenProgramId, poolTokenAmount, minimumTokenA, minimumTokenB)), this.payer)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return StableSwap;
}());
exports.StableSwap = StableSwap;
