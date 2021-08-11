"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
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
Object.defineProperty(exports, "__esModule", { value: true });
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var src_1 = require("../src");
var constants_1 = require("../src/constants");
var fees_1 = require("../src/fees");
var send_and_confirm_transaction_1 = require("../src/util/send-and-confirm-transaction");
var helpers_1 = require("./helpers");
// Cluster configs
var CLUSTER_URL = "http://localhost:8899";
var BOOTSTRAP_TIMEOUT = 300000;
// Pool configs
var AMP_FACTOR = 100;
var FEES = {
  adminTradeFeeNumerator: fees_1.DEFAULT_FEE_NUMERATOR,
  adminTradeFeeDenominator: fees_1.DEFAULT_FEE_DENOMINATOR,
  adminWithdrawFeeNumerator: fees_1.DEFAULT_FEE_NUMERATOR,
  adminWithdrawFeeDenominator: fees_1.DEFAULT_FEE_DENOMINATOR,
  tradeFeeNumerator: 1,
  tradeFeeDenominator: 4,
  withdrawFeeNumerator: fees_1.DEFAULT_FEE_NUMERATOR,
  withdrawFeeDenominator: fees_1.DEFAULT_FEE_DENOMINATOR,
};
// Initial amount in each swap token
var INITIAL_TOKEN_A_AMOUNT = web3_js_1.LAMPORTS_PER_SOL;
var INITIAL_TOKEN_B_AMOUNT = web3_js_1.LAMPORTS_PER_SOL;
describe("e2e test", function () {
  // Cluster connection
  var connection;
  // Fee payer
  var payer;
  // authority of the token and accounts
  var authority;
  // nonce used to generate the authority public key
  var nonce;
  // owner of the user accounts
  var owner;
  // Token pool
  var tokenPool;
  var userPoolAccount;
  // Tokens swapped
  var mintA;
  var mintB;
  var tokenAccountA;
  var tokenAccountB;
  // Admin fee accounts
  var adminFeeAccountA;
  var adminFeeAccountB;
  // Stable swap
  var stableSwap;
  var stableSwapAccount;
  var stableSwapProgramId;
  beforeAll(function (done) {
    return __awaiter(void 0, void 0, void 0, function () {
      var e_1, e_2, e_3, e_4, e_5, e_6, e_7, e_8;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            // Bootstrap Test Environment ...
            connection = new web3_js_1.Connection(CLUSTER_URL, "single");
            return [
              4 /*yield*/,
              helpers_1.newAccountWithLamports(
                connection,
                web3_js_1.LAMPORTS_PER_SOL
              ),
            ];
          case 1:
            payer = _b.sent();
            return [
              4 /*yield*/,
              helpers_1.newAccountWithLamports(
                connection,
                web3_js_1.LAMPORTS_PER_SOL
              ),
            ];
          case 2:
            owner = _b.sent();
            stableSwapProgramId = helpers_1.getDeploymentInfo()
              .stableSwapProgramId;
            stableSwapAccount = new web3_js_1.Account();
            _b.label = 3;
          case 3:
            _b.trys.push([3, 5, , 6]);
            return [
              4 /*yield*/,
              web3_js_1.PublicKey.findProgramAddress(
                [stableSwapAccount.publicKey.toBuffer()],
                stableSwapProgramId
              ),
            ];
          case 4:
            (_a = __read.apply(void 0, [_b.sent(), 2])),
              (authority = _a[0]),
              (nonce = _a[1]);
            return [3 /*break*/, 6];
          case 5:
            e_1 = _b.sent();
            throw new Error(e_1);
          case 6:
            _b.trys.push([6, 8, , 9]);
            return [
              4 /*yield*/,
              spl_token_1.Token.createMint(
                connection,
                payer,
                authority,
                null,
                constants_1.DEFAULT_TOKEN_DECIMALS,
                constants_1.TOKEN_PROGRAM_ID
              ),
            ];
          case 7:
            tokenPool = _b.sent();
            return [3 /*break*/, 9];
          case 8:
            e_2 = _b.sent();
            throw new Error(e_2);
          case 9:
            _b.trys.push([9, 11, , 12]);
            return [4 /*yield*/, tokenPool.createAccount(owner.publicKey)];
          case 10:
            userPoolAccount = _b.sent();
            return [3 /*break*/, 12];
          case 11:
            e_3 = _b.sent();
            throw new Error(e_3);
          case 12:
            _b.trys.push([12, 14, , 15]);
            return [
              4 /*yield*/,
              spl_token_1.Token.createMint(
                connection,
                payer,
                owner.publicKey,
                null,
                constants_1.DEFAULT_TOKEN_DECIMALS,
                constants_1.TOKEN_PROGRAM_ID
              ),
            ];
          case 13:
            mintA = _b.sent();
            return [3 /*break*/, 15];
          case 14:
            e_4 = _b.sent();
            throw new Error(e_4);
          case 15:
            _b.trys.push([15, 19, , 20]);
            return [4 /*yield*/, mintA.createAccount(owner.publicKey)];
          case 16:
            adminFeeAccountA = _b.sent();
            return [4 /*yield*/, mintA.createAccount(authority)];
          case 17:
            tokenAccountA = _b.sent();
            return [
              4 /*yield*/,
              mintA.mintTo(tokenAccountA, owner, [], INITIAL_TOKEN_A_AMOUNT),
            ];
          case 18:
            _b.sent();
            return [3 /*break*/, 20];
          case 19:
            e_5 = _b.sent();
            throw new Error(e_5);
          case 20:
            _b.trys.push([20, 22, , 23]);
            return [
              4 /*yield*/,
              spl_token_1.Token.createMint(
                connection,
                payer,
                owner.publicKey,
                null,
                constants_1.DEFAULT_TOKEN_DECIMALS,
                constants_1.TOKEN_PROGRAM_ID
              ),
            ];
          case 21:
            mintB = _b.sent();
            return [3 /*break*/, 23];
          case 22:
            e_6 = _b.sent();
            throw new Error(e_6);
          case 23:
            _b.trys.push([23, 27, , 28]);
            return [4 /*yield*/, mintB.createAccount(owner.publicKey)];
          case 24:
            adminFeeAccountB = _b.sent();
            return [4 /*yield*/, mintB.createAccount(authority)];
          case 25:
            tokenAccountB = _b.sent();
            return [
              4 /*yield*/,
              mintB.mintTo(tokenAccountB, owner, [], INITIAL_TOKEN_B_AMOUNT),
            ];
          case 26:
            _b.sent();
            return [3 /*break*/, 28];
          case 27:
            e_7 = _b.sent();
            throw new Error(e_7);
          case 28:
            // Sleep to make sure token accounts are created ...
            return [4 /*yield*/, helpers_1.sleep(500)];
          case 29:
            // Sleep to make sure token accounts are created ...
            _b.sent();
            _b.label = 30;
          case 30:
            _b.trys.push([30, 32, , 33]);
            return [
              4 /*yield*/,
              src_1.StableSwap.createStableSwap(
                connection,
                payer,
                stableSwapAccount,
                authority,
                owner.publicKey,
                adminFeeAccountA,
                adminFeeAccountB,
                mintA.publicKey,
                tokenAccountA,
                mintB.publicKey,
                tokenAccountB,
                tokenPool.publicKey,
                userPoolAccount,
                mintA.publicKey,
                mintB.publicKey,
                stableSwapProgramId,
                constants_1.TOKEN_PROGRAM_ID,
                nonce,
                AMP_FACTOR,
                FEES
              ),
            ];
          case 31:
            stableSwap = _b.sent();
            return [3 /*break*/, 33];
          case 32:
            e_8 = _b.sent();
            throw new Error(e_8);
          case 33:
            done();
            return [2 /*return*/];
        }
      });
    });
  }, BOOTSTRAP_TIMEOUT);
  it("bootstrapper's LP balance", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var info;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, tokenPool.getAccountInfo(userPoolAccount)];
          case 1:
            info = _a.sent();
            expect(info.amount.toNumber()).toEqual(
              INITIAL_TOKEN_A_AMOUNT + INITIAL_TOKEN_B_AMOUNT
            );
            return [2 /*return*/];
        }
      });
    });
  });
  it("loadStableSwap", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var fetchedStableSwap, e_9;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              src_1.StableSwap.loadStableSwap(
                connection,
                stableSwapAccount.publicKey,
                stableSwapProgramId
              ),
            ];
          case 1:
            fetchedStableSwap = _a.sent();
            return [3 /*break*/, 3];
          case 2:
            e_9 = _a.sent();
            throw new Error(e_9);
          case 3:
            expect(fetchedStableSwap.stableSwap).toEqual(
              stableSwapAccount.publicKey
            );
            expect(fetchedStableSwap.adminFeeAccountA).toEqual(
              adminFeeAccountA
            );
            expect(fetchedStableSwap.adminFeeAccountB).toEqual(
              adminFeeAccountB
            );
            expect(fetchedStableSwap.tokenAccountA).toEqual(tokenAccountA);
            expect(fetchedStableSwap.tokenAccountB).toEqual(tokenAccountB);
            expect(fetchedStableSwap.mintA).toEqual(mintA.publicKey);
            expect(fetchedStableSwap.mintB).toEqual(mintB.publicKey);
            expect(fetchedStableSwap.poolTokenMint).toEqual(
              tokenPool.publicKey
            );
            expect(fetchedStableSwap.initialAmpFactor).toEqual(AMP_FACTOR);
            expect(fetchedStableSwap.fees).toEqual(FEES);
            return [2 /*return*/];
        }
      });
    });
  });
  it("getVirtualPrice", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _a = expect;
            return [4 /*yield*/, stableSwap.getVirtualPrice()];
          case 1:
            _a.apply(void 0, [_b.sent()]).toBe(1);
            return [2 /*return*/];
        }
      });
    });
  });
  it("deposit", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var depositAmountA,
        depositAmountB,
        userAccountA,
        userAccountB,
        txn,
        e_10,
        info;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            depositAmountA = web3_js_1.LAMPORTS_PER_SOL;
            depositAmountB = web3_js_1.LAMPORTS_PER_SOL;
            return [4 /*yield*/, mintA.createAccount(owner.publicKey)];
          case 1:
            userAccountA = _a.sent();
            return [
              4 /*yield*/,
              mintA.mintTo(userAccountA, owner, [], depositAmountA),
            ];
          case 2:
            _a.sent();
            return [
              4 /*yield*/,
              mintA.approve(userAccountA, authority, owner, [], depositAmountA),
            ];
          case 3:
            _a.sent();
            return [4 /*yield*/, mintB.createAccount(owner.publicKey)];
          case 4:
            userAccountB = _a.sent();
            return [
              4 /*yield*/,
              mintB.mintTo(userAccountB, owner, [], depositAmountB),
            ];
          case 5:
            _a.sent();
            return [
              4 /*yield*/,
              mintB.approve(userAccountB, authority, owner, [], depositAmountB),
            ];
          case 6:
            _a.sent();
            // Make sure all token accounts are created and approved
            return [4 /*yield*/, helpers_1.sleep(500)];
          case 7:
            // Make sure all token accounts are created and approved
            _a.sent();
            _a.label = 8;
          case 8:
            _a.trys.push([8, 10, , 11]);
            txn = stableSwap.deposit(
              userAccountA,
              userAccountB,
              userPoolAccount,
              depositAmountA,
              depositAmountB,
              0 // To avoid slippage errors
            );
            return [
              4 /*yield*/,
              send_and_confirm_transaction_1.sendAndConfirmTransaction(
                "deposit",
                connection,
                txn,
                payer
              ),
            ];
          case 9:
            _a.sent();
            return [3 /*break*/, 11];
          case 10:
            e_10 = _a.sent();
            throw new Error(e_10);
          case 11:
            return [4 /*yield*/, mintA.getAccountInfo(userAccountA)];
          case 12:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(0);
            return [4 /*yield*/, mintB.getAccountInfo(userAccountB)];
          case 13:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(0);
            return [4 /*yield*/, mintA.getAccountInfo(tokenAccountA)];
          case 14:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(
              INITIAL_TOKEN_A_AMOUNT + depositAmountA
            );
            return [4 /*yield*/, mintB.getAccountInfo(tokenAccountB)];
          case 15:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(
              INITIAL_TOKEN_B_AMOUNT + depositAmountB
            );
            return [4 /*yield*/, tokenPool.getAccountInfo(userPoolAccount)];
          case 16:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(4000000000);
            return [2 /*return*/];
        }
      });
    });
  });
  it("withdraw", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var withdrawalAmount,
        poolMintInfo,
        oldSupply,
        oldSwapTokenA,
        oldSwapTokenB,
        oldPoolToken,
        expectedWithdrawA,
        expectedWithdrawB,
        userAccountA,
        userAccountB,
        txn,
        e_11,
        info,
        newSwapTokenA,
        newSwapTokenB;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            withdrawalAmount = 100000;
            return [4 /*yield*/, tokenPool.getMintInfo()];
          case 1:
            poolMintInfo = _a.sent();
            oldSupply = poolMintInfo.supply.toNumber();
            return [4 /*yield*/, mintA.getAccountInfo(tokenAccountA)];
          case 2:
            oldSwapTokenA = _a.sent();
            return [4 /*yield*/, mintB.getAccountInfo(tokenAccountB)];
          case 3:
            oldSwapTokenB = _a.sent();
            return [4 /*yield*/, tokenPool.getAccountInfo(userPoolAccount)];
          case 4:
            oldPoolToken = _a.sent();
            expectedWithdrawA = Math.floor(
              (oldSwapTokenA.amount.toNumber() * withdrawalAmount) / oldSupply
            );
            expectedWithdrawB = Math.floor(
              (oldSwapTokenB.amount.toNumber() * withdrawalAmount) / oldSupply
            );
            return [4 /*yield*/, mintA.createAccount(owner.publicKey)];
          case 5:
            userAccountA = _a.sent();
            return [4 /*yield*/, mintB.createAccount(owner.publicKey)];
          case 6:
            userAccountB = _a.sent();
            // Approving withdrawal from pool account
            return [
              4 /*yield*/,
              tokenPool.approve(
                userPoolAccount,
                authority,
                owner,
                [],
                withdrawalAmount
              ),
            ];
          case 7:
            // Approving withdrawal from pool account
            _a.sent();
            // Make sure all token accounts are created and approved
            return [4 /*yield*/, helpers_1.sleep(500)];
          case 8:
            // Make sure all token accounts are created and approved
            _a.sent();
            _a.label = 9;
          case 9:
            _a.trys.push([9, 12, , 13]);
            return [
              4 /*yield*/,
              stableSwap.withdraw(
                userAccountA,
                userAccountB,
                userPoolAccount,
                withdrawalAmount,
                0, // To avoid slippage errors
                0 // To avoid spliiage errors
              ),
            ];
          case 10:
            txn = _a.sent();
            return [
              4 /*yield*/,
              send_and_confirm_transaction_1.sendAndConfirmTransaction(
                "withdraw",
                connection,
                txn,
                payer
              ),
            ];
          case 11:
            _a.sent();
            return [3 /*break*/, 13];
          case 12:
            e_11 = _a.sent();
            throw new Error(e_11);
          case 13:
            return [4 /*yield*/, mintA.getAccountInfo(userAccountA)];
          case 14:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(expectedWithdrawA);
            return [4 /*yield*/, mintB.getAccountInfo(userAccountB)];
          case 15:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(expectedWithdrawB);
            return [4 /*yield*/, tokenPool.getAccountInfo(userPoolAccount)];
          case 16:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(
              oldPoolToken.amount.toNumber() - withdrawalAmount
            );
            return [4 /*yield*/, mintA.getAccountInfo(tokenAccountA)];
          case 17:
            newSwapTokenA = _a.sent();
            expect(newSwapTokenA.amount.toNumber()).toBe(
              oldSwapTokenA.amount.toNumber() - expectedWithdrawA
            );
            return [4 /*yield*/, mintB.getAccountInfo(tokenAccountB)];
          case 18:
            newSwapTokenB = _a.sent();
            expect(newSwapTokenB.amount.toNumber()).toBe(
              oldSwapTokenB.amount.toNumber() - expectedWithdrawB
            );
            return [2 /*return*/];
        }
      });
    });
  });
  it("swap A->B", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var oldSwapTokenA,
        oldSwapTokenB,
        SWAP_AMOUNT_IN,
        userAccountA,
        userAccountB,
        txn,
        e_12,
        info,
        EXPECTED_AMOUNT_OUT;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, mintA.getAccountInfo(tokenAccountA)];
          case 1:
            oldSwapTokenA = _a.sent();
            return [4 /*yield*/, mintB.getAccountInfo(tokenAccountB)];
          case 2:
            oldSwapTokenB = _a.sent();
            SWAP_AMOUNT_IN = 100000;
            return [4 /*yield*/, mintA.createAccount(owner.publicKey)];
          case 3:
            userAccountA = _a.sent();
            return [
              4 /*yield*/,
              mintA.mintTo(userAccountA, owner, [], SWAP_AMOUNT_IN),
            ];
          case 4:
            _a.sent();
            return [
              4 /*yield*/,
              mintA.approve(userAccountA, authority, owner, [], SWAP_AMOUNT_IN),
            ];
          case 5:
            _a.sent();
            return [4 /*yield*/, mintB.createAccount(owner.publicKey)];
          case 6:
            userAccountB = _a.sent();
            // Make sure all token accounts are created and approved
            return [4 /*yield*/, helpers_1.sleep(500)];
          case 7:
            // Make sure all token accounts are created and approved
            _a.sent();
            _a.label = 8;
          case 8:
            _a.trys.push([8, 10, , 11]);
            txn = stableSwap.swap(
              userAccountA, // User source token account       | User source -> Swap source
              tokenAccountA, // Swap source token account
              tokenAccountB, // Swap destination token account | Swap dest -> User dest
              userAccountB, // User destination token account
              SWAP_AMOUNT_IN,
              0 // To avoid slippage errors
            );
            return [
              4 /*yield*/,
              send_and_confirm_transaction_1.sendAndConfirmTransaction(
                "swap",
                connection,
                txn,
                payer
              ),
            ];
          case 9:
            _a.sent();
            return [3 /*break*/, 11];
          case 10:
            e_12 = _a.sent();
            throw new Error(e_12);
          case 11:
            // Make sure swap was complete
            return [4 /*yield*/, helpers_1.sleep(500)];
          case 12:
            // Make sure swap was complete
            _a.sent();
            return [4 /*yield*/, mintA.getAccountInfo(userAccountA)];
          case 13:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(0);
            return [4 /*yield*/, mintA.getAccountInfo(tokenAccountA)];
          case 14:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(
              oldSwapTokenA.amount.toNumber() + SWAP_AMOUNT_IN
            );
            EXPECTED_AMOUNT_OUT = 75000;
            return [4 /*yield*/, mintB.getAccountInfo(userAccountB)];
          case 15:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(EXPECTED_AMOUNT_OUT);
            return [4 /*yield*/, mintB.getAccountInfo(tokenAccountB)];
          case 16:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(
              oldSwapTokenB.amount.toNumber() - EXPECTED_AMOUNT_OUT
            );
            return [2 /*return*/];
        }
      });
    });
  });
  it("swap B->A", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var oldSwapTokenA,
        oldSwapTokenB,
        SWAP_AMOUNT_IN,
        userAccountB,
        userAccountA,
        txn,
        e_13,
        info,
        EXPECTED_AMOUNT_OUT;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, mintA.getAccountInfo(tokenAccountA)];
          case 1:
            oldSwapTokenA = _a.sent();
            return [4 /*yield*/, mintB.getAccountInfo(tokenAccountB)];
          case 2:
            oldSwapTokenB = _a.sent();
            SWAP_AMOUNT_IN = 100000;
            return [4 /*yield*/, mintB.createAccount(owner.publicKey)];
          case 3:
            userAccountB = _a.sent();
            return [
              4 /*yield*/,
              mintB.mintTo(userAccountB, owner, [], SWAP_AMOUNT_IN),
            ];
          case 4:
            _a.sent();
            return [
              4 /*yield*/,
              mintB.approve(userAccountB, authority, owner, [], SWAP_AMOUNT_IN),
            ];
          case 5:
            _a.sent();
            return [4 /*yield*/, mintA.createAccount(owner.publicKey)];
          case 6:
            userAccountA = _a.sent();
            // Make sure all token accounts are created and approved
            return [4 /*yield*/, helpers_1.sleep(500)];
          case 7:
            // Make sure all token accounts are created and approved
            _a.sent();
            _a.label = 8;
          case 8:
            _a.trys.push([8, 10, , 11]);
            txn = stableSwap.swap(
              userAccountB, // User source token account       | User source -> Swap source
              tokenAccountB, // Swap source token account
              tokenAccountA, // Swap destination token account | Swap dest -> User dest
              userAccountA, // User destination token account
              SWAP_AMOUNT_IN,
              0 // To avoid slippage errors
            );
            return [
              4 /*yield*/,
              send_and_confirm_transaction_1.sendAndConfirmTransaction(
                "swap",
                connection,
                txn,
                payer
              ),
            ];
          case 9:
            _a.sent();
            return [3 /*break*/, 11];
          case 10:
            e_13 = _a.sent();
            throw new Error(e_13);
          case 11:
            // Make sure swap was complete
            return [4 /*yield*/, helpers_1.sleep(500)];
          case 12:
            // Make sure swap was complete
            _a.sent();
            return [4 /*yield*/, mintB.getAccountInfo(userAccountB)];
          case 13:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(0);
            return [4 /*yield*/, mintB.getAccountInfo(tokenAccountB)];
          case 14:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(
              oldSwapTokenB.amount.toNumber() + SWAP_AMOUNT_IN
            );
            EXPECTED_AMOUNT_OUT = 75001;
            return [4 /*yield*/, mintA.getAccountInfo(userAccountA)];
          case 15:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(EXPECTED_AMOUNT_OUT);
            return [4 /*yield*/, mintA.getAccountInfo(tokenAccountA)];
          case 16:
            info = _a.sent();
            expect(info.amount.toNumber()).toBe(
              oldSwapTokenA.amount.toNumber() - EXPECTED_AMOUNT_OUT
            );
            return [2 /*return*/];
        }
      });
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZTJlLmludC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdC9lMmUuaW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsK0NBQTBDO0FBQzFDLDJDQUt5QjtBQUV6Qiw4QkFBb0M7QUFDcEMsOENBQTRFO0FBQzVFLG9DQUlxQjtBQUNyQix5RkFBcUY7QUFDckYscUNBQTZFO0FBRTdFLGtCQUFrQjtBQUNsQixJQUFNLFdBQVcsR0FBRyx1QkFBdUIsQ0FBQztBQUM1QyxJQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQztBQUNqQyxlQUFlO0FBQ2YsSUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ3ZCLElBQU0sSUFBSSxHQUFTO0lBQ2pCLHNCQUFzQixFQUFFLDRCQUFxQjtJQUM3Qyx3QkFBd0IsRUFBRSw4QkFBdUI7SUFDakQseUJBQXlCLEVBQUUsNEJBQXFCO0lBQ2hELDJCQUEyQixFQUFFLDhCQUF1QjtJQUNwRCxpQkFBaUIsRUFBRSxDQUFDO0lBQ3BCLG1CQUFtQixFQUFFLENBQUM7SUFDdEIsb0JBQW9CLEVBQUUsNEJBQXFCO0lBQzNDLHNCQUFzQixFQUFFLDhCQUF1QjtDQUNoRCxDQUFDO0FBQ0Ysb0NBQW9DO0FBQ3BDLElBQU0sc0JBQXNCLEdBQUcsMEJBQWdCLENBQUM7QUFDaEQsSUFBTSxzQkFBc0IsR0FBRywwQkFBZ0IsQ0FBQztBQUVoRCxRQUFRLENBQUMsVUFBVSxFQUFFO0lBQ25CLHFCQUFxQjtJQUNyQixJQUFJLFVBQXNCLENBQUM7SUFDM0IsWUFBWTtJQUNaLElBQUksS0FBYyxDQUFDO0lBQ25CLHNDQUFzQztJQUN0QyxJQUFJLFNBQW9CLENBQUM7SUFDekIsa0RBQWtEO0lBQ2xELElBQUksS0FBYSxDQUFDO0lBQ2xCLDZCQUE2QjtJQUM3QixJQUFJLEtBQWMsQ0FBQztJQUNuQixhQUFhO0lB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bSBcImZzXCI7XG5cbmltcG9ydCB7IFRva2VuIH0gZnJvbSBcIkBzb2xhbmEvc3BsLXRva2VuXCI7XG5pbXBvcnQge1xuICBBY2NvdW50LFxuICBDb25uZWN0aW9uLFxuICBMQU1QT1JUU19QRVJfU09MLFxuICBQdWJsaWNLZXksXG59IGZyb20gXCJAc29sYW5hL3dlYjMuanNcIjtcblxuaW1wb3J0IHsgU3RhYmxlU3dhcCB9IGZyb20gXCIuLi9zcmNcIjtcbmltcG9ydCB7IERFRkFVTFRfVE9LRU5fREVDSU1BTFMsIFRPS0VOX1BST0dSQU1fSUQgfSBmcm9tIFwiLi4vc3JjL2NvbnN0YW50c1wiO1xuaW1wb3J0IHtcbiAgREVGQVVMVF9GRUVfREVOT01JTkFUT1IsXG4gIERFRkFVTFRfRkVFX05VTUVSQVRPUixcbiAgRmVlcyxcbn0gZnJvbSBcIi4uL3NyYy9mZWVzXCI7XG5pbXBvcnQgeyBzZW5kQW5kQ29uZmlybVRyYW5zYWN0aW9uIH0gZnJvbSBcIi4uL3NyYy91dGlsL3NlbmQtYW5kLWNvbmZpcm0tdHJhbnNhY3Rpb25cIjtcbmltcG9ydCB7IGdldERlcGxveW1lbnRJbmZvLCBuZXdBY2NvdW50V2l0aExhbXBvcnRzLCBzbGVlcCB9IGZyb20gXCIuL2hlbHBlcnNcIjtcblxuLy8gQ2x1c3RlciBjb25maWdzXG5jb25zdCBDTFVTVEVSX1VSTCA9IFwiaHR0cDovL2xvY2FsaG9zdDo4ODk5XCI7XG5jb25zdCBCT09UU1RSQVBfVElNRU9VVCA9IDMwMDAwMDtcbi8vIFBvb2wgY29uZmlnc1xuY29uc3QgQU1QX0ZBQ1RPUiA9IDEwMDtcbmNvbnN0IEZFRVM6IEZlZXMgPSB7XG4gIGFkbWluVHJhZGVGZWVOdW1lcmF0b3I6IERFRkFVTFRfRkVFX05VTUVSQVRPUixcbiAgYWRtaW5UcmFkZUZlZURlbm9taW5hdG9yOiBERUZBVUxUX0ZFRV9ERU5PTUlOQVRPUixcbiAgYWRtaW5XaXRoZHJhd0ZlZU51bWVyYXRvcjogREVGQVVMVF9GRUVfTlVNRVJBVE9SLFxuICBhZG1pbldpdGhkcmF3RmVlRGVub21pbmF0b3I6IERFRkFVTFRfRkVFX0RFTk9NSU5BVE9SLFxuICB0cmFkZUZlZU51bWVyYXRvcjogMSxcbiAgdHJhZGVGZWVEZW5vbWluYXRvcjogNCxcbiAgd2l0aGRyYXdGZWVOdW1lcmF0b3I6IERFRkFVTFRfRkVFX05VTUVSQVRPUixcbiAgd2l0aGRyYXdGZWVEZW5vbWluYXRvcjogREVGQVVMVF9GRUVfREVOT01JTkFUT1IsXG59O1xuLy8gSW5pdGlhbCBhbW91bnQgaW4gZWFjaCBzd2FwIHRva2VuXG5jb25zdCBJTklUSUFMX1RPS0VOX0FfQU1PVU5UID0gTEFNUE9SVFNfUEVSX1NPTDtcbmNvbnN0IElOSVRJQUxfVE9LRU5fQl9BTU9VTlQgPSBMQU1QT1JUU19QRVJfU09MO1xuXG5kZXNjcmliZShcImUyZSB0ZXN0XCIsICgpID0+IHtcbiAgLy8gQ2x1c3RlciBjb25uZWN0aW9uXG4gIGxldCBjb25uZWN0aW9uOiBDb25uZWN0aW9uO1xuICAvLyBGZWUgcGF5ZXJcbiAgbGV0IHBheWVyOiBBY2NvdW50O1xuICAvLyBhdXRob3JpdHkgb2YgdGhlIHRva2VuIGFuZCBhY2NvdW50c1xuICBsZXQgYXV0aG9yaXR5OiBQdWJsaWNLZXk7XG4gIC8vIG5vbmNlIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGF1dGhvcml0eSBwdWJsaWMga2V5XG4gIGxldCBub25jZTogbnVtYmVyO1xuICAvLyBvd25lciBvZiB0aGUgdXNlciBhY2NvdW50c1xuICBsZXQgb3duZXI6IEFjY291bnQ7XG4gIC8vIFRva2VuIHBvb2xcbiAgbGV0IHRva2VuUG9vbDogVG9rZW47XG4gIGxldCB1c2VyUG9vbEFjY291bnQ6IFB1YmxpY0tleTtcbiAgLy8gVG9rZW5zIHN3YXBwZWRcbiAgbGV0IG1pbnRBOiBUb2tlbjtcbiAgbGV0IG1pbnRCOiBUb2tlbjtcbiAgbGV0IHRva2VuQWNjb3VudEE6IFB1YmxpY0tleTtcbiAgbGV0IHRva2VuQWNjb3VudEI6IFB1YmxpY0tleTtcbiAgLy8gQWRtaW4gZmVlIGFjY291bnRzXG4gIGxldCBhZG1pbkZlZUFjY291bnRBOiBQdWJsaWNLZXk7XG4gIGxldCBhZG1pbkZlZUFjY291bnRCOiBQdWJsaWNLZXk7XG4gIC8vIFN0YWJsZSBzd2FwXG4gIGxldCBzdGFibGVTd2FwOiBTdGFibGVTd2FwO1xuICBsZXQgc3RhYmxlU3dhcEFjY291bnQ6IEFjY291bnQ7XG4gIGxldCBzdGFibGVTd2FwUHJvZ3JhbUlkOiBQdWJsaWNLZXk7XG5cbiAgYmVmb3JlQWxsKGFzeW5jIChkb25lKSA9PiB7XG4gICAgLy8gQm9vdHN0cmFwIFRlc3QgRW52aXJvbm1lbnQgLi4uXG4gICAgY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKENMVVNURVJfVVJMLCBcInNpbmdsZVwiKTtcbiAgICBwYXllciA9IGF3YWl0IG5ld0FjY291bnRXaXRoTGFtcG9ydHMoY29ubmVjdGlvbiwgTEFNUE9SVFNfUEVSX1NPTCk7XG4gICAgb3duZXIgPSBhd2FpdCBuZXdBY2NvdW50V2l0aExhbXBvcnRzKGNvbm5lY3Rpb24sIExBTVBPUlRTX1BFUl9TT0wpO1xuXG4gICAgc3RhYmxlU3dhcFByb2dyYW1JZCA9IGdldERlcGxveW1lbnRJbmZvKCkuc3RhYmxlU3dhcFByb2dyYW1JZDtcbiAgICBzdGFibGVTd2FwQWNjb3VudCA9IG5ldyBBY2NvdW50KCk7XG4gICAgdHJ5IHtcbiAgICAgIFthdXRob3JpdHksIG5vbmNlXSA9IGF3YWl0IFB1YmxpY0tleS5maW5kUHJvZ3JhbUFkZHJlc3MoXG4gICAgICAgIFtzdGFibGVTd2FwQWNjb3VudC5wdWJsaWNLZXkudG9CdWZmZXIoKV0sXG4gICAgICAgIHN0YWJsZVN3YXBQcm9ncmFtSWRcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgICAvLyBjcmVhdGluZyBwb29sIG1pbnRcbiAgICB0cnkge1xuICAgICAgdG9rZW5Qb29sID0gYXdhaXQgVG9rZW4uY3JlYXRlTWludChcbiAgICAgICAgY29ubmVjdGlvbixcbiAgICAgICAgcGF5ZXIsXG4gICAgICAgIGF1dGhvcml0eSxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgREVGQVVMVF9UT0tFTl9ERUNJTUFMUyxcbiAgICAgICAgVE9LRU5fUFJPR1JBTV9JRFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XG4gICAgfVxuICAgIC8vIGNyZWF0aW5nIHBvb2wgYWNjb3VudFxuICAgIHRyeSB7XG4gICAgICB1c2VyUG9vbEFjY291bnQgPSBhd2FpdCB0b2tlblBvb2wuY3JlYXRlQWNjb3VudChvd25lci5wdWJsaWNLZXkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlKTtcbiAgICB9XG4gICAgLy8gY3JlYXRpbmcgdG9rZW4gQVxuICAgIHRyeSB7XG4gICAgICBtaW50QSA9IGF3YWl0IFRva2VuLmNyZWF0ZU1pbnQoXG4gICAgICAgIGNvbm5lY3Rpb24sXG4gICAgICAgIHBheWVyLFxuICAgICAgICBvd25lci5wdWJsaWNLZXksXG4gICAgICAgIG51bGwsXG4gICAgICAgIERFRkFVTFRfVE9LRU5fREVDSU1BTFMsXG4gICAgICAgIFRPS0VOX1BST0dSQU1fSURcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgICAvLyBjcmVhdGUgdG9rZW4gQSBhY2NvdW50IHRoZW4gbWludCB0byBpdFxuICAgIHRyeSB7XG4gICAgICBhZG1pbkZlZUFjY291bnRBID0gYXdhaXQgbWludEEuY3JlYXRlQWNjb3VudChvd25lci5wdWJsaWNLZXkpO1xuICAgICAgdG9rZW5BY2NvdW50QSA9IGF3YWl0IG1pbnRBLmNyZWF0ZUFjY291bnQoYXV0aG9yaXR5KTtcbiAgICAgIGF3YWl0IG1pbnRBLm1pbnRUbyh0b2tlbkFjY291bnRBLCBvd25lciwgW10sIElOSVRJQUxfVE9LRU5fQV9BTU9VTlQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlKTtcbiAgICB9XG4gICAgLy8gY3JlYXRpbmcgdG9rZW4gQlxuICAgIHRyeSB7XG4gICAgICBtaW50QiA9IGF3YWl0IFRva2VuLmNyZWF0ZU1pbnQoXG4gICAgICAgIGNvbm5lY3Rpb24sXG4gICAgICAgIHBheWVyLFxuICAgICAgICBvd25lci5wdWJsaWNLZXksXG4gICAgICAgIG51bGwsXG4gICAgICAgIERFRkFVTFRfVE9LRU5fREVDSU1BTFMsXG4gICAgICAgIFRPS0VOX1BST0dSQU1fSURcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgICAvLyBjcmVhdGluZyB0b2tlbiBCIGFjY291bnQgdGhlbiBtaW50IHRvIGl0XG4gICAgdHJ5IHtcbiAgICAgIGFkbWluRmVlQWNjb3VudEIgPSBhd2FpdCBtaW50Qi5jcmVhdGVBY2NvdW50KG93bmVyLnB1YmxpY0tleSk7XG4gICAgICB0b2tlbkFjY291bnRCID0gYXdhaXQgbWludEIuY3JlYXRlQWNjb3VudChhdXRob3JpdHkpO1xuICAgICAgYXdhaXQgbWludEIubWludFRvKHRva2VuQWNjb3VudEIsIG93bmVyLCBbXSwgSU5JVElBTF9UT0tFTl9CX0FNT1VOVCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgICAvLyBTbGVlcCB0byBtYWtlIHN1cmUgdG9rZW4gYWNjb3VudHMgYXJlIGNyZWF0ZWQgLi4uXG4gICAgYXdhaXQgc2xlZXAoNTAwKTtcblxuICAgIC8vIGNyZWF0aW5nIHRva2VuIHN3YXBcbiAgICB0cnkge1xuICAgICAgc3RhYmxlU3dhcCA9IGF3YWl0IFN0YWJsZVN3YXAuY3JlYXRlU3RhYmxlU3dhcChcbiAgICAgICAgY29ubmVjdGlvbixcbiAgICAgICAgcGF5ZXIsXG4gICAgICAgIHN0YWJsZVN3YXBBY2NvdW50LFxuICAgICAgICBhdXRob3JpdHksXG4gICAgICAgIG93bmVyLnB1YmxpY0tleSxcbiAgICAgICAgYWRtaW5GZWVBY2NvdW50QSxcbiAgICAgICAgYWRtaW5GZWVBY2NvdW50QixcbiAgICAgICAgbWludEEucHVibGljS2V5LFxuICAgICAgICB0b2tlbkFjY291bnRBLFxuICAgICAgICBtaW50Qi5wdWJsaWNLZXksXG4gICAgICAgIHRva2VuQWNjb3VudEIsXG4gICAgICAgIHRva2VuUG9vbC5wdWJsaWNLZXksXG4gICAgICAgIHVzZXJQb29sQWNjb3VudCxcbiAgICAgICAgbWludEEucHVibGljS2V5LFxuICAgICAgICBtaW50Qi5wdWJsaWNLZXksXG4gICAgICAgIHN0YWJsZVN3YXBQcm9ncmFtSWQsXG4gICAgICAgIFRPS0VOX1BST0dSQU1fSUQsXG4gICAgICAgIG5vbmNlLFxuICAgICAgICBBTVBfRkFDVE9SLFxuICAgICAgICBGRUVTXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlKTtcbiAgICB9XG5cbiAgICBkb25lKCk7XG4gIH0sIEJPT1RTVFJBUF9USU1FT1VUKTtcblxuICBpdChcImJvb3RzdHJhcHBlcidzIExQIGJhbGFuY2VcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGluZm8gPSBhd2FpdCB0b2tlblBvb2wuZ2V0QWNjb3VudEluZm8odXNlclBvb2xBY2NvdW50KTtcbiAgICBleHBlY3QoaW5mby5hbW91bnQudG9OdW1iZXIoKSkudG9FcXVhbChcbiAgICAgIElOSVRJQUxfVE9LRU5fQV9BTU9VTlQgKyBJTklUSUFMX1RPS0VOX0JfQU1PVU5UXG4gICAgKTtcbiAgfSk7XG5cbiAgaXQoXCJsb2FkU3RhYmxlU3dhcFwiLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IGZldGNoZWRTdGFibGVTd2FwOiBTdGFibGVTd2FwO1xuICAgIHRyeSB7XG4gICAgICBmZXRjaGVkU3RhYmxlU3dhcCA9IGF3YWl0IFN0YWJsZVN3YXAubG9hZFN0YWJsZVN3YXAoXG4gICAgICAgIGNvbm5lY3Rpb24sXG4gICAgICAgIHN0YWJsZVN3YXBBY2NvdW50LnB1YmxpY0tleSxcbiAgICAgICAgc3RhYmxlU3dhcFByb2dyYW1JZFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XG4gICAgfVxuXG4gICAgZXhwZWN0KGZldGNoZWRTdGFibGVTd2FwLnN0YWJsZVN3YXApLnRvRXF1YWwoc3RhYmxlU3dhcEFjY291bnQucHVibGljS2V5KTtcbiAgICBleHBlY3QoZmV0Y2hlZFN0YWJsZVN3YXAuYWRtaW5GZWVBY2NvdW50QSkudG9FcXVhbChhZG1pbkZlZUFjY291bnRBKTtcbiAgICBleHBlY3QoZmV0Y2hlZFN0YWJsZVN3YXAuYWRtaW5GZWVBY2NvdW50QikudG9FcXVhbChhZG1pbkZlZUFjY291bnRCKTtcbiAgICBleHBlY3QoZmV0Y2hlZFN0YWJsZVN3YXAudG9rZW5BY2NvdW50QSkudG9FcXVhbCh0b2tlbkFjY291bnRBKTtcbiAgICBleHBlY3QoZmV0Y2hlZFN0YWJsZVN3YXAudG9rZW5BY2NvdW50QikudG9FcXVhbCh0b2tlbkFjY291bnRCKTtcbiAgICBleHBlY3QoZmV0Y2hlZFN0YWJsZVN3YXAubWludEEpLnRvRXF1YWwobWludEEucHVibGljS2V5KTtcbiAgICBleHBlY3QoZmV0Y2hlZFN0YWJsZVN3YXAubWludEIpLnRvRXF1YWwobWludEIucHVibGljS2V5KTtcbiAgICBleHBlY3QoZmV0Y2hlZFN0YWJsZVN3YXAucG9vbFRva2VuTWludCkudG9FcXVhbCh0b2tlblBvb2wucHVibGljS2V5KTtcbiAgICBleHBlY3QoZmV0Y2hlZFN0YWJsZVN3YXAuaW5pdGlhbEFtcEZhY3RvcikudG9FcXVhbChBTVBfRkFDVE9SKTtcbiAgICBleHBlY3QoZmV0Y2hlZFN0YWJsZVN3YXAuZmVlcykudG9FcXVhbChGRUVTKTtcbiAgfSk7XG5cbiAgaXQoXCJnZXRWaXJ0dWFsUHJpY2VcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGV4cGVjdChhd2FpdCBzdGFibGVTd2FwLmdldFZpcnR1YWxQcmljZSgpKS50b0JlKDEpO1xuICB9KTtcblxuICBpdChcImRlcG9zaXRcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGRlcG9zaXRBbW91bnRBID0gTEFNUE9SVFNfUEVSX1NPTDtcbiAgICBjb25zdCBkZXBvc2l0QW1vdW50QiA9IExBTVBPUlRTX1BFUl9TT0w7XG4gICAgLy8gQ3JlYXRpbmcgZGVwb3NpdG9yIHRva2VuIGEgYWNjb3VudFxuICAgIGNvbnN0IHVzZXJBY2NvdW50QSA9IGF3YWl0IG1pbnRBLmNyZWF0ZUFjY291bnQob3duZXIucHVibGljS2V5KTtcbiAgICBhd2FpdCBtaW50QS5taW50VG8odXNlckFjY291bnRBLCBvd25lciwgW10sIGRlcG9zaXRBbW91bnRBKTtcbiAgICBhd2FpdCBtaW50QS5hcHByb3ZlKHVzZXJBY2NvdW50QSwgYXV0aG9yaXR5LCBvd25lciwgW10sIGRlcG9zaXRBbW91bnRBKTtcbiAgICAvLyBDcmVhdGluZyBkZXBvc2l0b3IgdG9rZW4gYiBhY2NvdW50XG4gICAgY29uc3QgdXNlckFjY291bnRCID0gYXdhaXQgbWludEIuY3JlYXRlQWNjb3VudChvd25lci5wdWJsaWNLZXkpO1xuICAgIGF3YWl0IG1pbnRCLm1pbnRUbyh1c2VyQWNjb3VudEIsIG93bmVyLCBbXSwgZGVwb3NpdEFtb3VudEIpO1xuICAgIGF3YWl0IG1pbnRCLmFwcHJvdmUodXNlckFjY291bnRCLCBhdXRob3JpdHksIG93bmVyLCBbXSwgZGVwb3NpdEFtb3VudEIpO1xuICAgIC8vIE1ha2Ugc3VyZSBhbGwgdG9rZW4gYWNjb3VudHMgYXJlIGNyZWF0ZWQgYW5kIGFwcHJvdmVkXG4gICAgYXdhaXQgc2xlZXAoNTAwKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBEZXBvc2l0aW5nIGludG8gc3dhcFxuICAgICAgY29uc3QgdHhuID0gc3RhYmxlU3dhcC5kZXBvc2l0KFxuICAgICAgICB1c2VyQWNjb3VudEEsXG4gICAgICAgIHVzZXJBY2NvdW50QixcbiAgICAgICAgdXNlclBvb2xBY2NvdW50LFxuICAgICAgICBkZXBvc2l0QW1vdW50QSxcbiAgICAgICAgZGVwb3NpdEFtb3VudEIsXG4gICAgICAgIDAgLy8gVG8gYXZvaWQgc2xpcHBhZ2UgZXJyb3JzXG4gICAgICApO1xuICAgICAgYXdhaXQgc2VuZEFuZENvbmZpcm1UcmFuc2FjdGlvbihcImRlcG9zaXRcIiwgY29ubmVjdGlvbiwgdHhuLCBwYXllcik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xuICAgIH1cblxuICAgIGxldCBpbmZvID0gYXdhaXQgbWludEEuZ2V0QWNjb3VudEluZm8odXNlckFjY291bnRBKTtcbiAgICBleHBlY3QoaW5mby5hbW91bnQudG9OdW1iZXIoKSkudG9CZSgwKTtcbiAgICBpbmZvID0gYXdhaXQgbWludEIuZ2V0QWNjb3VudEluZm8odXNlckFjY291bnRCKTtcbiAgICBleHBlY3QoaW5mby5hbW91bnQudG9OdW1iZXIoKSkudG9CZSgwKTtcbiAgICBpbmZvID0gYXdhaXQgbWludEEuZ2V0QWNjb3VudEluZm8odG9rZW5BY2NvdW50QSk7XG4gICAgZXhwZWN0KGluZm8uYW1vdW50LnRvTnVtYmVyKCkpLnRvQmUoXG4gICAgICBJTklUSUFMX1RPS0VOX0FfQU1PVU5UICsgZGVwb3NpdEFtb3VudEFcbiAgICApO1xuICAgIGluZm8gPSBhd2FpdCBtaW50Qi5nZXRBY2NvdW50SW5mbyh0b2tlbkFjY291bnRCKTtcbiAgICBleHBlY3QoaW5mby5hbW91bnQudG9OdW1iZXIoKSkudG9CZShcbiAgICAgIElOSVRJQUxfVE9LRU5fQl9BTU9VTlQgKyBkZXBvc2l0QW1vdW50QlxuICAgICk7XG4gICAgaW5mbyA9IGF3YWl0IHRva2VuUG9vbC5nZXRBY2NvdW50SW5mbyh1c2VyUG9vbEFjY291bnQpO1xuICAgIGV4cGVjdChpbmZvLmFtb3VudC50b051bWJlcigpKS50b0JlKDQwMDAwMDAwMDApO1xuICB9KTtcblxuICBpdChcIndpdGhkcmF3XCIsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB3aXRoZHJhd2FsQW1vdW50ID0gMTAwMDAwO1xuICAgIGNvbnN0IHBvb2xNaW50SW5mbyA9IGF3YWl0IHRva2VuUG9vbC5nZXRNaW50SW5mbygpO1xuICAgIGNvbnN0IG9sZFN1cHBseSA9IHBvb2xNaW50SW5mby5zdXBwbHkudG9OdW1iZXIoKTtcbiAgICBjb25zdCBvbGRTd2FwVG9rZW5BID0gYXdhaXQgbWludEEuZ2V0QWNjb3VudEluZm8odG9rZW5BY2NvdW50QSk7XG4gICAgY29uc3Qgb2xkU3dhcFRva2VuQiA9IGF3YWl0IG1pbnRCLmdldEFjY291bnRJbmZvKHRva2VuQWNjb3VudEIpO1xuICAgIGNvbnN0IG9sZFBvb2xUb2tlbiA9IGF3YWl0IHRva2VuUG9vbC5nZXRBY2NvdW50SW5mbyh1c2VyUG9vbEFjY291bnQpO1xuICAgIGNvbnN0IGV4cGVjdGVkV2l0aGRyYXdBID0gTWF0aC5mbG9vcihcbiAgICAgIChvbGRTd2FwVG9rZW5BLmFtb3VudC50b051bWJlcigpICogd2l0aGRyYXdhbEFtb3VudCkgLyBvbGRTdXBwbHlcbiAgICApO1xuICAgIGNvbnN0IGV4cGVjdGVkV2l0aGRyYXdCID0gTWF0aC5mbG9vcihcbiAgICAgIChvbGRTd2FwVG9rZW5CLmFtb3VudC50b051bWJlcigpICogd2l0aGRyYXdhbEFtb3VudCkgLyBvbGRTdXBwbHlcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRpbmcgd2l0aGRyYXcgdG9rZW4gQSBhY2NvdW50XG4gICAgY29uc3QgdXNlckFjY291bnRBID0gYXdhaXQgbWludEEuY3JlYXRlQWNjb3VudChvd25lci5wdWJsaWNLZXkpO1xuICAgIC8vIENyZWF0aW5nIHdpdGhkcmF3IHRva2VuIEIgYWNjb3VudFxuICAgIGNvbnN0IHVzZXJBY2NvdW50QiA9IGF3YWl0IG1pbnRCLmNyZWF0ZUFjY291bnQob3duZXIucHVibGljS2V5KTtcbiAgICAvLyBBcHByb3Zpbmcgd2l0aGRyYXdhbCBmcm9tIHBvb2wgYWNjb3VudFxuICAgIGF3YWl0IHRva2VuUG9vbC5hcHByb3ZlKFxuICAgICAgdXNlclBvb2xBY2NvdW50LFxuICAgICAgYXV0aG9yaXR5LFxuICAgICAgb3duZXIsXG4gICAgICBbXSxcbiAgICAgIHdpdGhkcmF3YWxBbW91bnRcbiAgICApO1xuICAgIC8vIE1ha2Ugc3VyZSBhbGwgdG9rZW4gYWNjb3VudHMgYXJlIGNyZWF0ZWQgYW5kIGFwcHJvdmVkXG4gICAgYXdhaXQgc2xlZXAoNTAwKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBXaXRoZHJhd2luZyBwb29sIHRva2VucyBmb3IgQSBhbmQgQiB0b2tlbnNcbiAgICAgIGNvbnN0IHR4biA9IGF3YWl0IHN0YWJsZVN3YXAud2l0aGRyYXcoXG4gICAgICAgIHVzZXJBY2NvdW50QSxcbiAgICAgICAgdXNlckFjY291bnRCLFxuICAgICAgICB1c2VyUG9vbEFjY291bnQsXG4gICAgICAgIHdpdGhkcmF3YWxBbW91bnQsXG4gICAgICAgIDAsIC8vIFRvIGF2b2lkIHNsaXBwYWdlIGVycm9yc1xuICAgICAgICAwIC8vIFRvIGF2b2lkIHNwbGlpYWdlIGVycm9yc1xuICAgICAgKTtcbiAgICAgIGF3YWl0IHNlbmRBbmRDb25maXJtVHJhbnNhY3Rpb24oXCJ3aXRoZHJhd1wiLCBjb25uZWN0aW9uLCB0eG4sIHBheWVyKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XG4gICAgfVxuXG4gICAgbGV0IGluZm8gPSBhd2FpdCBtaW50QS5nZXRBY2NvdW50SW5mbyh1c2VyQWNjb3VudEEpO1xuICAgIGV4cGVjdChpbmZvLmFtb3VudC50b051bWJlcigpKS50b0JlKGV4cGVjdGVkV2l0aGRyYXdBKTtcbiAgICBpbmZvID0gYXdhaXQgbWludEIuZ2V0QWNjb3VudEluZm8odXNlckFjY291bnRCKTtcbiAgICBleHBlY3QoaW5mby5hbW91bnQudG9OdW1iZXIoKSkudG9CZShleHBlY3RlZFdpdGhkcmF3Qik7XG4gICAgaW5mbyA9IGF3YWl0IHRva2VuUG9vbC5nZXRBY2NvdW50SW5mbyh1c2VyUG9vbEFjY291bnQpO1xuICAgIGV4cGVjdChpbmZvLmFtb3VudC50b051bWJlcigpKS50b0JlKFxuICAgICAgb2xkUG9vbFRva2VuLmFtb3VudC50b051bWJlcigpIC0gd2l0aGRyYXdhbEFtb3VudFxuICAgICk7XG4gICAgY29uc3QgbmV3U3dhcFRva2VuQSA9IGF3YWl0IG1pbnRBLmdldEFjY291bnRJbmZvKHRva2VuQWNjb3VudEEpO1xuICAgIGV4cGVjdChuZXdTd2FwVG9rZW5BLmFtb3VudC50b051bWJlcigpKS50b0JlKFxuICAgICAgb2xkU3dhcFRva2VuQS5hbW91bnQudG9OdW1iZXIoKSAtIGV4cGVjdGVkV2l0aGRyYXdBXG4gICAgKTtcbiAgICBjb25zdCBuZXdTd2FwVG9rZW5CID0gYXdhaXQgbWludEIuZ2V0QWNjb3VudEluZm8odG9rZW5BY2NvdW50Qik7XG4gICAgZXhwZWN0KG5ld1N3YXBUb2tlbkIuYW1vdW50LnRvTnVtYmVyKCkpLnRvQmUoXG4gICAgICBvbGRTd2FwVG9rZW5CLmFtb3VudC50b051bWJlcigpIC0gZXhwZWN0ZWRXaXRoZHJhd0JcbiAgICApO1xuICB9KTtcblxuICBpdChcInN3YXAgQS0+QlwiLCBhc3luYyAoKSA9PiB7XG4gICAgLy8gU3dhcCBhY2NvdW50cyBiZWZvcmUgc3dhcFxuICAgIGNvbnN0IG9sZFN3YXBUb2tlbkEgPSBhd2FpdCBtaW50QS5nZXRBY2NvdW50SW5mbyh0b2tlbkFjY291bnRBKTtcbiAgICBjb25zdCBvbGRTd2FwVG9rZW5CID0gYXdhaXQgbWludEIuZ2V0QWNjb3VudEluZm8odG9rZW5BY2NvdW50Qik7XG4gICAgLy8gQW1vdW50IHBhc3NlZCB0byBzd2FwIGluc3RydWN0aW9uXG4gICAgY29uc3QgU1dBUF9BTU9VTlRfSU4gPSAxMDAwMDA7XG4gICAgLy8gQ3JlYXRpbmcgc3dhcCB0b2tlbiBhIGFjY291bnRcbiAgICBjb25zdCB1c2VyQWNjb3VudEEgPSBhd2FpdCBtaW50QS5jcmVhdGVBY2NvdW50KG93bmVyLnB1YmxpY0tleSk7XG4gICAgYXdhaXQgbWludEEubWludFRvKHVzZXJBY2NvdW50QSwgb3duZXIsIFtdLCBTV0FQX0FNT1VOVF9JTik7XG4gICAgYXdhaXQgbWludEEuYXBwcm92ZSh1c2VyQWNjb3VudEEsIGF1dGhvcml0eSwgb3duZXIsIFtdLCBTV0FQX0FNT1VOVF9JTik7XG4gICAgLy8gQ3JlYXRpbmcgc3dhcCB0b2tlbiBiIGFjY291bnRcbiAgICBjb25zdCB1c2VyQWNjb3VudEIgPSBhd2FpdCBtaW50Qi5jcmVhdGVBY2NvdW50KG93bmVyLnB1YmxpY0tleSk7XG4gICAgLy8gTWFrZSBzdXJlIGFsbCB0b2tlbiBhY2NvdW50cyBhcmUgY3JlYXRlZCBhbmQgYXBwcm92ZWRcbiAgICBhd2FpdCBzbGVlcCg1MDApO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFN3YXBwaW5nXG4gICAgICBjb25zdCB0eG4gPSBzdGFibGVTd2FwLnN3YXAoXG4gICAgICAgIHVzZXJBY2NvdW50QSwgLy8gVXNlciBzb3VyY2UgdG9rZW4gYWNjb3VudCAgICAgICB8IFVzZXIgc291cmNlIC0+IFN3YXAgc291cmNlXG4gICAgICAgIHRva2VuQWNjb3VudEEsIC8vIFN3YXAgc291cmNlIHRva2VuIGFjY291bnRcbiAgICAgICAgdG9rZW5BY2NvdW50QiwgLy8gU3dhcCBkZXN0aW5hdGlvbiB0b2tlbiBhY2NvdW50IHwgU3dhcCBkZXN0IC0+IFVzZXIgZGVzdFxuICAgICAgICB1c2VyQWNjb3VudEIsIC8vIFVzZXIgZGVzdGluYXRpb24gdG9rZW4gYWNjb3VudFxuICAgICAgICBTV0FQX0FNT1VOVF9JTixcbiAgICAgICAgMCAvLyBUbyBhdm9pZCBzbGlwcGFnZSBlcnJvcnNcbiAgICAgICk7XG4gICAgICBhd2FpdCBzZW5kQW5kQ29uZmlybVRyYW5zYWN0aW9uKFwic3dhcFwiLCBjb25uZWN0aW9uLCB0eG4sIHBheWVyKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XG4gICAgfVxuICAgIC8vIE1ha2Ugc3VyZSBzd2FwIHdhcyBjb21wbGV0ZVxuICAgIGF3YWl0IHNsZWVwKDUwMCk7XG5cbiAgICBsZXQgaW5mbyA9IGF3YWl0IG1pbnRBLmdldEFjY291bnRJbmZvKHVzZXJBY2NvdW50QSk7XG4gICAgZXhwZWN0KGluZm8uYW1vdW50LnRvTnVtYmVyKCkpLnRvQmUoMCk7XG4gICAgaW5mbyA9IGF3YWl0IG1pbnRBLmdldEFjY291bnRJbmZvKHRva2VuQWNjb3VudEEpO1xuICAgIGV4cGVjdChpbmZvLmFtb3VudC50b051bWJlcigpKS50b0JlKFxuICAgICAgb2xkU3dhcFRva2VuQS5hbW91bnQudG9OdW1iZXIoKSArIFNXQVBfQU1PVU5UX0lOXG4gICAgKTtcbiAgICBjb25zdCBFWFBFQ1RFRF9BTU9VTlRfT1VUID0gNzUwMDA7IC8vIEVYUEVDVEVEX0FNT1VOVF9PVVQgPSBTV0FQX0FNT1VOVF9JTiAqICgxIC0gRkVFUylcbiAgICBpbmZvID0gYXdhaXQgbWludEIuZ2V0QWNjb3VudEluZm8odXNlckFjY291bnRCKTtcbiAgICBleHBlY3QoaW5mby5hbW91bnQudG9OdW1iZXIoKSkudG9CZShFWFBFQ1RFRF9BTU9VTlRfT1VUKTtcbiAgICBpbmZvID0gYXdhaXQgbWludEIuZ2V0QWNjb3VudEluZm8odG9rZW5BY2NvdW50Qik7XG4gICAgZXhwZWN0KGluZm8uYW1vdW50LnRvTnVtYmVyKCkpLnRvQmUoXG4gICAgICBvbGRTd2FwVG9rZW5CLmFtb3VudC50b051bWJlcigpIC0gRVhQRUNURURfQU1PVU5UX09VVFxuICAgICk7XG4gIH0pO1xuXG4gIGl0KFwic3dhcCBCLT5BXCIsIGFzeW5jICgpID0+IHtcbiAgICAvLyBTd2FwIGFjY291bnRzIGJlZm9yZSBzd2FwXG4gICAgY29uc3Qgb2xkU3dhcFRva2VuQSA9IGF3YWl0IG1pbnRBLmdldEFjY291bnRJbmZvKHRva2VuQWNjb3VudEEpO1xuICAgIGNvbnN0IG9sZFN3YXBUb2tlbkIgPSBhd2FpdCBtaW50Qi5nZXRBY2NvdW50SW5mbyh0b2tlbkFjY291bnRCKTtcbiAgICAvLyBBbW91bnQgcGFzc2VkIHRvIHN3YXAgaW5zdHJ1Y3Rpb25cbiAgICBjb25zdCBTV0FQX0FNT1VOVF9JTiA9IDEwMDAwMDtcbiAgICAvLyBDcmVhdGluZyBzd2FwIHRva2VuIGIgYWNjb3VudFxuICAgIGNvbnN0IHVzZXJBY2NvdW50QiA9IGF3YWl0IG1pbnRCLmNyZWF0ZUFjY291bnQob3duZXIucHVibGljS2V5KTtcbiAgICBhd2FpdCBtaW50Qi5taW50VG8odXNlckFjY291bnRCLCBvd25lciwgW10sIFNXQVBfQU1PVU5UX0lOKTtcbiAgICBhd2FpdCBtaW50Qi5hcHByb3ZlKHVzZXJBY2NvdW50QiwgYXV0aG9yaXR5LCBvd25lciwgW10sIFNXQVBfQU1PVU5UX0lOKTtcbiAgICAvLyBDcmVhdGluZyBzd2FwIHRva2VuIGEgYWNjb3VudFxuICAgIGNvbnN0IHVzZXJBY2NvdW50QSA9IGF3YWl0IG1pbnRBLmNyZWF0ZUFjY291bnQob3duZXIucHVibGljS2V5KTtcbiAgICAvLyBNYWtlIHN1cmUgYWxsIHRva2VuIGFjY291bnRzIGFyZSBjcmVhdGVkIGFuZCBhcHByb3ZlZFxuICAgIGF3YWl0IHNsZWVwKDUwMCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gU3dhcHBpbmc7XG4gICAgICBjb25zdCB0eG4gPSBzdGFibGVTd2FwLnN3YXAoXG4gICAgICAgIHVzZXJBY2NvdW50QiwgLy8gVXNlciBzb3VyY2UgdG9rZW4gYWNjb3VudCAgICAgICB8IFVzZXIgc291cmNlIC0+IFN3YXAgc291cmNlXG4gICAgICAgIHRva2VuQWNjb3VudEIsIC8vIFN3YXAgc291cmNlIHRva2VuIGFjY291bnRcbiAgICAgICAgdG9rZW5BY2NvdW50QSwgLy8gU3dhcCBkZXN0aW5hdGlvbiB0b2tlbiBhY2NvdW50IHwgU3dhcCBkZXN0IC0+IFVzZXIgZGVzdFxuICAgICAgICB1c2VyQWNjb3VudEEsIC8vIFVzZXIgZGVzdGluYXRpb24gdG9rZW4gYWNjb3VudFxuICAgICAgICBTV0FQX0FNT1VOVF9JTixcbiAgICAgICAgMCAvLyBUbyBhdm9pZCBzbGlwcGFnZSBlcnJvcnNcbiAgICAgICk7XG4gICAgICBhd2FpdCBzZW5kQW5kQ29uZmlybVRyYW5zYWN0aW9uKFwic3dhcFwiLCBjb25uZWN0aW9uLCB0eG4sIHBheWVyKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHN3YXAgd2FzIGNvbXBsZXRlXG4gICAgYXdhaXQgc2xlZXAoNTAwKTtcblxuICAgIGxldCBpbmZvID0gYXdhaXQgbWludEIuZ2V0QWNjb3VudEluZm8odXNlckFjY291bnRCKTtcbiAgICBleHBlY3QoaW5mby5hbW91bnQudG9OdW1iZXIoKSkudG9CZSgwKTtcbiAgICBpbmZvID0gYXdhaXQgbWludEIuZ2V0QWNjb3VudEluZm8odG9rZW5BY2NvdW50Qik7XG4gICAgZXhwZWN0KGluZm8uYW1vdW50LnRvTnVtYmVyKCkpLnRvQmUoXG4gICAgICBvbGRTd2FwVG9rZW5CLmFtb3VudC50b051bWJlcigpICsgU1dBUF9BTU9VTlRfSU5cbiAgICApO1xuICAgIGNvbnN0IEVYUEVDVEVEX0FNT1VOVF9PVVQgPSA3NTAwMTsgLy8gRVhQRUNURURfQU1PVU5UX09VVCA9IFNXQVBfQU1PVU5UX0lOICogKDEgLSBGRUVTKVxuICAgIGluZm8gPSBhd2FpdCBtaW50QS5nZXRBY2NvdW50SW5mbyh1c2VyQWNjb3VudEEpO1xuICAgIGV4cGVjdChpbmZvLmFtb3VudC50b051bWJlcigpKS50b0JlKEVYUEVDVEVEX0FNT1VOVF9PVVQpO1xuICAgIGluZm8gPSBhd2FpdCBtaW50QS5nZXRBY2NvdW50SW5mbyh0b2tlbkFjY291bnRBKTtcbiAgICBleHBlY3QoaW5mby5hbW91bnQudG9OdW1iZXIoKSkudG9CZShcbiAgICAgIG9sZFN3YXBUb2tlbkEuYW1vdW50LnRvTnVtYmVyKCkgLSBFWFBFQ1RFRF9BTU9VTlRfT1VUXG4gICAgKTtcbiAgfSk7XG59KTtcbiJdfQ==
