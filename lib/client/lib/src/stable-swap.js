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
        e_1,
        tokenA,
        tokenB,
        amountA,
        amountB,
        D,
        poolMint,
        poolSupply;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4, , 5]);
            return [
              4 /*yield*/,
              account_1.loadAccount(
                this.connection,
                this.tokenAccountA,
                this.tokenProgramId
              ),
            ];
          case 1:
            tokenAData = _a.sent();
            return [
              4 /*yield*/,
              account_1.loadAccount(
                this.connection,
                this.tokenAccountB,
                this.tokenProgramId
              ),
            ];
          case 2:
            tokenBData = _a.sent();
            return [
              4 /*yield*/,
              account_1.loadAccount(
                this.connection,
                this.poolTokenMint,
                this.tokenProgramId
              ),
            ];
          case 3:
            poolMintData = _a.sent();
            return [3 /*break*/, 5];
          case 4:
            e_1 = _a.sent();
            throw new Error(e_1);
          case 5:
            tokenA = spl_token_1.AccountLayout.decode(tokenAData);
            tokenB = spl_token_1.AccountLayout.decode(tokenBData);
            amountA = u64_1.NumberU64.fromBuffer(tokenA.amount);
            amountB = u64_1.NumberU64.fromBuffer(tokenB.amount);
            D = calculator_1.computeD(
              new bn_js_1.default(this.initialAmpFactor),
              amountA,
              amountB
            );
            poolMint = spl_token_1.MintLayout.decode(poolMintData);
            poolSupply = u64_1.NumberU64.fromBuffer(poolMint.supply);
            return [2 /*return*/, D.div(poolSupply).toNumber()];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhYmxlLXN3YXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3RhYmxlLXN3YXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBdUI7QUFFdkIsMkNBS3lCO0FBQ3pCLCtDQUE4RDtBQUU5RCx5Q0FBd0Q7QUFDeEQsK0JBQTRDO0FBQzVDLDJEQUErQztBQUMvQywrQ0FBbUM7QUFDbkMsMENBQTZDO0FBQzdDLGdEQUE2QztBQUM3QyxvRkFBZ0Y7QUFDaEYsa0NBQXVDO0FBRXZDOztHQUVHO0FBQ0g7SUEyRkU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bb0JHO0lBQ0gsb0JBQ0UsVUFBc0IsRUFDdEIsVUFBcUIsRUFDckIsYUFBd0IsRUFDeEIsY0FBeUIsRUFDekIsYUFBd0IsRUFDeEIsU0FBb0IsRUFDcEIsWUFBdUIsRUFDdkIsZ0JBQTJCLEVBQzNCLGdCQUEyQixFQUMzQixhQUF3QixFQUN4QixhQUF3QixFQUN4QixLQUFnQixFQUNoQixLQUFnQixFQUNoQixnQkFBd0IsRUFDeEIsZUFBdUIsRUFDdkIsa0JBQTBCLEVBQzFCLGlCQUF5QixFQUN6QixJQUF5QjtRQUF6QixxQkFBQSxFQUFBLE9BQWEsbUJBQVk7UUFFekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7UUFDbkMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDckMsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7UUFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDakMsSUFBSSxD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LEdBQUcsQ0FDMUIsWUFBWSxDQUFDLG1CQUFtQixDQUM5QixJQUFJLENBQUMsVUFBVSxFQUNmLElBQUksQ0FBQyxTQUFTLEVBQ2QsSUFBSSxDQUFDLGFBQWEsRUFDbEIsV0FBVyxFQUNYLElBQUksQ0FBQyxhQUFhLEVBQ2xCLElBQUksQ0FBQyxhQUFhLEVBQ2xCLFlBQVksRUFDWixZQUFZLEVBQ1osSUFBSSxDQUFDLGdCQUFnQixFQUNyQixJQUFJLENBQUMsZ0JBQWdCLEVBQ3JCLElBQUksQ0FBQyxhQUFhLEVBQ2xCLElBQUksQ0FBQyxjQUFjLEVBQ25CLGVBQWUsRUFDZixhQUFhLEVBQ2IsYUFBYSxDQUNkLENBQ0YsQ0FBQztJQUNKLENBQUM7SUFDSCxpQkFBQztBQUFELENBQUMsQUExZUQsSUEwZUM7QUExZVksZ0NBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQk4gZnJvbSBcImJuLmpzXCI7XG5pbXBvcnQgdHlwZSB7IENvbm5lY3Rpb24gfSBmcm9tIFwiQHNvbGFuYS93ZWIzLmpzXCI7XG5pbXBvcnQge1xuICBBY2NvdW50LFxuICBQdWJsaWNLZXksXG4gIFN5c3RlbVByb2dyYW0sXG4gIFRyYW5zYWN0aW9uLFxufSBmcm9tIFwiQHNvbGFuYS93ZWIzLmpzXCI7XG5pbXBvcnQgeyBBY2NvdW50TGF5b3V0LCBNaW50TGF5b3V0IH0gZnJvbSBcIkBzb2xhbmEvc3BsLXRva2VuXCI7XG5cbmltcG9ydCB7IFRPS0VOX1BST0dSQU1fSUQsIFpFUk9fVFMgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCB7IERFRkFVTFRfRkVFUywgRmVlcyB9IGZyb20gXCIuL2ZlZXNcIjtcbmltcG9ydCAqIGFzIGluc3RydWN0aW9ucyBmcm9tIFwiLi9pbnN0cnVjdGlvbnNcIjtcbmltcG9ydCAqIGFzIGxheW91dCBmcm9tIFwiLi9sYXlvdXRcIjtcbmltcG9ydCB7IGxvYWRBY2NvdW50IH0gZnJvbSBcIi4vdXRpbC9hY2NvdW50XCI7XG5pbXBvcnQgeyBjb21wdXRlRCB9IGZyb20gXCIuL3V0aWwvY2FsY3VsYXRvclwiO1xuaW1wb3J0IHsgc2VuZEFuZENvbmZpcm1UcmFuc2FjdGlvbiB9IGZyb20gXCIuL3V0aWwvc2VuZC1hbmQtY29uZmlybS10cmFuc2FjdGlvblwiO1xuaW1wb3J0IHsgTnVtYmVyVTY0IH0gZnJvbSBcIi4vdXRpbC91NjRcIjtcblxuLyoqXG4gKiBBIHByb2dyYW0gdG8gZXhjaGFuZ2UgdG9rZW5zIGFnYWluc3QgYSBwb29sIG9mIGxpcXVpZGl0eVxuICovXG5leHBvcnQgY2xhc3MgU3RhYmxlU3dhcCB7XG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29ubmVjdGlvbjogQ29ubmVjdGlvbjtcblxuICAvKipcbiAgICogUHJvZ3JhbSBJZGVudGlmaWVyIGZvciB0aGUgU3dhcCBwcm9ncmFtXG4gICAqL1xuICBzd2FwUHJvZ3JhbUlkOiBQdWJsaWNLZXk7XG5cbiAgLyoqXG4gICAqIFByb2dyYW0gSWRlbnRpZmllciBmb3IgdGhlIFRva2VuIHByb2dyYW1cbiAgICovXG4gIHRva2VuUHJvZ3JhbUlkOiBQdWJsaWNLZXk7XG5cbiAgLyoqXG4gICAqIFRoZSBwdWJsaWMga2V5IGlkZW50aWZ5aW5nIHRoaXMgc3dhcCBwcm9ncmFtXG4gICAqL1xuICBzdGFibGVTd2FwOiBQdWJsaWNLZXk7XG5cbiAgLyoqXG4gICAqIFRoZSBwdWJsaWMga2V5IGZvciB0aGUgbGlxdWlkaXR5IHBvb2wgdG9rZW4gbWludFxuICAgKi9cbiAgcG9vbFRva2VuTWludDogUHVibGljS2V5O1xuXG4gIC8qKlxuICAgKiBBdXRob3JpdHlcbiAgICovXG4gIGF1dGhvcml0eTogUHVibGljS2V5O1xuXG4gIC8qKlxuICAgKiBBZG1pbiBhY2NvdW50XG4gICAqL1xuICBhZG1pbkFjY291bnQ6IFB1YmxpY0tleTtcblxuICAvKipcbiAgICogQWRtaW4gZmVlIGFjY291bnQgZm9yIHRva2VuIEFcbiAgICovXG4gIGFkbWluRmVlQWNjb3VudEE6IFB1YmxpY0tleTtcblxuICAvKipcbiAgICogQWRtaW4gZmVlIGFjY291bnQgZm9yIHRva2VuIEJcbiAgICovXG4gIGFkbWluRmVlQWNjb3VudEI6IFB1YmxpY0tleTtcblxuICAvKipcbiAgICogVGhlIHB1YmxpYyBrZXkgZm9yIHRoZSBmaXJzdCB0b2tlbiBhY2NvdW50IG9mIHRoZSB0cmFkaW5nIHBhaXJcbiAgICovXG4gIHRva2VuQWNjb3VudEE6IFB1YmxpY0tleTtcblxuICAvKipcbiAgICogVGhlIHB1YmxpYyBrZXkgZm9yIHRoZSBzZWNvbmQgdG9rZW4gYWNjb3VudCBvZiB0aGUgdHJhZGluZyBwYWlyXG4gICAqL1xuICB0b2tlbkFjY291bnRCOiBQdWJsaWNLZXk7XG5cbiAgLyoqXG4gICAqIFRoZSBwdWJsaWMga2V5IGZvciB0aGUgbWludCBvZiB0aGUgZmlyc3QgdG9rZW4gYWNjb3VudCBvZiB0aGUgdHJhZGluZyBwYWlyXG4gICAqL1xuICBtaW50QTogUHVibGljS2V5O1xuXG4gIC8qKlxuICAgKiBUaGUgcHVibGljIGtleSBmb3IgdGhlIG1pbnQgb2YgdGhlIHNlY29uZCB0b2tlbiBhY2NvdW50IG9mIHRoZSB0cmFkaW5nIHBhaXJcbiAgICovXG4gIG1pbnRCOiBQdWJsaWNLZXk7XG5cbiAgLyoqXG4gICAqIEluaXRpYWwgYW1wbGlmaWNhdGlvbiBjb2VmZmljaWVudCAoQSlcbiAgICovXG4gIGluaXRpYWxBbXBGYWN0b3I6IG51bWJlcjtcblxuICAvKipcbiAgICogVGFyZ2V0IGFtcGxpZmljYXRpb24gY29lZmZpY2llbnQgKEEpXG4gICAqL1xuICB0YXJnZXRBbXBGYWN0b3I6IG51bWJlcjtcblxuICAvKipcbiAgICogUmFtcCBBIHN0YXJ0IHRpbWVzdGFtcFxuICAgKi9cbiAgc3RhcnRSYW1wVGltZXN0YW1wOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFJhbXAgQSBzdGFydCB0aW1lc3RhbXBcbiAgICovXG4gIHN0b3BSYW1wVGltZXN0YW1wOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEZlZXNcbiAgICovXG4gIGZlZXM6IEZlZXM7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBuZXcgU3RhYmxlU3dhcCBjbGllbnQgb2JqZWN0XG4gICAqIEBwYXJhbSBjb25uZWN0aW9uXG4gICAqIEBwYXJhbSBzdGFibGVTd2FwXG4gICAqIEBwYXJhbSBzd2FwUHJvZ3JhbUlkXG4gICAqIEBwYXJhbSB0b2tlblByb2dyYW1JZFxuICAgKiBAcGFyYW0gcG9vbFRva2VuTWludFxuICAgKiBAcGFyYW0gYXV0aG9yaXR5XG4gICAqIEBwYXJhbSBhZG1pbkFjY291bnRcbiAgICogQHBhcmFtIGFkbWluRmVlQWNjb3VudEFcbiAgICogQHBhcmFtIGFkbWluRmVlQWNjb3VudEJcbiAgICogQHBhcmFtIHRva2VuQWNjb3VudEFcbiAgICogQHBhcmFtIHRva2VuQWNjb3VudEJcbiAgICogQHBhcmFtIG1pbnRBXG4gICAqIEBwYXJhbSBtaW50QlxuICAgKiBAcGFyYW0gaW5pdGlhbEFtcEZhY3RvclxuICAgKiBAcGFyYW0gdGFyZ2V0QW1wRmFjdG9yXG4gICAqIEBwYXJhbSBzdGFydFJhbXBUaW1lc3RhbXBcbiAgICogQHBhcmFtIHN0b3BSYW1wVGltZVN0YW1wXG4gICAqIEBwYXJhbSBmZWVzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBjb25uZWN0aW9uOiBDb25uZWN0aW9uLFxuICAgIHN0YWJsZVN3YXA6IFB1YmxpY0tleSxcbiAgICBzd2FwUHJvZ3JhbUlkOiBQdWJsaWNLZXksXG4gICAgdG9rZW5Qcm9ncmFtSWQ6IFB1YmxpY0tleSxcbiAgICBwb29sVG9rZW5NaW50OiBQdWJsaWNLZXksXG4gICAgYXV0aG9yaXR5OiBQdWJsaWNLZXksXG4gICAgYWRtaW5BY2NvdW50OiBQdWJsaWNLZXksXG4gICAgYWRtaW5GZWVBY2NvdW50QTogUHVibGljS2V5LFxuICAgIGFkbWluRmVlQWNjb3VudEI6IFB1YmxpY0tleSxcbiAgICB0b2tlbkFjY291bnRBOiBQdWJsaWNLZXksXG4gICAgdG9rZW5BY2NvdW50QjogUHVibGljS2V5LFxuICAgIG1pbnRBOiBQdWJsaWNLZXksXG4gICAgbWludEI6IFB1YmxpY0tleSxcbiAgICBpbml0aWFsQW1wRmFjdG9yOiBudW1iZXIsXG4gICAgdGFyZ2V0QW1wRmFjdG9yOiBudW1iZXIsXG4gICAgc3RhcnRSYW1wVGltZXN0YW1wOiBudW1iZXIsXG4gICAgc3RvcFJhbXBUaW1lU3RhbXA6IG51bWJlcixcbiAgICBmZWVzOiBGZWVzID0gREVGQVVMVF9GRUVTXG4gICkge1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgdGhpcy5zdGFibGVTd2FwID0gc3RhYmxlU3dhcDtcbiAgICB0aGlzLnN3YXBQcm9ncmFtSWQgPSBzd2FwUHJvZ3JhbUlkO1xuICAgIHRoaXMudG9rZW5Qcm9ncmFtSWQgPSB0b2tlblByb2dyYW1JZDtcbiAgICB0aGlzLnBvb2xUb2tlbk1pbnQgPSBwb29sVG9rZW5NaW50O1xuICAgIHRoaXMuYXV0aG9yaXR5ID0gYXV0aG9yaXR5O1xuICAgIHRoaXMuYWRtaW5BY2NvdW50ID0gYWRtaW5BY2NvdW50O1xuICAgIHRoaXMuYWRtaW5GZWVBY2NvdW50QSA9IGFkbWluRmVlQWNjb3VudEE7XG4gICAgdGhpcy5hZG1pbkZlZUFjY291bnRCID0gYWRtaW5GZWVBY2NvdW50QjtcbiAgICB0aGlzLnRva2VuQWNjb3VudEEgPSB0b2tlbkFjY291bnRBO1xuICAgIHRoaXMudG9rZW5BY2NvdW50QiA9IHRva2VuQWNjb3VudEI7XG4gICAgdGhpcy5taW50QSA9IG1pbnRBO1xuICAgIHRoaXMubWludEIgPSBtaW50QjtcbiAgICB0aGlzLmluaXRpYWxBbXBGYWN0b3IgPSBpbml0aWFsQW1wRmFjdG9yO1xuICAgIHRoaXMudGFyZ2V0QW1wRmFjdG9yID0gdGFyZ2V0QW1wRmFjdG9yO1xuICAgIHRoaXMuc3RhcnRSYW1wVGltZXN0YW1wID0gc3RhcnRSYW1wVGltZXN0YW1wO1xuICAgIHRoaXMuc3RvcFJhbXBUaW1lc3RhbXAgPSBzdG9wUmFtcFRpbWVTdGFtcDtcbiAgICB0aGlzLmZlZXMgPSBmZWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWluaW11bSBiYWxhbmNlIGZvciB0aGUgdG9rZW4gc3dhcCBhY2NvdW50IHRvIGJlIHJlbnQgZXhlbXB0XG4gICAqXG4gICAqIEByZXR1cm4gTnVtYmVyIG9mIGxhbXBvcnRzIHJlcXVpcmVkXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0TWluQmFsYW5jZVJlbnRGb3JFeGVtcHRTdGFibGVTd2FwKFxuICAgIGNvbm5lY3Rpb246IENvbm5lY3Rpb25cbiAgKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gYXdhaXQgY29ubmVjdGlvbi5nZXRNaW5pbXVtQmFsYW5jZUZvclJlbnRFeGVtcHRpb24oXG4gICAgICBsYXlvdXQuU3RhYmxlU3dhcExheW91dC5zcGFuXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIGFuIG9uY2hhaW4gU3RhYmxlU3dhcCBwcm9ncmFtXG4gICAqIEBwYXJhbSBjb25uZWN0aW9uIFRoZSBjb25uZWN0aW9uIHRvIHVzZVxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgcHVibGljIGtleSBvZiB0aGUgYWNjb3VudCB0byBsb2FkXG4gICAqIEBwYXJhbSBwcm9ncmFtSWQgQWRkcmVzcyBvZiB0aGUgb25jaGFpbiBTdGFibGVTd2FwIHByb2dyYW1cbiAgICogQHBhcmFtIHBheWVyIFBheXMgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRTdGFibGVTd2FwKFxuICAgIGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXG4gICAgYWRkcmVzczogUHVibGljS2V5LFxuICAgIHByb2dyYW1JZDogUHVibGljS2V5XG4gICk6IFByb21pc2U8U3RhYmxlU3dhcD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBsb2FkQWNjb3VudChjb25uZWN0aW9uLCBhZGRyZXNzLCBwcm9ncmFtSWQpO1xuICAgIGNvbnN0IHN0YWJsZVN3YXBEYXRhID0gbGF5b3V0LlN0YWJsZVN3YXBMYXlvdXQuZGVjb2RlKGRhdGEpO1xuICAgIGlmICghc3RhYmxlU3dhcERhdGEuaXNJbml0aWFsaXplZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHRva2VuIHN3YXAgc3RhdGVgKTtcbiAgICB9XG5cbiAgICBjb25zdCBbYXV0aG9yaXR5XSA9IGF3YWl0IFB1YmxpY0tleS5maW5kUHJvZ3JhbUFkZHJlc3MoXG4gICAgICBbYWRkcmVzcy50b0J1ZmZlcigpXSxcbiAgICAgIHByb2dyYW1JZFxuICAgICk7XG4gICAgY29uc3QgYWRtaW5BY2NvdW50ID0gbmV3IFB1YmxpY0tleShzdGFibGVTd2FwRGF0YS5hZG1pbkFjY291bnQpO1xuICAgIGNvbnN0IGFkbWluRmVlQWNjb3VudEEgPSBuZXcgUHVibGljS2V5KHN0YWJsZVN3YXBEYXRhLmFkbWluRmVlQWNjb3VudEEpO1xuICAgIGNvbnN0IGFkbWluRmVlQWNjb3VudEIgPSBuZXcgUHVibGljS2V5KHN0YWJsZVN3YXBEYXRhLmFkbWluRmVlQWNjb3VudEIpO1xuICAgIGNvbnN0IHRva2VuQWNjb3VudEEgPSBuZXcgUHVibGljS2V5KHN0YWJsZVN3YXBEYXRhLnRva2VuQWNjb3VudEEpO1xuICAgIGNvbnN0IHRva2VuQWNjb3VudEIgPSBuZXcgUHVibGljS2V5KHN0YWJsZVN3YXBEYXRhLnRva2VuQWNjb3VudEIpO1xuICAgIGNvbnN0IHBvb2xUb2tlbk1pbnQgPSBuZXcgUHVibGljS2V5KHN0YWJsZVN3YXBEYXRhLnRva2VuUG9vbCk7XG4gICAgY29uc3QgbWludEEgPSBuZXcgUHVibGljS2V5KHN0YWJsZVN3YXBEYXRhLm1pbnRBKTtcbiAgICBjb25zdCBtaW50QiA9IG5ldyBQdWJsaWNLZXkoc3RhYmxlU3dhcERhdGEubWludEIpO1xuICAgIGNvbnN0IHRva2VuUHJvZ3JhbUlkID0gVE9LRU5fUFJPR1JBTV9JRDtcbiAgICBjb25zdCBpbml0aWFsQW1wRmFjdG9yID0gc3RhYmxlU3dhcERhdGEuaW5pdGlhbEFtcEZhY3RvcjtcbiAgICBjb25zdCB0YXJnZXRBbXBGYWN0b3IgPSBzdGFibGVTd2FwRGF0YS50YXJnZXRBbXBGYWN0b3I7XG4gICAgY29uc3Qgc3RhcnRSYW1wVGltZXN0YW1wID0gc3RhYmxlU3dhcERhdGEuc3RhcnRSYW1wVHM7XG4gICAgY29uc3Qgc3RvcFJhbXBUaW1lU3RhbXAgPSBzdGFibGVTd2FwRGF0YS5zdG9wUmFtcFRzO1xuICAgIGNvbnN0IGZlZXMgPSB7XG4gICAgICBhZG1pblRyYWRlRmVlTnVtZXJhdG9yOiBzdGFibGVTd2FwRGF0YS5hZG1pblRyYWRlRmVlTnVtZXJhdG9yIGFzIG51bWJlcixcbiAgICAgIGFkbWluVHJhZGVGZWVEZW5vbWluYXRvcjogc3RhYmxlU3dhcERhdGEuYWRtaW5UcmFkZUZlZURlbm9taW5hdG9yIGFzIG51bWJlcixcbiAgICAgIGFkbWluV2l0aGRyYXdGZWVOdW1lcmF0b3I6IHN0YWJsZVN3YXBEYXRhLmFkbWluV2l0aGRyYXdGZWVOdW1lcmF0b3IgYXMgbnVtYmVyLFxuICAgICAgYWRtaW5XaXRoZHJhd0ZlZURlbm9taW5hdG9yOiBzdGFibGVTd2FwRGF0YS5hZG1pbldpdGhkcmF3RmVlRGVub21pbmF0b3IgYXMgbnVtYmVyLFxuICAgICAgdHJhZGVGZWVOdW1lcmF0b3I6IHN0YWJsZVN3YXBEYXRhLnRyYWRlRmVlTnVtZXJhdG9yIGFzIG51bWJlcixcbiAgICAgIHRyYWRlRmVlRGVub21pbmF0b3I6IHN0YWJsZVN3YXBEYXRhLnRyYWRlRmVlRGVub21pbmF0b3IgYXMgbnVtYmVyLFxuICAgICAgd2l0aGRyYXdGZWVOdW1lcmF0b3I6IHN0YWJsZVN3YXBEYXRhLndpdGhkcmF3RmVlTnVtZXJhdG9yIGFzIG51bWJlcixcbiAgICAgIHdpdGhkcmF3RmVlRGVub21pbmF0b3I6IHN0YWJsZVN3YXBEYXRhLndpdGhkcmF3RmVlRGVub21pbmF0b3IgYXMgbnVtYmVyLFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IFN0YWJsZVN3YXAoXG4gICAgICBjb25uZWN0aW9uLFxuICAgICAgYWRkcmVzcyxcbiAgICAgIHByb2dyYW1JZCxcbiAgICAgIHRva2VuUHJvZ3JhbUlkLFxuICAgICAgcG9vbFRva2VuTWludCxcbiAgICAgIGF1dGhvcml0eSxcbiAgICAgIGFkbWluQWNjb3VudCxcbiAgICAgIGFkbWluRmVlQWNjb3VudEEsXG4gICAgICBhZG1pbkZlZUFjY291bnRCLFxuICAgICAgdG9rZW5BY2NvdW50QSxcbiAgICAgIHRva2VuQWNjb3VudEIsXG4gICAgICBtaW50QSxcbiAgICAgIG1pbnRCLFxuICAgICAgaW5pdGlhbEFtcEZhY3RvcixcbiAgICAgIHRhcmdldEFtcEZhY3RvcixcbiAgICAgIHN0YXJ0UmFtcFRpbWVzdGFtcCxcbiAgICAgIHN0b3BSYW1wVGltZVN0YW1wLFxuICAgICAgZmVlc1xuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IgZm9yIG5ldyBTdGFibGVTd2FwIGNsaWVudCBvYmplY3RcbiAgICogQHBhcmFtIGNvbm5lY3Rpb25cbiAgICogQHBhcmFtIHBheWVyXG4gICAqIEBwYXJhbSBzdGFibGVTd2FwQWNjb3VudFxuICAgKiBAcGFyYW0gYXV0aG9yaXR5XG4gICAqIEBwYXJhbSBhZG1pbkFjY291bnRcbiAgICogQHBhcmFtIGFkbWluRmVlQWNjb3VudEFcbiAgICogQHBhcmFtIGFkbWluRmVlQWNjb3VudEJcbiAgICogQHBhcmFtIHRva2VuQWNjb3VudEFcbiAgICogQHBhcmFtIHRva2VuQWNjb3VudEJcbiAgICogQHBhcmFtIHBvb2xUb2tlbk1pbnRcbiAgICogQHBhcmFtIHBvb2xUb2tlbkFjY291bnRcbiAgICogQHBhcmFtIG1pbnRBXG4gICAqIEBwYXJhbSBtaW50QlxuICAgKiBAcGFyYW0gc3dhcFByb2dyYW1JZFxuICAgKiBAcGFyYW0gdG9rZW5Qcm9ncmFtSWRcbiAgICogQHBhcmFtIG5vbmNlXG4gICAqIEBwYXJhbSBhbXBGYWN0b3JcbiAgICogQHBhcmFtIGZlZXNcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVTdGFibGVTd2FwKFxuICAgIGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXG4gICAgcGF5ZXI6IEFjY291bnQsXG4gICAgc3RhYmxlU3dhcEFjY291bnQ6IEFjY291bnQsXG4gICAgYXV0aG9yaXR5OiBQdWJsaWNLZXksXG4gICAgYWRtaW5BY2NvdW50OiBQdWJsaWNLZXksXG4gICAgYWRtaW5GZWVBY2NvdW50QTogUHVibGljS2V5LFxuICAgIGFkbWluRmVlQWNjb3VudEI6IFB1YmxpY0tleSxcbiAgICB0b2tlbk1pbnRBOiBQdWJsaWNLZXksXG4gICAgdG9rZW5BY2NvdW50QTogUHVibGljS2V5LFxuICAgIHRva2VuTWludEI6IFB1YmxpY0tleSxcbiAgICB0b2tlbkFjY291bnRCOiBQdWJsaWNLZXksXG4gICAgcG9vbFRva2VuTWludDogUHVibGljS2V5LFxuICAgIHBvb2xUb2tlbkFjY291bnQ6IFB1YmxpY0tleSxcbiAgICBtaW50QTogUHVibGljS2V5LFxuICAgIG1pbnRCOiBQdWJsaWNLZXksXG4gICAgc3dhcFByb2dyYW1JZDogUHVibGljS2V5LFxuICAgIHRva2VuUHJvZ3JhbUlkOiBQdWJsaWNLZXksXG4gICAgbm9uY2U6IG51bWJlcixcbiAgICBhbXBGYWN0b3I6IG51bWJlcixcbiAgICBmZWVzOiBGZWVzID0gREVGQVVMVF9GRUVTXG4gICk6IFByb21pc2U8U3RhYmxlU3dhcD4ge1xuICAgIC8vIEFsbG9jYXRlIG1lbW9yeSBmb3IgdGhlIGFjY291bnRcbiAgICBjb25zdCBiYWxhbmNlTmVlZGVkID0gYXdhaXQgU3RhYmxlU3dhcC5nZXRNaW5CYWxhbmNlUmVudEZvckV4ZW1wdFN0YWJsZVN3YXAoXG4gICAgICBjb25uZWN0aW9uXG4gICAgKTtcbiAgICBjb25zdCB0cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbigpLmFkZChcbiAgICAgIFN5c3RlbVByb2dyYW0uY3JlYXRlQWNjb3VudCh7XG4gICAgICAgIGZyb21QdWJrZXk6IHBheWVyLnB1YmxpY0tleSxcbiAgICAgICAgbmV3QWNjb3VudFB1YmtleTogc3RhYmxlU3dhcEFjY291bnQucHVibGljS2V5LFxuICAgICAgICBsYW1wb3J0czogYmFsYW5jZU5lZWRlZCxcbiAgICAgICAgc3BhY2U6IGxheW91dC5TdGFibGVTd2FwTGF5b3V0LnNwYW4sXG4gICAgICAgIHByb2dyYW1JZDogc3dhcFByb2dyYW1JZCxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGNvbnN0IGluc3RydWN0aW9uID0gaW5zdHJ1Y3Rpb25zLmNyZWF0ZUluaXRTd2FwSW5zdHJ1Y3Rpb24oXG4gICAgICBzdGFibGVTd2FwQWNjb3VudCxcbiAgICAgIGF1dGhvcml0eSxcbiAgICAgIGFkbWluQWNjb3VudCxcbiAgICAgIGFkbWluRmVlQWNjb3VudEEsXG4gICAgICBhZG1pbkZlZUFjY291bnRCLFxuICAgICAgdG9rZW5NaW50QSxcbiAgICAgIHRva2VuQWNjb3VudEEsXG4gICAgICB0b2tlbk1pbnRCLFxuICAgICAgdG9rZW5BY2NvdW50QixcbiAgICAgIHBvb2xUb2tlbk1pbnQsXG4gICAgICBwb29sVG9rZW5BY2NvdW50LFxuICAgICAgc3dhcFByb2dyYW1JZCxcbiAgICAgIHRva2VuUHJvZ3JhbUlkLFxuICAgICAgbm9uY2UsXG4gICAgICBhbXBGYWN0b3IsXG4gICAgICBmZWVzXG4gICAgKTtcbiAgICB0cmFuc2FjdGlvbi5hZGQoaW5zdHJ1Y3Rpb24pO1xuXG4gICAgYXdhaXQgc2VuZEFuZENvbmZpcm1UcmFuc2FjdGlvbihcbiAgICAgIFwiY3JlYXRlQWNjb3VudCBhbmQgSW5pdGlhbGl6ZVN3YXBcIixcbiAgICAgIGNvbm5lY3Rpb24sXG4gICAgICB0cmFuc2FjdGlvbixcbiAgICAgIHBheWVyLFxuICAgICAgc3RhYmxlU3dhcEFjY291bnRcbiAgICApO1xuXG4gICAgcmV0dXJuIG5ldyBTdGFibGVTd2FwKFxuICAgICAgY29ubmVjdGlvbixcbiAgICAgIHN0YWJsZVN3YXBBY2NvdW50LnB1YmxpY0tleSxcbiAgICAgIHN3YXBQcm9ncmFtSWQsXG4gICAgICB0b2tlblByb2dyYW1JZCxcbiAgICAgIHBvb2xUb2tlbk1pbnQsXG4gICAgICBhdXRob3JpdHksXG4gICAgICBhZG1pbkFjY291bnQsXG4gICAgICBhZG1pbkZlZUFjY291bnRBLFxuICAgICAgYWRtaW5GZWVBY2NvdW50QixcbiAgICAgIHRva2VuQWNjb3VudEEsXG4gICAgICB0b2tlbkFjY291bnRCLFxuICAgICAgbWludEEsXG4gICAgICBtaW50QixcbiAgICAgIGFtcEZhY3RvcixcbiAgICAgIGFtcEZhY3RvcixcbiAgICAgIFpFUk9fVFMsXG4gICAgICBaRVJPX1RTLFxuICAgICAgZmVlc1xuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB2aXJ0dWFsIHByaWNlIG9mIHRoZSBwb29sLlxuICAgKi9cbiAgYXN5bmMgZ2V0VmlydHVhbFByaWNlKCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHRva2VuQURhdGE7XG4gICAgbGV0IHRva2VuQkRhdGE7XG4gICAgbGV0IHBvb2xNaW50RGF0YTtcbiAgICB0cnkge1xuICAgICAgdG9rZW5BRGF0YSA9IGF3YWl0IGxvYWRBY2NvdW50KFxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24sXG4gICAgICAgIHRoaXMudG9rZW5BY2NvdW50QSxcbiAgICAgICAgdGhpcy50b2tlblByb2dyYW1JZFxuICAgICAgKTtcbiAgICAgIHRva2VuQkRhdGEgPSBhd2FpdCBsb2FkQWNjb3VudChcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLFxuICAgICAgICB0aGlzLnRva2VuQWNjb3VudEIsXG4gICAgICAgIHRoaXMudG9rZW5Qcm9ncmFtSWRcbiAgICAgICk7XG4gICAgICBwb29sTWludERhdGEgPSBhd2FpdCBsb2FkQWNjb3VudChcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLFxuICAgICAgICB0aGlzLnBvb2xUb2tlbk1pbnQsXG4gICAgICAgIHRoaXMudG9rZW5Qcm9ncmFtSWRcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xuICAgIH1cblxuICAgIGNvbnN0IHRva2VuQSA9IEFjY291bnRMYXlvdXQuZGVjb2RlKHRva2VuQURhdGEpO1xuICAgIGNvbnN0IHRva2VuQiA9IEFjY291bnRMYXlvdXQuZGVjb2RlKHRva2VuQkRhdGEpO1xuICAgIGNvbnN0IGFtb3VudEEgPSBOdW1iZXJVNjQuZnJvbUJ1ZmZlcih0b2tlbkEuYW1vdW50KTtcbiAgICBjb25zdCBhbW91bnRCID0gTnVtYmVyVTY0LmZyb21CdWZmZXIodG9rZW5CLmFtb3VudCk7XG4gICAgY29uc3QgRCA9IGNvbXB1dGVEKG5ldyBCTih0aGlzLmluaXRpYWxBbXBGYWN0b3IpLCBhbW91bnRBLCBhbW91bnRCKTtcblxuICAgIGNvbnN0IHBvb2xNaW50ID0gTWludExheW91dC5kZWNvZGUocG9vbE1pbnREYXRhKTtcbiAgICBjb25zdCBwb29sU3VwcGx5ID0gTnVtYmVyVTY0LmZyb21CdWZmZXIocG9vbE1pbnQuc3VwcGx5KTtcblxuICAgIHJldHVybiBELmRpdihwb29sU3VwcGx5KS50b051bWJlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN3YXAgdG9rZW4gQSBmb3IgdG9rZW4gQlxuICAgKiBAcGFyYW0gdXNlclNvdXJjZVxuICAgKiBAcGFyYW0gcG9vbFNvdXJjZVxuICAgKiBAcGFyYW0gcG9vbERlc3RpbmF0aW9uXG4gICAqIEBwYXJhbSB1c2VyRGVzdGluYXRpb25cbiAgICogQHBhcmFtIGFtb3VudEluXG4gICAqIEBwYXJhbSBtaW5pbXVtQW1vdW50T3V0XG4gICAqL1xuICBzd2FwKFxuICAgIHVzZXJTb3VyY2U6IFB1YmxpY0tleSxcbiAgICBwb29sU291cmNlOiBQdWJsaWNLZXksXG4gICAgcG9vbERlc3RpbmF0aW9uOiBQdWJsaWNLZXksXG4gICAgdXNlckRlc3RpbmF0aW9uOiBQdWJsaWNLZXksXG4gICAgYW1vdW50SW46IG51bWJlcixcbiAgICBtaW5pbXVtQW1vdW50T3V0OiBudW1iZXJcbiAgKTogVHJhbnNhY3Rpb24ge1xuICAgIGNvbnN0IGFkbWluRGVzdGluYXRpb24gPVxuICAgICAgcG9vbERlc3RpbmF0aW9uID09PSB0aGlzLnRva2VuQWNjb3VudEFcbiAgICAgICAgPyB0aGlzLmFkbWluRmVlQWNjb3VudEFcbiAgICAgICAgOiB0aGlzLmFkbWluRmVlQWNjb3VudEI7XG4gICAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbigpLmFkZChcbiAgICAgIGluc3RydWN0aW9ucy5zd2FwSW5zdHJ1Y3Rpb24oXG4gICAgICAgIHRoaXMuc3RhYmxlU3dhcCxcbiAgICAgICAgdGhpcy5hdXRob3JpdHksXG4gICAgICAgIHVzZXJTb3VyY2UsXG4gICAgICAgIHBvb2xTb3VyY2UsXG4gICAgICAgIHBvb2xEZXN0aW5hdGlvbixcbiAgICAgICAgdXNlckRlc3RpbmF0aW9uLFxuICAgICAgICBhZG1pbkRlc3RpbmF0aW9uLFxuICAgICAgICB0aGlzLnN3YXBQcm9ncmFtSWQsXG4gICAgICAgIHRoaXMudG9rZW5Qcm9ncmFtSWQsXG4gICAgICAgIGFtb3VudEluLFxuICAgICAgICBtaW5pbXVtQW1vdW50T3V0XG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXBvc2l0IHRva2VucyBpbnRvIHRoZSBwb29sXG4gICAqIEBwYXJhbSB1c2VyQWNjb3VudEFcbiAgICogQHBhcmFtIHVzZXJBY2NvdW50QlxuICAgKiBAcGFyYW0gcG9vbEFjY291bnRcbiAgICogQHBhcmFtIHRva2VuQW1vdW50QVxuICAgKiBAcGFyYW0gdG9rZW5BbW91bnRCXG4gICAqIEBwYXJhbSBtaW5pbXVtUG9vbFRva2VuQW1vdW50XG4gICAqL1xuICBkZXBvc2l0KFxuICAgIHVzZXJBY2NvdW50QTogUHVibGljS2V5LFxuICAgIHVzZXJBY2NvdW50QjogUHVibGljS2V5LFxuICAgIHBvb2xUb2tlbkFjY291bnQ6IFB1YmxpY0tleSxcbiAgICB0b2tlbkFtb3VudEE6IG51bWJlcixcbiAgICB0b2tlbkFtb3VudEI6IG51bWJlcixcbiAgICBtaW5pbXVtUG9vbFRva2VuQW1vdW50OiBudW1iZXJcbiAgKTogVHJhbnNhY3Rpb24ge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgICBpbnN0cnVjdGlvbnMuZGVwb3NpdEluc3RydWN0aW9uKFxuICAgICAgICB0aGlzLnN0YWJsZVN3YXAsXG4gICAgICAgIHRoaXMuYXV0aG9yaXR5LFxuICAgICAgICB1c2VyQWNjb3VudEEsXG4gICAgICAgIHVzZXJBY2NvdW50QixcbiAgICAgICAgdGhpcy50b2tlbkFjY291bnRBLFxuICAgICAgICB0aGlzLnRva2VuQWNjb3VudEIsXG4gICAgICAgIHRoaXMucG9vbFRva2VuTWludCxcbiAgICAgICAgcG9vbFRva2VuQWNjb3VudCxcbiAgICAgICAgdGhpcy5zd2FwUHJvZ3JhbUlkLFxuICAgICAgICB0aGlzLnRva2VuUHJvZ3JhbUlkLFxuICAgICAgICB0b2tlbkFtb3VudEEsXG4gICAgICAgIHRva2VuQW1vdW50QixcbiAgICAgICAgbWluaW11bVBvb2xUb2tlbkFtb3VudFxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogV2l0aGRyYXcgdG9rZW5zIGZyb20gdGhlIHBvb2xcbiAgICogQHBhcmFtIHVzZXJBY2NvdW50QVxuICAgKiBAcGFyYW0gdXNlckFjY291bnRCXG4gICAqIEBwYXJhbSBwb29sQWNjb3VudFxuICAgKiBAcGFyYW0gcG9vbFRva2VuQW1vdW50XG4gICAqIEBwYXJhbSBtaW5pbXVtVG9rZW5BXG4gICAqIEBwYXJhbSBtaW5pbXVtVG9rZW5CXG4gICAqL1xuICB3aXRoZHJhdyhcbiAgICB1c2VyQWNjb3VudEE6IFB1YmxpY0tleSxcbiAgICB1c2VyQWNjb3VudEI6IFB1YmxpY0tleSxcbiAgICBwb29sQWNjb3VudDogUHVibGljS2V5LFxuICAgIHBvb2xUb2tlbkFtb3VudDogbnVtYmVyLFxuICAgIG1pbmltdW1Ub2tlbkE6IG51bWJlcixcbiAgICBtaW5pbXVtVG9rZW5COiBudW1iZXJcbiAgKTogVHJhbnNhY3Rpb24ge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgICBpbnN0cnVjdGlvbnMud2l0aGRyYXdJbnN0cnVjdGlvbihcbiAgICAgICAgdGhpcy5zdGFibGVTd2FwLFxuICAgICAgICB0aGlzLmF1dGhvcml0eSxcbiAgICAgICAgdGhpcy5wb29sVG9rZW5NaW50LFxuICAgICAgICBwb29sQWNjb3VudCxcbiAgICAgICAgdGhpcy50b2tlbkFjY291bnRBLFxuICAgICAgICB0aGlzLnRva2VuQWNjb3VudEIsXG4gICAgICAgIHVzZXJBY2NvdW50QSxcbiAgICAgICAgdXNlckFjY291bnRCLFxuICAgICAgICB0aGlzLmFkbWluRmVlQWNjb3VudEEsXG4gICAgICAgIHRoaXMuYWRtaW5GZWVBY2NvdW50QixcbiAgICAgICAgdGhpcy5zd2FwUHJvZ3JhbUlkLFxuICAgICAgICB0aGlzLnRva2VuUHJvZ3JhbUlkLFxuICAgICAgICBwb29sVG9rZW5BbW91bnQsXG4gICAgICAgIG1pbmltdW1Ub2tlbkEsXG4gICAgICAgIG1pbmltdW1Ub2tlbkJcbiAgICAgIClcbiAgICApO1xuICB9XG59XG4iXX0=
