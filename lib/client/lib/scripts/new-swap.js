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
var web3_js_1 = require("@solana/web3.js");
var spl_token_1 = require("@solana/spl-token");
var src_1 = require("../src");
var constants_1 = require("../src/constants");
var helpers_1 = require("../test/helpers");
var AMP_FACTOR = 100;
var INITIAL_TOKEN_A_AMOUNT =
  1000000 * Math.pow(10, constants_1.DEFAULT_TOKEN_DECIMALS);
var INITIAL_TOKEN_B_AMOUNT =
  1000000 * Math.pow(10, constants_1.DEFAULT_TOKEN_DECIMALS);
var run = function () {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a,
      clusterUrl,
      stableSwapProgramId,
      connection,
      payer,
      owner,
      stableSwapAccount,
      _b,
      authority,
      nonce,
      tokenPool,
      userPoolAccount,
      mintA,
      adminAccountA,
      tokenAccountA,
      mintB,
      adminAccountB,
      tokenAccountB,
      newSwap;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          (_a = helpers_1.getDeploymentInfo()),
            (clusterUrl = _a.clusterUrl),
            (stableSwapProgramId = _a.stableSwapProgramId);
          connection = new web3_js_1.Connection(clusterUrl);
          console.log("Requesting airdrop ...");
          return [
            4 /*yield*/,
            helpers_1.newAccountWithLamports(
              connection,
              web3_js_1.LAMPORTS_PER_SOL
            ),
          ];
        case 1:
          payer = _c.sent();
          return [
            4 /*yield*/,
            helpers_1.newAccountWithLamports(
              connection,
              web3_js_1.LAMPORTS_PER_SOL
            ),
          ];
        case 2:
          owner = _c.sent();
          stableSwapAccount = new web3_js_1.Account();
          return [
            4 /*yield*/,
            web3_js_1.PublicKey.findProgramAddress(
              [stableSwapAccount.publicKey.toBuffer()],
              stableSwapProgramId
            ),
          ];
        case 3:
          (_b = __read.apply(void 0, [_c.sent(), 2])),
            (authority = _b[0]),
            (nonce = _b[1]);
          console.log("Creating pool mint ...");
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
        case 4:
          tokenPool = _c.sent();
          return [4 /*yield*/, tokenPool.createAccount(owner.publicKey)];
        case 5:
          userPoolAccount = _c.sent();
          console.log("Creating TokenA mint ...");
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
        case 6:
          mintA = _c.sent();
          console.log("Creating TokenA accounts ...");
          return [4 /*yield*/, mintA.createAccount(owner.publicKey)];
        case 7:
          adminAccountA = _c.sent();
          return [4 /*yield*/, mintA.createAccount(authority)];
        case 8:
          tokenAccountA = _c.sent();
          return [
            4 /*yield*/,
            mintA.mintTo(tokenAccountA, owner, [], INITIAL_TOKEN_A_AMOUNT),
          ];
        case 9:
          _c.sent();
          console.log("Creating TokenA accounts ...");
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
        case 10:
          mintB = _c.sent();
          console.log("Creating TokenB accounts ...");
          return [4 /*yield*/, mintB.createAccount(owner.publicKey)];
        case 11:
          adminAccountB = _c.sent();
          return [4 /*yield*/, mintB.createAccount(authority)];
        case 12:
          tokenAccountB = _c.sent();
          return [
            4 /*yield*/,
            mintB.mintTo(tokenAccountB, owner, [], INITIAL_TOKEN_B_AMOUNT),
          ];
        case 13:
          _c.sent();
          // Sleep to make sure token accounts are created ...
          return [4 /*yield*/, helpers_1.sleep(500)];
        case 14:
          // Sleep to make sure token accounts are created ...
          _c.sent();
          console.log("Creating new swap ...");
          return [
            4 /*yield*/,
            src_1.StableSwap.createStableSwap(
              connection,
              payer,
              stableSwapAccount,
              authority,
              owner.publicKey,
              adminAccountA,
              adminAccountB,
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
              AMP_FACTOR
            ),
          ];
        case 15:
          newSwap = _c.sent();
          console.log("Payer KP: ", payer.secretKey.toString());
          console.log("Owner KP: ", owner.secretKey.toString());
          console.log("MintA: ", mintA.publicKey.toString());
          console.log("MintB: ", mintB.publicKey.toString());
          console.log("FeeAccountA: ", newSwap.adminFeeAccountA.toString());
          console.log("FeeAccountB: ", newSwap.adminFeeAccountB.toString());
          console.log("Address: ", newSwap.stableSwap.toString());
          console.log("ProgramID: ", newSwap.swapProgramId.toString());
          return [2 /*return*/];
      }
    });
  });
};
run();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV3LXN3YXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zY3JpcHRzL25ldy1zd2FwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUt5QjtBQUN6QiwrQ0FBMEM7QUFFMUMsOEJBQW9DO0FBQ3BDLDhDQUE0RTtBQUM1RSwyQ0FJeUI7QUFFekIsSUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ3ZCLElBQU0sc0JBQXNCLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLGtDQUFzQixDQUFDLENBQUM7QUFDOUUsSUFBTSxzQkFBc0IsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsa0NBQXNCLENBQUMsQ0FBQztBQUU5RSxJQUFNLEdBQUcsR0FBRzs7Ozs7Z0JBQ0osS0FBc0MsMkJBQWlCLEVBQUUsRUFBdkQsVUFBVSxnQkFBQSxFQUFFLG1CQUFtQix5QkFBQSxDQUF5QjtnQkFDMUQsVUFBVSxHQUFHLElBQUksb0JBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2dCQUN4QixxQkFBTSxnQ0FBc0IsQ0FBQyxVQUFVLEVBQUUsMEJBQWdCLENBQUMsRUFBQTs7Z0JBQWxFLEtBQUssR0FBRyxTQUEwRDtnQkFDMUQscUJBQU0sZ0NBQXNCLENBQUMsVUFBVSxFQUFFLDBCQUFnQixDQUFDLEVBQUE7O2dCQUFsRSxLQUFLLEdBQUcsU0FBMEQ7Z0JBRWxFLGlCQUFpQixHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO2dCQUNiLHFCQUFNLG1CQUFTLENBQUMsa0JBQWtCLENBQzNELENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQ3hDLG1CQUFtQixDQUNwQixFQUFBOztn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Z0JBQ3RELE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDbEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Ozs7S0FDOUQsQ0FBQztBQUVGLEdBQUcsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29ubmVjdGlvbixcbiAgQWNjb3VudCxcbiAgTEFNUE9SVFNfUEVSX1NPTCxcbiAgUHVibGljS2V5LFxufSBmcm9tIFwiQHNvbGFuYS93ZWIzLmpzXCI7XG5pbXBvcnQgeyBUb2tlbiB9IGZyb20gXCJAc29sYW5hL3NwbC10b2tlblwiO1xuXG5pbXBvcnQgeyBTdGFibGVTd2FwIH0gZnJvbSBcIi4uL3NyY1wiO1xuaW1wb3J0IHsgREVGQVVMVF9UT0tFTl9ERUNJTUFMUywgVE9LRU5fUFJPR1JBTV9JRCB9IGZyb20gXCIuLi9zcmMvY29uc3RhbnRzXCI7XG5pbXBvcnQge1xuICBnZXREZXBsb3ltZW50SW5mbyxcbiAgbmV3QWNjb3VudFdpdGhMYW1wb3J0cyxcbiAgc2xlZXAsXG59IGZyb20gXCIuLi90ZXN0L2hlbHBlcnNcIjtcblxuY29uc3QgQU1QX0ZBQ1RPUiA9IDEwMDtcbmNvbnN0IElOSVRJQUxfVE9LRU5fQV9BTU9VTlQgPSAxMDAwMDAwICogTWF0aC5wb3coMTAsIERFRkFVTFRfVE9LRU5fREVDSU1BTFMpO1xuY29uc3QgSU5JVElBTF9UT0tFTl9CX0FNT1VOVCA9IDEwMDAwMDAgKiBNYXRoLnBvdygxMCwgREVGQVVMVF9UT0tFTl9ERUNJTUFMUyk7XG5cbmNvbnN0IHJ1biA9IGFzeW5jICgpID0+IHtcbiAgY29uc3QgeyBjbHVzdGVyVXJsLCBzdGFibGVTd2FwUHJvZ3JhbUlkIH0gPSBnZXREZXBsb3ltZW50SW5mbygpO1xuICBjb25zdCBjb25uZWN0aW9uID0gbmV3IENvbm5lY3Rpb24oY2x1c3RlclVybCk7XG4gIGNvbnNvbGUubG9nKFwiUmVxdWVzdGluZyBhaXJkcm9wIC4uLlwiKTtcbiAgY29uc3QgcGF5ZXIgPSBhd2FpdCBuZXdBY2NvdW50V2l0aExhbXBvcnRzKGNvbm5lY3Rpb24sIExBTVBPUlRTX1BFUl9TT0wpO1xuICBjb25zdCBvd25lciA9IGF3YWl0IG5ld0FjY291bnRXaXRoTGFtcG9ydHMoY29ubmVjdGlvbiwgTEFNUE9SVFNfUEVSX1NPTCk7XG5cbiAgY29uc3Qgc3RhYmxlU3dhcEFjY291bnQgPSBuZXcgQWNjb3VudCgpO1xuICBjb25zdCBbYXV0aG9yaXR5LCBub25jZV0gPSBhd2FpdCBQdWJsaWNLZXkuZmluZFByb2dyYW1BZGRyZXNzKFxuICAgIFtzdGFibGVTd2FwQWNjb3VudC5wdWJsaWNLZXkudG9CdWZmZXIoKV0sXG4gICAgc3RhYmxlU3dhcFByb2dyYW1JZFxuICApO1xuICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIHBvb2wgbWludCAuLi5cIik7XG4gIGNvbnN0IHRva2VuUG9vbCA9IGF3YWl0IFRva2VuLmNyZWF0ZU1pbnQoXG4gICAgY29ubmVjdGlvbixcbiAgICBwYXllcixcbiAgICBhdXRob3JpdHksXG4gICAgbnVsbCxcbiAgICBERUZBVUxUX1RPS0VOX0RFQ0lNQUxTLFxuICAgIFRPS0VOX1BST0dSQU1fSURcbiAgKTtcbiAgY29uc3QgdXNlclBvb2xBY2NvdW50ID0gYXdhaXQgdG9rZW5Qb29sLmNyZWF0ZUFjY291bnQob3duZXIucHVibGljS2V5KTtcblxuICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIFRva2VuQSBtaW50IC4uLlwiKTtcbiAgY29uc3QgbWludEEgPSBhd2FpdCBUb2tlbi5jcmVhdGVNaW50KFxuICAgIGNvbm5lY3Rpb24sXG4gICAgcGF5ZXIsXG4gICAgb3duZXIucHVibGljS2V5LFxuICAgIG51bGwsXG4gICAgREVGQVVMVF9UT0tFTl9ERUNJTUFMUyxcbiAgICBUT0tFTl9QUk9HUkFNX0lEXG4gICk7XG4gIGNvbnNvbGUubG9nKFwiQ3JlYXRpbmcgVG9rZW5BIGFjY291bnRzIC4uLlwiKTtcbiAgLy8gY3JlYXRlIHRva2VuIEEgYWNjb3VudCB0aGVuIG1pbnQgdG8gaXRcbiAgY29uc3QgYWRtaW5BY2NvdW50QSA9IGF3YWl0IG1pbnRBLmNyZWF0ZUFjY291bnQob3duZXIucHVibGljS2V5KTtcbiAgY29uc3QgdG9rZW5BY2NvdW50QSA9IGF3YWl0IG1pbnRBLmNyZWF0ZUFjY291bnQoYXV0aG9yaXR5KTtcbiAgYXdhaXQgbWludEEubWludFRvKHRva2VuQWNjb3VudEEsIG93bmVyLCBbXSwgSU5JVElBTF9UT0tFTl9BX0FNT1VOVCk7XG4gIGNvbnNvbGUubG9nKFwiQ3JlYXRpbmcgVG9rZW5BIGFjY291bnRzIC4uLlwiKTtcbiAgY29uc3QgbWludEIgPSBhd2FpdCBUb2tlbi5jcmVhdGVNaW50KFxuICAgIGNvbm5lY3Rpb24sXG4gICAgcGF5ZXIsXG4gICAgb3duZXIucHVibGljS2V5LFxuICAgIG51bGwsXG4gICAgREVGQVVMVF9UT0tFTl9ERUNJTUFMUyxcbiAgICBUT0tFTl9QUk9HUkFNX0lEXG4gICk7XG5cbiAgY29uc29sZS5sb2coXCJDcmVhdGluZyBUb2tlbkIgYWNjb3VudHMgLi4uXCIpO1xuICBjb25zdCBhZG1pbkFjY291bnRCID0gYXdhaXQgbWludEIuY3JlYXRlQWNjb3VudChvd25lci5wdWJsaWNLZXkpO1xuICBjb25zdCB0b2tlbkFjY291bnRCID0gYXdhaXQgbWludEIuY3JlYXRlQWNjb3VudChhdXRob3JpdHkpO1xuICBhd2FpdCBtaW50Qi5taW50VG8odG9rZW5BY2NvdW50Qiwgb3duZXIsIFtdLCBJTklUSUFMX1RPS0VOX0JfQU1PVU5UKTtcblxuICAvLyBTbGVlcCB0byBtYWtlIHN1cmUgdG9rZW4gYWNjb3VudHMgYXJlIGNyZWF0ZWQgLi4uXG4gIGF3YWl0IHNsZWVwKDUwMCk7XG5cbiAgY29uc29sZS5sb2coXCJDcmVhdGluZyBuZXcgc3dhcCAuLi5cIik7XG4gIGNvbnN0IG5ld1N3YXAgPSBhd2FpdCBTdGFibGVTd2FwLmNyZWF0ZVN0YWJsZVN3YXAoXG4gICAgY29ubmVjdGlvbixcbiAgICBwYXllcixcbiAgICBzdGFibGVTd2FwQWNjb3VudCxcbiAgICBhdXRob3JpdHksXG4gICAgb3duZXIucHVibGljS2V5LFxuICAgIGFkbWluQWNjb3VudEEsXG4gICAgYWRtaW5BY2NvdW50QixcbiAgICBtaW50QS5wdWJsaWNLZXksXG4gICAgdG9rZW5BY2NvdW50QSxcbiAgICBtaW50Qi5wdWJsaWNLZXksXG4gICAgdG9rZW5BY2NvdW50QixcbiAgICB0b2tlblBvb2wucHVibGljS2V5LFxuICAgIHVzZXJQb29sQWNjb3VudCxcbiAgICBtaW50QS5wdWJsaWNLZXksXG4gICAgbWludEIucHVibGljS2V5LFxuICAgIHN0YWJsZVN3YXBQcm9ncmFtSWQsXG4gICAgVE9LRU5fUFJPR1JBTV9JRCxcbiAgICBub25jZSxcbiAgICBBTVBfRkFDVE9SXG4gICk7XG5cbiAgY29uc29sZS5sb2coXCJQYXllciBLUDogXCIsIHBheWVyLnNlY3JldEtleS50b1N0cmluZygpKTtcbiAgY29uc29sZS5sb2coXCJPd25lciBLUDogXCIsIG93bmVyLnNlY3JldEtleS50b1N0cmluZygpKTtcbiAgY29uc29sZS5sb2coXCJNaW50QTogXCIsIG1pbnRBLnB1YmxpY0tleS50b1N0cmluZygpKTtcbiAgY29uc29sZS5sb2coXCJNaW50QjogXCIsIG1pbnRCLnB1YmxpY0tleS50b1N0cmluZygpKTtcbiAgY29uc29sZS5sb2coXCJGZWVBY2NvdW50QTogXCIsIG5ld1N3YXAuYWRtaW5GZWVBY2NvdW50QS50b1N0cmluZygpKTtcbiAgY29uc29sZS5sb2coXCJGZWVBY2NvdW50QjogXCIsIG5ld1N3YXAuYWRtaW5GZWVBY2NvdW50Qi50b1N0cmluZygpKTtcbiAgY29uc29sZS5sb2coXCJBZGRyZXNzOiBcIiwgbmV3U3dhcC5zdGFibGVTd2FwLnRvU3RyaW5nKCkpO1xuICBjb25zb2xlLmxvZyhcIlByb2dyYW1JRDogXCIsIG5ld1N3YXAuc3dhcFByb2dyYW1JZC50b1N0cmluZygpKTtcbn07XG5cbnJ1bigpO1xuIl19
