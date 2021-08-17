"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.StableSwap = void 0;
var bn_js_1 = __importDefault(require("bn.js"));
var web3_js_1 = require("@solana/web3.js");
var spl_token_1 = require("@solana/spl-token");
var constants_1 = require("./constants");
var fees_1 = require("./fees");
var instructions = __importStar(require("./instructions"));
var layout = __importStar(require("./layout"));
var account_1 = require("./util/account");
var calculator_1 = require("./util/calculator");
var send_and_confirm_transaction_1 = require("./util/send-and-confirm-transaction");
var u64_1 = require("./util/u64");
/**
 * A program to exchange tokens against a pool of liquidity
 */
var StableSwap = /** @class */ (function () {
  /**
   * Constructor for new StableSwap client object
   * @param connection
   * @param stableSwap
   * @param swapProgramId
   * @param tokenProgramId
   * @param poolTokenMint
   * @param authority
   * @param adminAccount
   * @param adminFeeAccountA
   * @param adminFeeAccountB
   * @param tokenAccountA
   * @param tokenAccountB
   * @param mintA
   * @param mintB
   * @param initialAmpFactor
   * @param targetAmpFactor
   * @param startRampTimestamp
   * @param stopRampTimeStamp
   * @param fees
   */
  function StableSwap(
    connection,
    stableSwap,
    swapProgramId,
    tokenProgramId,
    poolTokenMint,
    authority,
    adminAccount,
    adminFeeAccountA,
    adminFeeAccountB,
    tokenAccountA,
    tokenAccountB,
    mintA,
    mintB,
    initialAmpFactor,
    targetAmpFactor,
    startRampTimestamp,
    stopRampTimeStamp,
    fees
  ) {
    if (fees === void 0) {
      fees = fees_1.DEFAULT_FEES;
    }
    this.connection = connection;
    this.stableSwap = stableSwap;
    this.swapProgramId = swapProgramId;
    this.tokenProgramId = tokenProgramId;
    this.poolTokenMint = poolTokenMint;
    this.authority = authority;
    this.adminAccount = adminAccount;
    this.adminFeeAccountA = adminFeeAccountA;
    this.adminFeeAccountB = adminFeeAccountB;
    this.tokenAccountA = tokenAccountA;
    this.tokenAccountB = tokenAccountB;
    this.mintA = mintA;
    this.mintB = mintB;
    this.initialAmpFactor = initialAmpFactor;
    this.targetAmpFactor = targetAmpFactor;
    this.startRampTimestamp = startRampTimestamp;
    this.stopRampTimestamp = stopRampTimeStamp;
    this.fees = fees;
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
          case 0:
            return [
              4 /*yield*/,
              connection.getMinimumBalanceForRentExemption(
                layout.StableSwapLayout.span
              ),
            ];
          case 1:
            return [2 /*return*/, _a.sent()];
        }
      });
    });
  };
  /**
   * Load an onchain StableSwap program
   * @param connection The connection to use
   * @param address The public key of the account to load
   * @param programId Address of the onchain StableSwap program
   * @param payer Pays for the transaction
   */
  StableSwap.loadStableSwap = function (connection, address, programId) {
    return __awaiter(this, void 0, void 0, function () {
      var data,
        stableSwapData,
        _a,
        authority,
        adminAccount,
        adminFeeAccountA,
        adminFeeAccountB,
        tokenAccountA,
        tokenAccountB,
        poolTokenMint,
        mintA,
        mintB,
        tokenProgramId,
        initialAmpFactor,
        targetAmpFactor,
        startRampTimestamp,
        stopRampTimeStamp,
        fees;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            return [
              4 /*yield*/,
              account_1.loadAccount(connection, address, programId),
            ];
          case 1:
            data = _b.sent();
            stableSwapData = layout.StableSwapLayout.decode(data);
            if (!stableSwapData.isInitialized) {
              throw new Error("Invalid token swap state");
            }
            return [
              4 /*yield*/,
              web3_js_1.PublicKey.findProgramAddress(
                [address.toBuffer()],
                programId
              ),
            ];
          case 2:
            (_a = __read.apply(void 0, [_b.sent(), 1])), (authority = _a[0]);
            adminAccount = new web3_js_1.PublicKey(stableSwapData.adminAccount);
            adminFeeAccountA = new web3_js_1.PublicKey(
              stableSwapData.adminFeeAccountA
            );
            adminFeeAccountB = new web3_js_1.PublicKey(
              stableSwapData.adminFeeAccountB
            );
            tokenAccountA = new web3_js_1.PublicKey(
              stableSwapData.tokenAccountA
            );
            tokenAccountB = new web3_js_1.PublicKey(
              stableSwapData.tokenAccountB
            );
            poolTokenMint = new web3_js_1.PublicKey(stableSwapData.tokenPool);
            mintA = new web3_js_1.PublicKey(stableSwapData.mintA);
            mintB = new web3_js_1.PublicKey(stableSwapData.mintB);
            tokenProgramId = constants_1.TOKEN_PROGRAM_ID;
            initialAmpFactor = stableSwapData.initialAmpFactor;
            targetAmpFactor = stableSwapData.targetAmpFactor;
            startRampTimestamp = stableSwapData.startRampTs;
            stopRampTimeStamp = stableSwapData.stopRampTs;
            fees = {
              adminTradeFeeNumerator: stableSwapData.adminTradeFeeNumerator,
              adminTradeFeeDenominator: stableSwapData.adminTradeFeeDenominator,
              adminWithdrawFeeNumerator:
                stableSwapData.adminWithdrawFeeNumerator,
              adminWithdrawFeeDenominator:
                stableSwapData.adminWithdrawFeeDenominator,
              tradeFeeNumerator: stableSwapData.tradeFeeNumerator,
              tradeFeeDenominator: stableSwapData.tradeFeeDenominator,
              withdrawFeeNumerator: stableSwapData.withdrawFeeNumerator,
              withdrawFeeDenominator: stableSwapData.withdrawFeeDenominator,
            };
            return [
              2 /*return*/,
              new StableSwap(
                connection,
                address,
                programId,
                tokenProgramId,
                poolTokenMint,
                authority,
                adminAccount,
                adminFeeAccountA,
                adminFeeAccountB,
                tokenAccountA,
                tokenAccountB,
                mintA,
                mintB,
                initialAmpFactor,
                targetAmpFactor,
                startRampTimestamp,
                stopRampTimeStamp,
                fees
              ),
            ];
        }
      });
    });
  };
  /**
   * Constructor for new StableSwap client object
   * @param connection
   * @param payer
   * @param stableSwapAccount
   * @param authority
   * @param adminAccount
   * @param adminFeeAccountA
   * @param adminFeeAccountB
   * @param tokenAccountA
   * @param tokenAccountB
   * @param poolTokenMint
   * @param poolTokenAccount
   * @param mintA
   * @param mintB
   * @param swapProgramId
   * @param tokenProgramId
   * @param nonce
   * @param ampFactor
   * @param fees
   */
  StableSwap.createStableSwap = function (
    connection,
    payer,
    stableSwapAccount,
    authority,
    adminAccount,
    adminFeeAccountA,
    adminFeeAccountB,
    tokenMintA,
    tokenAccountA,
    tokenMintB,
    tokenAccountB,
    poolTokenMint,
    poolTokenAccount,
    mintA,
    mintB,
    swapProgramId,
    tokenProgramId,
    nonce,
    ampFactor,
    fees
  ) {
    if (fees === void 0) {
      fees = fees_1.DEFAULT_FEES;
    }
    return __awaiter(this, void 0, void 0, function () {
      var balanceNeeded, transaction, instruction;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              StableSwap.getMinBalanceRentForExemptStableSwap(connection),
            ];
          case 1:
            balanceNeeded = _a.sent();
            transaction = new web3_js_1.Transaction().add(
              web3_js_1.SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: stableSwapAccount.publicKey,
                lamports: balanceNeeded,
                space: layout.StableSwapLayout.span,
                programId: swapProgramId,
              })
            );
            instruction = instructions.createInitSwapInstruction(
              stableSwapAccount,
              authority,
              adminAccount,
              adminFeeAccountA,
              adminFeeAccountB,
              tokenMintA,
              tokenAccountA,
              tokenMintB,
              tokenAccountB,
              poolTokenMint,
              poolTokenAccount,
              swapProgramId,
              tokenProgramId,
              nonce,
              ampFactor,
              fees
            );
            transaction.add(instruction);
            return [
              4 /*yield*/,
              send_and_confirm_transaction_1.sendAndConfirmTransaction(
                "createAccount and InitializeSwap",
                connection,
                transaction,
                payer,
                stableSwapAccount
              ),
            ];
          case 2:
            _a.sent();
            return [
              2 /*return*/,
              new StableSwap(
                connection,
                stableSwapAccount.publicKey,
                swapProgramId,
                tokenProgramId,
                poolTokenMint,
                authority,
                adminAccount,
                adminFeeAccountA,
                adminFeeAccountB,
                tokenAccountA,
                tokenAccountB,
                mintA,
                mintB,
                ampFactor,
                ampFactor,
                constants_1.ZERO_TS,
                constants_1.ZERO_TS,
                fees
              ),
            ];
        }
      });
    });
  };
  /**
   * Get the virtual price of the pool.
   */
  StableSwap.prototype.getVirtualPrice = function () {
    return __awaiter(this, void 0, void 0, function () {
      var tokenAData,
        tokenBData,
        poolMintData,
        tokenA,
        _a,
        _b,
        tokenB,
        _c,
        _d,
        amountA,
        amountB,
        D,
        poolMint,
        _e,
        _f,
        poolSupply,
        e_1;
      return __generator(this, function (_g) {
        switch (_g.label) {
          case 0:
            _g.trys.push([0, 4, , 5]);
            tokenAData = account_1.loadAccount(
              this.connection,
              this.tokenAccountA,
              this.tokenProgramId
            );
            tokenBData = account_1.loadAccount(
              this.connection,
              this.tokenAccountB,
              this.tokenProgramId
            );
            poolMintData = account_1.loadAccount(
              this.connection,
              this.poolTokenMint,
              this.tokenProgramId
            );
            _b = (_a = spl_token_1.AccountLayout).decode;
            return [4 /*yield*/, tokenAData];
          case 1:
            tokenA = _b.apply(_a, [_g.sent()]);
            _d = (_c = spl_token_1.AccountLayout).decode;
            return [4 /*yield*/, tokenBData];
          case 2:
            tokenB = _d.apply(_c, [_g.sent()]);
            amountA = u64_1.NumberU64.fromBuffer(tokenA.amount);
            amountB = u64_1.NumberU64.fromBuffer(tokenB.amount);
            D = calculator_1.computeD(
              new bn_js_1.default(this.initialAmpFactor),
              amountA,
              amountB
            );
            _f = (_e = spl_token_1.MintLayout).decode;
            return [4 /*yield*/, poolMintData];
          case 3:
            poolMint = _f.apply(_e, [_g.sent()]);
            poolSupply = u64_1.NumberU64.fromBuffer(poolMint.supply);
            return [
              2 /*return*/,
              D.mul(new bn_js_1.default(Math.pow(10, 6)))
                .div(poolSupply)
                .toNumber() / Math.pow(10, 6),
            ];
          case 4:
            e_1 = _g.sent();
            throw new Error(e_1);
          case 5:
            return [2 /*return*/];
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
  StableSwap.prototype.swap = function (
    userSource,
    poolSource,
    poolDestination,
    userDestination,
    amountIn,
    minimumAmountOut
  ) {
    var adminDestination =
      poolDestination === this.tokenAccountA
        ? this.adminFeeAccountA
        : this.adminFeeAccountB;
    return new web3_js_1.Transaction().add(
      instructions.swapInstruction(
        this.stableSwap,
        this.authority,
        userSource,
        poolSource,
        poolDestination,
        userDestination,
        adminDestination,
        this.swapProgramId,
        this.tokenProgramId,
        amountIn,
        minimumAmountOut
      )
    );
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
  StableSwap.prototype.deposit = function (
    userAccountA,
    userAccountB,
    poolTokenAccount,
    tokenAmountA,
    tokenAmountB,
    minimumPoolTokenAmount
  ) {
    return new web3_js_1.Transaction().add(
      instructions.depositInstruction(
        this.stableSwap,
        this.authority,
        userAccountA,
        userAccountB,
        this.tokenAccountA,
        this.tokenAccountB,
        this.poolTokenMint,
        poolTokenAccount,
        this.swapProgramId,
        this.tokenProgramId,
        tokenAmountA,
        tokenAmountB,
        minimumPoolTokenAmount
      )
    );
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
  StableSwap.prototype.withdraw = function (
    userAccountA,
    userAccountB,
    poolAccount,
    poolTokenAmount,
    minimumTokenA,
    minimumTokenB
  ) {
    return new web3_js_1.Transaction().add(
      instructions.withdrawInstruction(
        this.stableSwap,
        this.authority,
        this.poolTokenMint,
        poolAccount,
        this.tokenAccountA,
        this.tokenAccountB,
        userAccountA,
        userAccountB,
        this.adminFeeAccountA,
        this.adminFeeAccountB,
        this.swapProgramId,
        this.tokenProgramId,
        poolTokenAmount,
        minimumTokenA,
        minimumTokenB
      )
    );
  };
  return StableSwap;
})();
exports.StableSwap = StableSwap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhYmxlLXN3YXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc3RhYmxlLXN3YXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBdUI7QUFFdkIsMkNBS3lCO0FBQ3pCLCtDQUE4RDtBQUU5RCx5Q0FBd0Q7QUFDeEQsK0JBQTRDO0FBQzVDLDJEQUErQztBQUMvQywrQ0FBbUM7QUFDbkMsMENBQTZDO0FBQzdDLGdEQUE2QztBQUM3QyxvRkFBZ0Y7QUFDaEYsa0NBQXVDO0FBRXZDOztHQUVHO0FBQ0g7SUEyRkU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bb0JHO0lBQ0gsb0JBQ0UsVUFBc0IsRUFDdEIsVUFBcUIsRUFDckIsYUFBd0IsRUFDeEIsY0FBeUIsRUFDekIsYUFBd0IsRUFDeEIsU0FBb0IsRUFDcEIsWUFBdUIsRUFDdkIsZ0JBQTJCLEVBQzNCLGdCQUEyQixFQUMzQixhQUF3QixFQUN4QixhQUF3QixFQUN4QixLQUFnQixFQUNoQixLQUFnQixFQUNoQixnQkFBd0IsRUFDeEIsZUFBdUIsRUFDdkIsa0JBQTBCLEVBQzFCLGlCQUF5QixFQUN6QixJQUF5QjtRQUF6QixxQkFBQSxFQUFBLE9BQWEsbUJBQVk7UUFFekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7UUFDbkMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDckMsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7UUFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFD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QUFJLENBQUMsY0FBYyxFQUNuQixZQUFZLEVBQ1osWUFBWSxFQUNaLHNCQUFzQixDQUN2QixDQUNGLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCw2QkFBUSxHQUFSLFVBQ0UsWUFBdUIsRUFDdkIsWUFBdUIsRUFDdkIsV0FBc0IsRUFDdEIsZUFBdUIsRUFDdkIsYUFBcUIsRUFDckIsYUFBcUI7UUFFckIsT0FBTyxJQUFJLHFCQUFXLEVBQUUsQ0FBQyxHQUFHLENBQzFCLFlBQVksQ0FBQyxtQkFBbUIsQ0FDOUIsSUFBSSxDQUFDLFVBQVUsRUFDZixJQUFJLENBQUMsU0FBUyxFQUNkLElBQUksQ0FBQyxhQUFhLEVBQ2xCLFdBQVcsRUFDWCxJQUFJLENBQUMsYUFBYSxFQUNsQixJQUFJLENBQUMsYUFBYSxFQUNsQixZQUFZLEVBQ1osWUFBWSxFQUNaLElBQUksQ0FBQyxnQkFBZ0IsRUFDckIsSUFBSSxDQUFDLGdCQUFnQixFQUNyQixJQUFJLENBQUMsYUFBYSxFQUNsQixJQUFJLENBQUMsY0FBYyxFQUNuQixlQUFlLEVBQ2YsYUFBYSxFQUNiLGFBQWEsQ0FDZCxDQUNGLENBQUM7SUFDSixDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBMWVELElBMGVDO0FBMWVZLGdDQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiO1xuaW1wb3J0IHR5cGUgeyBDb25uZWN0aW9uIH0gZnJvbSBcIkBzb2xhbmEvd2ViMy5qc1wiO1xuaW1wb3J0IHtcbiAgQWNjb3VudCxcbiAgUHVibGljS2V5LFxuICBTeXN0ZW1Qcm9ncmFtLFxuICBUcmFuc2FjdGlvbixcbn0gZnJvbSBcIkBzb2xhbmEvd2ViMy5qc1wiO1xuaW1wb3J0IHsgQWNjb3VudExheW91dCwgTWludExheW91dCB9IGZyb20gXCJAc29sYW5hL3NwbC10b2tlblwiO1xuXG5pbXBvcnQgeyBUT0tFTl9QUk9HUkFNX0lELCBaRVJPX1RTIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBERUZBVUxUX0ZFRVMsIEZlZXMgfSBmcm9tIFwiLi9mZWVzXCI7XG5pbXBvcnQgKiBhcyBpbnN0cnVjdGlvbnMgZnJvbSBcIi4vaW5zdHJ1Y3Rpb25zXCI7XG5pbXBvcnQgKiBhcyBsYXlvdXQgZnJvbSBcIi4vbGF5b3V0XCI7XG5pbXBvcnQgeyBsb2FkQWNjb3VudCB9IGZyb20gXCIuL3V0aWwvYWNjb3VudFwiO1xuaW1wb3J0IHsgY29tcHV0ZUQgfSBmcm9tIFwiLi91dGlsL2NhbGN1bGF0b3JcIjtcbmltcG9ydCB7IHNlbmRBbmRDb25maXJtVHJhbnNhY3Rpb24gfSBmcm9tIFwiLi91dGlsL3NlbmQtYW5kLWNvbmZpcm0tdHJhbnNhY3Rpb25cIjtcbmltcG9ydCB7IE51bWJlclU2NCB9IGZyb20gXCIuL3V0aWwvdTY0XCI7XG5cbi8qKlxuICogQSBwcm9ncmFtIHRvIGV4Y2hhbmdlIHRva2VucyBhZ2FpbnN0IGEgcG9vbCBvZiBsaXF1aWRpdHlcbiAqL1xuZXhwb3J0IGNsYXNzIFN0YWJsZVN3YXAge1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNvbm5lY3Rpb246IENvbm5lY3Rpb247XG5cbiAgLyoqXG4gICAqIFByb2dyYW0gSWRlbnRpZmllciBmb3IgdGhlIFN3YXAgcHJvZ3JhbVxuICAgKi9cbiAgc3dhcFByb2dyYW1JZDogUHVibGljS2V5O1xuXG4gIC8qKlxuICAgKiBQcm9ncmFtIElkZW50aWZpZXIgZm9yIHRoZSBUb2tlbiBwcm9ncmFtXG4gICAqL1xuICB0b2tlblByb2dyYW1JZDogUHVibGljS2V5O1xuXG4gIC8qKlxuICAgKiBUaGUgcHVibGljIGtleSBpZGVudGlmeWluZyB0aGlzIHN3YXAgcHJvZ3JhbVxuICAgKi9cbiAgc3RhYmxlU3dhcDogUHVibGljS2V5O1xuXG4gIC8qKlxuICAgKiBUaGUgcHVibGljIGtleSBmb3IgdGhlIGxpcXVpZGl0eSBwb29sIHRva2VuIG1pbnRcbiAgICovXG4gIHBvb2xUb2tlbk1pbnQ6IFB1YmxpY0tleTtcblxuICAvKipcbiAgICogQXV0aG9yaXR5XG4gICAqL1xuICBhdXRob3JpdHk6IFB1YmxpY0tleTtcblxuICAvKipcbiAgICogQWRtaW4gYWNjb3VudFxuICAgKi9cbiAgYWRtaW5BY2NvdW50OiBQdWJsaWNLZXk7XG5cbiAgLyoqXG4gICAqIEFkbWluIGZlZSBhY2NvdW50IGZvciB0b2tlbiBBXG4gICAqL1xuICBhZG1pbkZlZUFjY291bnRBOiBQdWJsaWNLZXk7XG5cbiAgLyoqXG4gICAqIEFkbWluIGZlZSBhY2NvdW50IGZvciB0b2tlbiBCXG4gICAqL1xuICBhZG1pbkZlZUFjY291bnRCOiBQdWJsaWNLZXk7XG5cbiAgLyoqXG4gICAqIFRoZSBwdWJsaWMga2V5IGZvciB0aGUgZmlyc3QgdG9rZW4gYWNjb3VudCBvZiB0aGUgdHJhZGluZyBwYWlyXG4gICAqL1xuICB0b2tlbkFjY291bnRBOiBQdWJsaWNLZXk7XG5cbiAgLyoqXG4gICAqIFRoZSBwdWJsaWMga2V5IGZvciB0aGUgc2Vjb25kIHRva2VuIGFjY291bnQgb2YgdGhlIHRyYWRpbmcgcGFpclxuICAgKi9cbiAgdG9rZW5BY2NvdW50QjogUHVibGljS2V5O1xuXG4gIC8qKlxuICAgKiBUaGUgcHVibGljIGtleSBmb3IgdGhlIG1pbnQgb2YgdGhlIGZpcnN0IHRva2VuIGFjY291bnQgb2YgdGhlIHRyYWRpbmcgcGFpclxuICAgKi9cbiAgbWludEE6IFB1YmxpY0tleTtcblxuICAvKipcbiAgICogVGhlIHB1YmxpYyBrZXkgZm9yIHRoZSBtaW50IG9mIHRoZSBzZWNvbmQgdG9rZW4gYWNjb3VudCBvZiB0aGUgdHJhZGluZyBwYWlyXG4gICAqL1xuICBtaW50QjogUHVibGljS2V5O1xuXG4gIC8qKlxuICAgKiBJbml0aWFsIGFtcGxpZmljYXRpb24gY29lZmZpY2llbnQgKEEpXG4gICAqL1xuICBpbml0aWFsQW1wRmFjdG9yOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRhcmdldCBhbXBsaWZpY2F0aW9uIGNvZWZmaWNpZW50IChBKVxuICAgKi9cbiAgdGFyZ2V0QW1wRmFjdG9yOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFJhbXAgQSBzdGFydCB0aW1lc3RhbXBcbiAgICovXG4gIHN0YXJ0UmFtcFRpbWVzdGFtcDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBSYW1wIEEgc3RhcnQgdGltZXN0YW1wXG4gICAqL1xuICBzdG9wUmFtcFRpbWVzdGFtcDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBGZWVzXG4gICAqL1xuICBmZWVzOiBGZWVzO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBmb3IgbmV3IFN0YWJsZVN3YXAgY2xpZW50IG9iamVjdFxuICAgKiBAcGFyYW0gY29ubmVjdGlvblxuICAgKiBAcGFyYW0gc3RhYmxlU3dhcFxuICAgKiBAcGFyYW0gc3dhcFByb2dyYW1JZFxuICAgKiBAcGFyYW0gdG9rZW5Qcm9ncmFtSWRcbiAgICogQHBhcmFtIHBvb2xUb2tlbk1pbnRcbiAgICogQHBhcmFtIGF1dGhvcml0eVxuICAgKiBAcGFyYW0gYWRtaW5BY2NvdW50XG4gICAqIEBwYXJhbSBhZG1pbkZlZUFjY291bnRBXG4gICAqIEBwYXJhbSBhZG1pbkZlZUFjY291bnRCXG4gICAqIEBwYXJhbSB0b2tlbkFjY291bnRBXG4gICAqIEBwYXJhbSB0b2tlbkFjY291bnRCXG4gICAqIEBwYXJhbSBtaW50QVxuICAgKiBAcGFyYW0gbWludEJcbiAgICogQHBhcmFtIGluaXRpYWxBbXBGYWN0b3JcbiAgICogQHBhcmFtIHRhcmdldEFtcEZhY3RvclxuICAgKiBAcGFyYW0gc3RhcnRSYW1wVGltZXN0YW1wXG4gICAqIEBwYXJhbSBzdG9wUmFtcFRpbWVTdGFtcFxuICAgKiBAcGFyYW0gZmVlc1xuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgY29ubmVjdGlvbjogQ29ubmVjdGlvbixcbiAgICBzdGFibGVTd2FwOiBQdWJsaWNLZXksXG4gICAgc3dhcFByb2dyYW1JZDogUHVibGljS2V5LFxuICAgIHRva2VuUHJvZ3JhbUlkOiBQdWJsaWNLZXksXG4gICAgcG9vbFRva2VuTWludDogUHVibGljS2V5LFxuICAgIGF1dGhvcml0eTogUHVibGljS2V5LFxuICAgIGFkbWluQWNjb3VudDogUHVibGljS2V5LFxuICAgIGFkbWluRmVlQWNjb3VudEE6IFB1YmxpY0tleSxcbiAgICBhZG1pbkZlZUFjY291bnRCOiBQdWJsaWNLZXksXG4gICAgdG9rZW5BY2NvdW50QTogUHVibGljS2V5LFxuICAgIHRva2VuQWNjb3VudEI6IFB1YmxpY0tleSxcbiAgICBtaW50QTogUHVibGljS2V5LFxuICAgIG1pbnRCOiBQdWJsaWNLZXksXG4gICAgaW5pdGlhbEFtcEZhY3RvcjogbnVtYmVyLFxuICAgIHRhcmdldEFtcEZhY3RvcjogbnVtYmVyLFxuICAgIHN0YXJ0UmFtcFRpbWVzdGFtcDogbnVtYmVyLFxuICAgIHN0b3BSYW1wVGltZVN0YW1wOiBudW1iZXIsXG4gICAgZmVlczogRmVlcyA9IERFRkFVTFRfRkVFU1xuICApIHtcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIHRoaXMuc3RhYmxlU3dhcCA9IHN0YWJsZVN3YXA7XG4gICAgdGhpcy5zd2FwUHJvZ3JhbUlkID0gc3dhcFByb2dyYW1JZDtcbiAgICB0aGlzLnRva2VuUHJvZ3JhbUlkID0gdG9rZW5Qcm9ncmFtSWQ7XG4gICAgdGhpcy5wb29sVG9rZW5NaW50ID0gcG9vbFRva2VuTWludDtcbiAgICB0aGlzLmF1dGhvcml0eSA9IGF1dGhvcml0eTtcbiAgICB0aGlzLmFkbWluQWNjb3VudCA9IGFkbWluQWNjb3VudDtcbiAgICB0aGlzLmFkbWluRmVlQWNjb3VudEEgPSBhZG1pbkZlZUFjY291bnRBO1xuICAgIHRoaXMuYWRtaW5GZWVBY2NvdW50QiA9IGFkbWluRmVlQWNjb3VudEI7XG4gICAgdGhpcy50b2tlbkFjY291bnRBID0gdG9rZW5BY2NvdW50QTtcbiAgICB0aGlzLnRva2VuQWNjb3VudEIgPSB0b2tlbkFjY291bnRCO1xuICAgIHRoaXMubWludEEgPSBtaW50QTtcbiAgICB0aGlzLm1pbnRCID0gbWludEI7XG4gICAgdGhpcy5pbml0aWFsQW1wRmFjdG9yID0gaW5pdGlhbEFtcEZhY3RvcjtcbiAgICB0aGlzLnRhcmdldEFtcEZhY3RvciA9IHRhcmdldEFtcEZhY3RvcjtcbiAgICB0aGlzLnN0YXJ0UmFtcFRpbWVzdGFtcCA9IHN0YXJ0UmFtcFRpbWVzdGFtcDtcbiAgICB0aGlzLnN0b3BSYW1wVGltZXN0YW1wID0gc3RvcFJhbXBUaW1lU3RhbXA7XG4gICAgdGhpcy5mZWVzID0gZmVlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1pbmltdW0gYmFsYW5jZSBmb3IgdGhlIHRva2VuIHN3YXAgYWNjb3VudCB0byBiZSByZW50IGV4ZW1wdFxuICAgKlxuICAgKiBAcmV0dXJuIE51bWJlciBvZiBsYW1wb3J0cyByZXF1aXJlZFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGdldE1pbkJhbGFuY2VSZW50Rm9yRXhlbXB0U3RhYmxlU3dhcChcbiAgICBjb25uZWN0aW9uOiBDb25uZWN0aW9uXG4gICk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGF3YWl0IGNvbm5lY3Rpb24uZ2V0TWluaW11bUJhbGFuY2VGb3JSZW50RXhlbXB0aW9uKFxuICAgICAgbGF5b3V0LlN0YWJsZVN3YXBMYXlvdXQuc3BhblxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCBhbiBvbmNoYWluIFN0YWJsZVN3YXAgcHJvZ3JhbVxuICAgKiBAcGFyYW0gY29ubmVjdGlvbiBUaGUgY29ubmVjdGlvbiB0byB1c2VcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIHB1YmxpYyBrZXkgb2YgdGhlIGFjY291bnQgdG8gbG9hZFxuICAgKiBAcGFyYW0gcHJvZ3JhbUlkIEFkZHJlc3Mgb2YgdGhlIG9uY2hhaW4gU3RhYmxlU3dhcCBwcm9ncmFtXG4gICAqIEBwYXJhbSBwYXllciBQYXlzIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkU3RhYmxlU3dhcChcbiAgICBjb25uZWN0aW9uOiBDb25uZWN0aW9uLFxuICAgIGFkZHJlc3M6IFB1YmxpY0tleSxcbiAgICBwcm9ncmFtSWQ6IFB1YmxpY0tleVxuICApOiBQcm9taXNlPFN0YWJsZVN3YXA+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgbG9hZEFjY291bnQoY29ubmVjdGlvbiwgYWRkcmVzcywgcHJvZ3JhbUlkKTtcbiAgICBjb25zdCBzdGFibGVTd2FwRGF0YSA9IGxheW91dC5TdGFibGVTd2FwTGF5b3V0LmRlY29kZShkYXRhKTtcbiAgICBpZiAoIXN0YWJsZVN3YXBEYXRhLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB0b2tlbiBzd2FwIHN0YXRlYCk7XG4gICAgfVxuXG4gICAgY29uc3QgW2F1dGhvcml0eV0gPSBhd2FpdCBQdWJsaWNLZXkuZmluZFByb2dyYW1BZGRyZXNzKFxuICAgICAgW2FkZHJlc3MudG9CdWZmZXIoKV0sXG4gICAgICBwcm9ncmFtSWRcbiAgICApO1xuICAgIGNvbnN0IGFkbWluQWNjb3VudCA9IG5ldyBQdWJsaWNLZXkoc3RhYmxlU3dhcERhdGEuYWRtaW5BY2NvdW50KTtcbiAgICBjb25zdCBhZG1pbkZlZUFjY291bnRBID0gbmV3IFB1YmxpY0tleShzdGFibGVTd2FwRGF0YS5hZG1pbkZlZUFjY291bnRBKTtcbiAgICBjb25zdCBhZG1pbkZlZUFjY291bnRCID0gbmV3IFB1YmxpY0tleShzdGFibGVTd2FwRGF0YS5hZG1pbkZlZUFjY291bnRCKTtcbiAgICBjb25zdCB0b2tlbkFjY291bnRBID0gbmV3IFB1YmxpY0tleShzdGFibGVTd2FwRGF0YS50b2tlbkFjY291bnRBKTtcbiAgICBjb25zdCB0b2tlbkFjY291bnRCID0gbmV3IFB1YmxpY0tleShzdGFibGVTd2FwRGF0YS50b2tlbkFjY291bnRCKTtcbiAgICBjb25zdCBwb29sVG9rZW5NaW50ID0gbmV3IFB1YmxpY0tleShzdGFibGVTd2FwRGF0YS50b2tlblBvb2wpO1xuICAgIGNvbnN0IG1pbnRBID0gbmV3IFB1YmxpY0tleShzdGFibGVTd2FwRGF0YS5taW50QSk7XG4gICAgY29uc3QgbWludEIgPSBuZXcgUHVibGljS2V5KHN0YWJsZVN3YXBEYXRhLm1pbnRCKTtcbiAgICBjb25zdCB0b2tlblByb2dyYW1JZCA9IFRPS0VOX1BST0dSQU1fSUQ7XG4gICAgY29uc3QgaW5pdGlhbEFtcEZhY3RvciA9IHN0YWJsZVN3YXBEYXRhLmluaXRpYWxBbXBGYWN0b3I7XG4gICAgY29uc3QgdGFyZ2V0QW1wRmFjdG9yID0gc3RhYmxlU3dhcERhdGEudGFyZ2V0QW1wRmFjdG9yO1xuICAgIGNvbnN0IHN0YXJ0UmFtcFRpbWVzdGFtcCA9IHN0YWJsZVN3YXBEYXRhLnN0YXJ0UmFtcFRzO1xuICAgIGNvbnN0IHN0b3BSYW1wVGltZVN0YW1wID0gc3RhYmxlU3dhcERhdGEuc3RvcFJhbXBUcztcbiAgICBjb25zdCBmZWVzID0ge1xuICAgICAgYWRtaW5UcmFkZUZlZU51bWVyYXRvcjogc3RhYmxlU3dhcERhdGEuYWRtaW5UcmFkZUZlZU51bWVyYXRvciBhcyBudW1iZXIsXG4gICAgICBhZG1pblRyYWRlRmVlRGVub21pbmF0b3I6IHN0YWJsZVN3YXBEYXRhLmFkbWluVHJhZGVGZWVEZW5vbWluYXRvciBhcyBudW1iZXIsXG4gICAgICBhZG1pbldpdGhkcmF3RmVlTnVtZXJhdG9yOiBzdGFibGVTd2FwRGF0YS5hZG1pbldpdGhkcmF3RmVlTnVtZXJhdG9yIGFzIG51bWJlcixcbiAgICAgIGFkbWluV2l0aGRyYXdGZWVEZW5vbWluYXRvcjogc3RhYmxlU3dhcERhdGEuYWRtaW5XaXRoZHJhd0ZlZURlbm9taW5hdG9yIGFzIG51bWJlcixcbiAgICAgIHRyYWRlRmVlTnVtZXJhdG9yOiBzdGFibGVTd2FwRGF0YS50cmFkZUZlZU51bWVyYXRvciBhcyBudW1iZXIsXG4gICAgICB0cmFkZUZlZURlbm9taW5hdG9yOiBzdGFibGVTd2FwRGF0YS50cmFkZUZlZURlbm9taW5hdG9yIGFzIG51bWJlcixcbiAgICAgIHdpdGhkcmF3RmVlTnVtZXJhdG9yOiBzdGFibGVTd2FwRGF0YS53aXRoZHJhd0ZlZU51bWVyYXRvciBhcyBudW1iZXIsXG4gICAgICB3aXRoZHJhd0ZlZURlbm9taW5hdG9yOiBzdGFibGVTd2FwRGF0YS53aXRoZHJhd0ZlZURlbm9taW5hdG9yIGFzIG51bWJlcixcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBTdGFibGVTd2FwKFxuICAgICAgY29ubmVjdGlvbixcbiAgICAgIGFkZHJlc3MsXG4gICAgICBwcm9ncmFtSWQsXG4gICAgICB0b2tlblByb2dyYW1JZCxcbiAgICAgIHBvb2xUb2tlbk1pbnQsXG4gICAgICBhdXRob3JpdHksXG4gICAgICBhZG1pbkFjY291bnQsXG4gICAgICBhZG1pbkZlZUFjY291bnRBLFxuICAgICAgYWRtaW5GZWVBY2NvdW50QixcbiAgICAgIHRva2VuQWNjb3VudEEsXG4gICAgICB0b2tlbkFjY291bnRCLFxuICAgICAgbWludEEsXG4gICAgICBtaW50QixcbiAgICAgIGluaXRpYWxBbXBGYWN0b3IsXG4gICAgICB0YXJnZXRBbXBGYWN0b3IsXG4gICAgICBzdGFydFJhbXBUaW1lc3RhbXAsXG4gICAgICBzdG9wUmFtcFRpbWVTdGFtcCxcbiAgICAgIGZlZXNcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBuZXcgU3RhYmxlU3dhcCBjbGllbnQgb2JqZWN0XG4gICAqIEBwYXJhbSBjb25uZWN0aW9uXG4gICAqIEBwYXJhbSBwYXllclxuICAgKiBAcGFyYW0gc3RhYmxlU3dhcEFjY291bnRcbiAgICogQHBhcmFtIGF1dGhvcml0eVxuICAgKiBAcGFyYW0gYWRtaW5BY2NvdW50XG4gICAqIEBwYXJhbSBhZG1pbkZlZUFjY291bnRBXG4gICAqIEBwYXJhbSBhZG1pbkZlZUFjY291bnRCXG4gICAqIEBwYXJhbSB0b2tlbkFjY291bnRBXG4gICAqIEBwYXJhbSB0b2tlbkFjY291bnRCXG4gICAqIEBwYXJhbSBwb29sVG9rZW5NaW50XG4gICAqIEBwYXJhbSBwb29sVG9rZW5BY2NvdW50XG4gICAqIEBwYXJhbSBtaW50QVxuICAgKiBAcGFyYW0gbWludEJcbiAgICogQHBhcmFtIHN3YXBQcm9ncmFtSWRcbiAgICogQHBhcmFtIHRva2VuUHJvZ3JhbUlkXG4gICAqIEBwYXJhbSBub25jZVxuICAgKiBAcGFyYW0gYW1wRmFjdG9yXG4gICAqIEBwYXJhbSBmZWVzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlU3RhYmxlU3dhcChcbiAgICBjb25uZWN0aW9uOiBDb25uZWN0aW9uLFxuICAgIHBheWVyOiBBY2NvdW50LFxuICAgIHN0YWJsZVN3YXBBY2NvdW50OiBBY2NvdW50LFxuICAgIGF1dGhvcml0eTogUHVibGljS2V5LFxuICAgIGFkbWluQWNjb3VudDogUHVibGljS2V5LFxuICAgIGFkbWluRmVlQWNjb3VudEE6IFB1YmxpY0tleSxcbiAgICBhZG1pbkZlZUFjY291bnRCOiBQdWJsaWNLZXksXG4gICAgdG9rZW5NaW50QTogUHVibGljS2V5LFxuICAgIHRva2VuQWNjb3VudEE6IFB1YmxpY0tleSxcbiAgICB0b2tlbk1pbnRCOiBQdWJsaWNLZXksXG4gICAgdG9rZW5BY2NvdW50QjogUHVibGljS2V5LFxuICAgIHBvb2xUb2tlbk1pbnQ6IFB1YmxpY0tleSxcbiAgICBwb29sVG9rZW5BY2NvdW50OiBQdWJsaWNLZXksXG4gICAgbWludEE6IFB1YmxpY0tleSxcbiAgICBtaW50QjogUHVibGljS2V5LFxuICAgIHN3YXBQcm9ncmFtSWQ6IFB1YmxpY0tleSxcbiAgICB0b2tlblByb2dyYW1JZDogUHVibGljS2V5LFxuICAgIG5vbmNlOiBudW1iZXIsXG4gICAgYW1wRmFjdG9yOiBudW1iZXIsXG4gICAgZmVlczogRmVlcyA9IERFRkFVTFRfRkVFU1xuICApOiBQcm9taXNlPFN0YWJsZVN3YXA+IHtcbiAgICAvLyBBbGxvY2F0ZSBtZW1vcnkgZm9yIHRoZSBhY2NvdW50XG4gICAgY29uc3QgYmFsYW5jZU5lZWRlZCA9IGF3YWl0IFN0YWJsZVN3YXAuZ2V0TWluQmFsYW5jZVJlbnRGb3JFeGVtcHRTdGFibGVTd2FwKFxuICAgICAgY29ubmVjdGlvblxuICAgICk7XG4gICAgY29uc3QgdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgICBTeXN0ZW1Qcm9ncmFtLmNyZWF0ZUFjY291bnQoe1xuICAgICAgICBmcm9tUHVia2V5OiBwYXllci5wdWJsaWNLZXksXG4gICAgICAgIG5ld0FjY291bnRQdWJrZXk6IHN0YWJsZVN3YXBBY2NvdW50LnB1YmxpY0tleSxcbiAgICAgICAgbGFtcG9ydHM6IGJhbGFuY2VOZWVkZWQsXG4gICAgICAgIHNwYWNlOiBsYXlvdXQuU3RhYmxlU3dhcExheW91dC5zcGFuLFxuICAgICAgICBwcm9ncmFtSWQ6IHN3YXBQcm9ncmFtSWQsXG4gICAgICB9KVxuICAgICk7XG5cbiAgICBjb25zdCBpbnN0cnVjdGlvbiA9IGluc3RydWN0aW9ucy5jcmVhdGVJbml0U3dhcEluc3RydWN0aW9uKFxuICAgICAgc3RhYmxlU3dhcEFjY291bnQsXG4gICAgICBhdXRob3JpdHksXG4gICAgICBhZG1pbkFjY291bnQsXG4gICAgICBhZG1pbkZlZUFjY291bnRBLFxuICAgICAgYWRtaW5GZWVBY2NvdW50QixcbiAgICAgIHRva2VuTWludEEsXG4gICAgICB0b2tlbkFjY291bnRBLFxuICAgICAgdG9rZW5NaW50QixcbiAgICAgIHRva2VuQWNjb3VudEIsXG4gICAgICBwb29sVG9rZW5NaW50LFxuICAgICAgcG9vbFRva2VuQWNjb3VudCxcbiAgICAgIHN3YXBQcm9ncmFtSWQsXG4gICAgICB0b2tlblByb2dyYW1JZCxcbiAgICAgIG5vbmNlLFxuICAgICAgYW1wRmFjdG9yLFxuICAgICAgZmVlc1xuICAgICk7XG4gICAgdHJhbnNhY3Rpb24uYWRkKGluc3RydWN0aW9uKTtcblxuICAgIGF3YWl0IHNlbmRBbmRDb25maXJtVHJhbnNhY3Rpb24oXG4gICAgICBcImNyZWF0ZUFjY291bnQgYW5kIEluaXRpYWxpemVTd2FwXCIsXG4gICAgICBjb25uZWN0aW9uLFxuICAgICAgdHJhbnNhY3Rpb24sXG4gICAgICBwYXllcixcbiAgICAgIHN0YWJsZVN3YXBBY2NvdW50XG4gICAgKTtcblxuICAgIHJldHVybiBuZXcgU3RhYmxlU3dhcChcbiAgICAgIGNvbm5lY3Rpb24sXG4gICAgICBzdGFibGVTd2FwQWNjb3VudC5wdWJsaWNLZXksXG4gICAgICBzd2FwUHJvZ3JhbUlkLFxuICAgICAgdG9rZW5Qcm9ncmFtSWQsXG4gICAgICBwb29sVG9rZW5NaW50LFxuICAgICAgYXV0aG9yaXR5LFxuICAgICAgYWRtaW5BY2NvdW50LFxuICAgICAgYWRtaW5GZWVBY2NvdW50QSxcbiAgICAgIGFkbWluRmVlQWNjb3VudEIsXG4gICAgICB0b2tlbkFjY291bnRBLFxuICAgICAgdG9rZW5BY2NvdW50QixcbiAgICAgIG1pbnRBLFxuICAgICAgbWludEIsXG4gICAgICBhbXBGYWN0b3IsXG4gICAgICBhbXBGYWN0b3IsXG4gICAgICBaRVJPX1RTLFxuICAgICAgWkVST19UUyxcbiAgICAgIGZlZXNcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdmlydHVhbCBwcmljZSBvZiB0aGUgcG9vbC5cbiAgICovXG4gIGFzeW5jIGdldFZpcnR1YWxQcmljZSgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCB0b2tlbkFEYXRhO1xuICAgIGxldCB0b2tlbkJEYXRhO1xuICAgIGxldCBwb29sTWludERhdGE7XG4gICAgdHJ5IHtcbiAgICAgIHRva2VuQURhdGEgPSBsb2FkQWNjb3VudChcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLFxuICAgICAgICB0aGlzLnRva2VuQWNjb3VudEEsXG4gICAgICAgIHRoaXMudG9rZW5Qcm9ncmFtSWRcbiAgICAgICk7XG4gICAgICB0b2tlbkJEYXRhID0gbG9hZEFjY291bnQoXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbixcbiAgICAgICAgdGhpcy50b2tlbkFjY291bnRCLFxuICAgICAgICB0aGlzLnRva2VuUHJvZ3JhbUlkXG4gICAgICApO1xuICAgICAgcG9vbE1pbnREYXRhID0gbG9hZEFjY291bnQoXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbixcbiAgICAgICAgdGhpcy5wb29sVG9rZW5NaW50LFxuICAgICAgICB0aGlzLnRva2VuUHJvZ3JhbUlkXG4gICAgICApO1xuXG4gICAgICBjb25zdCB0b2tlbkEgPSBBY2NvdW50TGF5b3V0LmRlY29kZShhd2FpdCB0b2tlbkFEYXRhKTtcbiAgICAgIGNvbnN0IHRva2VuQiA9IEFjY291bnRMYXlvdXQuZGVjb2RlKGF3YWl0IHRva2VuQkRhdGEpO1xuICAgICAgY29uc3QgYW1vdW50QSA9IE51bWJlclU2NC5mcm9tQnVmZmVyKHRva2VuQS5hbW91bnQpO1xuICAgICAgY29uc3QgYW1vdW50QiA9IE51bWJlclU2NC5mcm9tQnVmZmVyKHRva2VuQi5hbW91bnQpO1xuICAgICAgY29uc3QgRCA9IGNvbXB1dGVEKG5ldyBCTih0aGlzLmluaXRpYWxBbXBGYWN0b3IpLCBhbW91bnRBLCBhbW91bnRCKTtcblxuICAgICAgY29uc3QgcG9vbE1pbnQgPSBNaW50TGF5b3V0LmRlY29kZShhd2FpdCBwb29sTWludERhdGEpO1xuICAgICAgY29uc3QgcG9vbFN1cHBseSA9IE51bWJlclU2NC5mcm9tQnVmZmVyKHBvb2xNaW50LnN1cHBseSk7XG5cbiAgICAgIHJldHVybiBELm11bChuZXcgQk4oTWF0aC5wb3coMTAsIDYpKSkuZGl2KHBvb2xTdXBwbHkpLnRvTnVtYmVyKCkgLyBNYXRoLnBvdygxMCwgNik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTd2FwIHRva2VuIEEgZm9yIHRva2VuIEJcbiAgICogQHBhcmFtIHVzZXJTb3VyY2VcbiAgICogQHBhcmFtIHBvb2xTb3VyY2VcbiAgICogQHBhcmFtIHBvb2xEZXN0aW5hdGlvblxuICAgKiBAcGFyYW0gdXNlckRlc3RpbmF0aW9uXG4gICAqIEBwYXJhbSBhbW91bnRJblxuICAgKiBAcGFyYW0gbWluaW11bUFtb3VudE91dFxuICAgKi9cbiAgc3dhcChcbiAgICB1c2VyU291cmNlOiBQdWJsaWNLZXksXG4gICAgcG9vbFNvdXJjZTogUHVibGljS2V5LFxuICAgIHBvb2xEZXN0aW5hdGlvbjogUHVibGljS2V5LFxuICAgIHVzZXJEZXN0aW5hdGlvbjogUHVibGljS2V5LFxuICAgIGFtb3VudEluOiBudW1iZXIsXG4gICAgbWluaW11bUFtb3VudE91dDogbnVtYmVyXG4gICk6IFRyYW5zYWN0aW9uIHtcbiAgICBjb25zdCBhZG1pbkRlc3RpbmF0aW9uID1cbiAgICAgIHBvb2xEZXN0aW5hdGlvbiA9PT0gdGhpcy50b2tlbkFjY291bnRBXG4gICAgICAgID8gdGhpcy5hZG1pbkZlZUFjY291bnRBXG4gICAgICAgIDogdGhpcy5hZG1pbkZlZUFjY291bnRCO1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgICBpbnN0cnVjdGlvbnMuc3dhcEluc3RydWN0aW9uKFxuICAgICAgICB0aGlzLnN0YWJsZVN3YXAsXG4gICAgICAgIHRoaXMuYXV0aG9yaXR5LFxuICAgICAgICB1c2VyU291cmNlLFxuICAgICAgICBwb29sU291cmNlLFxuICAgICAgICBwb29sRGVzdGluYXRpb24sXG4gICAgICAgIHVzZXJEZXN0aW5hdGlvbixcbiAgICAgICAgYWRtaW5EZXN0aW5hdGlvbixcbiAgICAgICAgdGhpcy5zd2FwUHJvZ3JhbUlkLFxuICAgICAgICB0aGlzLnRva2VuUHJvZ3JhbUlkLFxuICAgICAgICBhbW91bnRJbixcbiAgICAgICAgbWluaW11bUFtb3VudE91dFxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRGVwb3NpdCB0b2tlbnMgaW50byB0aGUgcG9vbFxuICAgKiBAcGFyYW0gdXNlckFjY291bnRBXG4gICAqIEBwYXJhbSB1c2VyQWNjb3VudEJcbiAgICogQHBhcmFtIHBvb2xBY2NvdW50XG4gICAqIEBwYXJhbSB0b2tlbkFtb3VudEFcbiAgICogQHBhcmFtIHRva2VuQW1vdW50QlxuICAgKiBAcGFyYW0gbWluaW11bVBvb2xUb2tlbkFtb3VudFxuICAgKi9cbiAgZGVwb3NpdChcbiAgICB1c2VyQWNjb3VudEE6IFB1YmxpY0tleSxcbiAgICB1c2VyQWNjb3VudEI6IFB1YmxpY0tleSxcbiAgICBwb29sVG9rZW5BY2NvdW50OiBQdWJsaWNLZXksXG4gICAgdG9rZW5BbW91bnRBOiBudW1iZXIsXG4gICAgdG9rZW5BbW91bnRCOiBudW1iZXIsXG4gICAgbWluaW11bVBvb2xUb2tlbkFtb3VudDogbnVtYmVyXG4gICk6IFRyYW5zYWN0aW9uIHtcbiAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKCkuYWRkKFxuICAgICAgaW5zdHJ1Y3Rpb25zLmRlcG9zaXRJbnN0cnVjdGlvbihcbiAgICAgICAgdGhpcy5zdGFibGVTd2FwLFxuICAgICAgICB0aGlzLmF1dGhvcml0eSxcbiAgICAgICAgdXNlckFjY291bnRBLFxuICAgICAgICB1c2VyQWNjb3VudEIsXG4gICAgICAgIHRoaXMudG9rZW5BY2NvdW50QSxcbiAgICAgICAgdGhpcy50b2tlbkFjY291bnRCLFxuICAgICAgICB0aGlzLnBvb2xUb2tlbk1pbnQsXG4gICAgICAgIHBvb2xUb2tlbkFjY291bnQsXG4gICAgICAgIHRoaXMuc3dhcFByb2dyYW1JZCxcbiAgICAgICAgdGhpcy50b2tlblByb2dyYW1JZCxcbiAgICAgICAgdG9rZW5BbW91bnRBLFxuICAgICAgICB0b2tlbkFtb3VudEIsXG4gICAgICAgIG1pbmltdW1Qb29sVG9rZW5BbW91bnRcbiAgICAgIClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFdpdGhkcmF3IHRva2VucyBmcm9tIHRoZSBwb29sXG4gICAqIEBwYXJhbSB1c2VyQWNjb3VudEFcbiAgICogQHBhcmFtIHVzZXJBY2NvdW50QlxuICAgKiBAcGFyYW0gcG9vbEFjY291bnRcbiAgICogQHBhcmFtIHBvb2xUb2tlbkFtb3VudFxuICAgKiBAcGFyYW0gbWluaW11bVRva2VuQVxuICAgKiBAcGFyYW0gbWluaW11bVRva2VuQlxuICAgKi9cbiAgd2l0aGRyYXcoXG4gICAgdXNlckFjY291bnRBOiBQdWJsaWNLZXksXG4gICAgdXNlckFjY291bnRCOiBQdWJsaWNLZXksXG4gICAgcG9vbEFjY291bnQ6IFB1YmxpY0tleSxcbiAgICBwb29sVG9rZW5BbW91bnQ6IG51bWJlcixcbiAgICBtaW5pbXVtVG9rZW5BOiBudW1iZXIsXG4gICAgbWluaW11bVRva2VuQjogbnVtYmVyXG4gICk6IFRyYW5zYWN0aW9uIHtcbiAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKCkuYWRkKFxuICAgICAgaW5zdHJ1Y3Rpb25zLndpdGhkcmF3SW5zdHJ1Y3Rpb24oXG4gICAgICAgIHRoaXMuc3RhYmxlU3dhcCxcbiAgICAgICAgdGhpcy5hdXRob3JpdHksXG4gICAgICAgIHRoaXMucG9vbFRva2VuTWludCxcbiAgICAgICAgcG9vbEFjY291bnQsXG4gICAgICAgIHRoaXMudG9rZW5BY2NvdW50QSxcbiAgICAgICAgdGhpcy50b2tlbkFjY291bnRCLFxuICAgICAgICB1c2VyQWNjb3VudEEsXG4gICAgICAgIHVzZXJBY2NvdW50QixcbiAgICAgICAgdGhpcy5hZG1pbkZlZUFjY291bnRBLFxuICAgICAgICB0aGlzLmFkbWluRmVlQWNjb3VudEIsXG4gICAgICAgIHRoaXMuc3dhcFByb2dyYW1JZCxcbiAgICAgICAgdGhpcy50b2tlblByb2dyYW1JZCxcbiAgICAgICAgcG9vbFRva2VuQW1vdW50LFxuICAgICAgICBtaW5pbXVtVG9rZW5BLFxuICAgICAgICBtaW5pbXVtVG9rZW5CXG4gICAgICApXG4gICAgKTtcbiAgfVxufVxuIl19
