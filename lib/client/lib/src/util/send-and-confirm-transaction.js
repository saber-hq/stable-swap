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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAndConfirmTransaction = void 0;
var web3_js_1 = require("@solana/web3.js");
var sendAndConfirmTransaction = function (title, connection, transaction) {
  var signers = [];
  for (var _i = 3; _i < arguments.length; _i++) {
    signers[_i - 3] = arguments[_i];
  }
  return __awaiter(void 0, void 0, void 0, function () {
    var txSig;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          /* tslint:disable:no-console */
          console.info("Sending " + title + " transaction");
          return [
            4 /*yield*/,
            web3_js_1.sendAndConfirmTransaction(
              connection,
              transaction,
              signers,
              {
                skipPreflight: false,
                commitment: connection.commitment || "recent",
                preflightCommitment: connection.commitment || "recent",
              }
            ),
          ];
        case 1:
          txSig = _a.sent();
          console.info("TxSig: " + txSig);
          return [2 /*return*/, txSig];
      }
    });
  });
};
exports.sendAndConfirmTransaction = sendAndConfirmTransaction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1hbmQtY29uZmlybS10cmFuc2FjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlsL3NlbmQtYW5kLWNvbmZpcm0tdHJhbnNhY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBTUEsMkNBQTZGO0FBRXRGLElBQU0seUJBQXlCLEdBQUcsVUFDdkMsS0FBYSxFQUNiLFVBQXNCLEVBQ3RCLFdBQXdCO0lBQ3hCLGlCQUFxQjtTQUFyQixVQUFxQixFQUFyQixxQkFBcUIsRUFBckIsSUFBcUI7UUFBckIsZ0NBQXFCOzs7Ozs7O29CQUVyQiwrQkFBK0I7b0JBQy9CLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBVyxLQUFLLGlCQUFjLENBQUMsQ0FBQztvQkFFL0IscUJBQU0sbUNBQTZCLENBQy9DLFVBQVUsRUFDVixXQUFXLEVBQ1gsT0FBTyxFQUNQOzRCQUNFLGFBQWEsRUFBRSxLQUFLOzRCQUNwQixVQUFVLEVBQUUsVUFBVSxDQUFDLFVBQVUsSUFBSSxRQUFROzRCQUM3QyxtQkFBbUIsRUFBRSxVQUFVLENBQUMsVUFBVSxJQUFJLFFBQVE7eUJBQ3ZELENBQ0YsRUFBQTs7b0JBVEssS0FBSyxHQUFHLFNBU2I7b0JBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFVLEtBQU8sQ0FBQyxDQUFDO29CQUNoQyxzQkFBTyxLQUFLLEVBQUM7Ozs7Q0FDZCxDQUFDO0FBckJXLFFBQUEseUJBQXlCLDZCQXFCcEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEFjY291bnQsXG4gIENvbm5lY3Rpb24sXG4gIFRyYW5zYWN0aW9uLFxuICBUcmFuc2FjdGlvblNpZ25hdHVyZSxcbn0gZnJvbSBcIkBzb2xhbmEvd2ViMy5qc1wiO1xuaW1wb3J0IHsgc2VuZEFuZENvbmZpcm1UcmFuc2FjdGlvbiBhcyByZWFsU2VuZEFuZENvbmZpcm1UcmFuc2FjdGlvbiB9IGZyb20gXCJAc29sYW5hL3dlYjMuanNcIjtcblxuZXhwb3J0IGNvbnN0IHNlbmRBbmRDb25maXJtVHJhbnNhY3Rpb24gPSBhc3luYyAoXG4gIHRpdGxlOiBzdHJpbmcsXG4gIGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXG4gIHRyYW5zYWN0aW9uOiBUcmFuc2FjdGlvbixcbiAgLi4uc2lnbmVyczogQWNjb3VudFtdXG4pOiBQcm9taXNlPFRyYW5zYWN0aW9uU2lnbmF0dXJlPiA9PiB7XG4gIC8qIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGUgKi9cbiAgY29uc29sZS5pbmZvKGBTZW5kaW5nICR7dGl0bGV9IHRyYW5zYWN0aW9uYCk7XG5cbiAgY29uc3QgdHhTaWcgPSBhd2FpdCByZWFsU2VuZEFuZENvbmZpcm1UcmFuc2FjdGlvbihcbiAgICBjb25uZWN0aW9uLFxuICAgIHRyYW5zYWN0aW9uLFxuICAgIHNpZ25lcnMsXG4gICAge1xuICAgICAgc2tpcFByZWZsaWdodDogZmFsc2UsXG4gICAgICBjb21taXRtZW50OiBjb25uZWN0aW9uLmNvbW1pdG1lbnQgfHwgXCJyZWNlbnRcIixcbiAgICAgIHByZWZsaWdodENvbW1pdG1lbnQ6IGNvbm5lY3Rpb24uY29tbWl0bWVudCB8fCBcInJlY2VudFwiLFxuICAgIH1cbiAgKTtcbiAgY29uc29sZS5pbmZvKGBUeFNpZzogJHt0eFNpZ31gKTtcbiAgcmV0dXJuIHR4U2lnO1xufTtcbiJdfQ==
