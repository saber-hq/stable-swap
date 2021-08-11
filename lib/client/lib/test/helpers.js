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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeploymentInfo = exports.newAccountWithLamports = exports.sleep = void 0;
var fs_1 = __importDefault(require("fs"));
var web3_js_1 = require("@solana/web3.js");
function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}
exports.sleep = sleep;
function newAccountWithLamports(connection, lamports) {
  if (lamports === void 0) {
    lamports = 1000000;
  }
  return __awaiter(this, void 0, void 0, function () {
    var account, retries, e_1, _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          account = new web3_js_1.Account();
          retries = 60;
          _b.label = 1;
        case 1:
          _b.trys.push([1, 3, , 4]);
          return [
            4 /*yield*/,
            connection.requestAirdrop(account.publicKey, lamports),
          ];
        case 2:
          _b.sent();
          return [3 /*break*/, 4];
        case 3:
          e_1 = _b.sent();
          // tslint:disable:no-console
          console.error(e_1);
          return [3 /*break*/, 4];
        case 4:
          return [4 /*yield*/, sleep(1000)];
        case 5:
          _b.sent();
          _a = lamports;
          return [4 /*yield*/, connection.getBalance(account.publicKey)];
        case 6:
          if (_a === _b.sent()) {
            return [2 /*return*/, account];
          }
          if (--retries <= 0) {
            return [3 /*break*/, 8];
          }
          _b.label = 7;
        case 7:
          return [3 /*break*/, 4];
        case 8:
          throw new Error("Airdrop of " + lamports + " failed");
      }
    });
  });
}
exports.newAccountWithLamports = newAccountWithLamports;
var getDeploymentInfo = function () {
  var data = fs_1.default.readFileSync("../../last-deploy.json", "utf-8");
  var deployInfo = JSON.parse(data);
  return {
    clusterUrl: deployInfo.clusterUrl,
    stableSwapProgramId: new web3_js_1.PublicKey(deployInfo.swapProgramId),
  };
};
exports.getDeploymentInfo = getDeploymentInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QvaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBb0I7QUFDcEIsMkNBQXFEO0FBR3JELFNBQWdCLEtBQUssQ0FBQyxFQUFVO0lBQzlCLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLElBQUssT0FBQSxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUF2QixDQUF1QixDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUZELHNCQUVDO0FBRUQsU0FBc0Isc0JBQXNCLENBQzFDLFVBQXNCLEVBQ3RCLFFBQTBCO0lBQTFCLHlCQUFBLEVBQUEsa0JBQTBCOzs7Ozs7b0JBRXBCLE9BQU8sR0FBRyxJQUFJLGlCQUFPLEVBQUUsQ0FBQztvQkFFMUIsT0FBTyxHQUFHLEVBQUUsQ0FBQzs7OztvQkFFZixxQkFBTSxVQUFVLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUE7O29CQUE1RCxTQUE0RCxDQUFDOzs7O29CQUU3RCw0QkFBNEI7b0JBQzVCLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBQyxDQUFDLENBQUM7O3dCQUdqQixxQkFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUE7O29CQUFqQixTQUFpQixDQUFDO29CQUNkLEtBQUEsUUFBUSxDQUFBO29CQUFNLHFCQUFNLFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFBOztvQkFBaEUsSUFBSSxPQUFhLENBQUMsU0FBOEMsQ0FBQyxFQUFFO3dCQUNqRSxzQkFBTyxPQUFPLEVBQUM7cUJBQ2hCO29CQUNELElBQUksRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFO3dCQUNsQix3QkFBTTtxQkFDUDs7O3dCQUVILE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWMsUUFBUSxZQUFTLENBQUMsQ0FBQzs7OztDQUNsRDtBQXZCRCx3REF1QkM7QUFFTSxJQUFNLGlCQUFpQixHQUFHO0lBQy9CLElBQU0sSUFBSSxHQUFHLFlBQUUsQ0FBQyxZQUFZLENBQUMsd0JBQXdCLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDaEUsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxPQUFPO1FBQ0wsVUFBVSxFQUFFLFVBQVUsQ0FBQyxVQUFVO1FBQ2pDLG1CQUFtQixFQUFFLElBQUksbUJBQVMsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO0tBQzdELENBQUM7QUFDSixDQUFDLENBQUM7QUFQVyxRQUFBLGlCQUFpQixxQkFPNUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBBY2NvdW50LCBQdWJsaWNLZXkgfSBmcm9tIFwiQHNvbGFuYS93ZWIzLmpzXCI7XG5pbXBvcnQgdHlwZSB7IENvbm5lY3Rpb24gfSBmcm9tIFwiQHNvbGFuYS93ZWIzLmpzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzbGVlcChtczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbmV3QWNjb3VudFdpdGhMYW1wb3J0cyhcbiAgY29ubmVjdGlvbjogQ29ubmVjdGlvbixcbiAgbGFtcG9ydHM6IG51bWJlciA9IDEwMDAwMDBcbik6IFByb21pc2U8QWNjb3VudD4ge1xuICBjb25zdCBhY2NvdW50ID0gbmV3IEFjY291bnQoKTtcblxuICBsZXQgcmV0cmllcyA9IDYwO1xuICB0cnkge1xuICAgIGF3YWl0IGNvbm5lY3Rpb24ucmVxdWVzdEFpcmRyb3AoYWNjb3VudC5wdWJsaWNLZXksIGxhbXBvcnRzKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmVycm9yKGUpO1xuICB9XG4gIGZvciAoOzspIHtcbiAgICBhd2FpdCBzbGVlcCgxMDAwKTtcbiAgICBpZiAobGFtcG9ydHMgPT09IChhd2FpdCBjb25uZWN0aW9uLmdldEJhbGFuY2UoYWNjb3VudC5wdWJsaWNLZXkpKSkge1xuICAgICAgcmV0dXJuIGFjY291bnQ7XG4gICAgfVxuICAgIGlmICgtLXJldHJpZXMgPD0gMCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihgQWlyZHJvcCBvZiAke2xhbXBvcnRzfSBmYWlsZWRgKTtcbn1cblxuZXhwb3J0IGNvbnN0IGdldERlcGxveW1lbnRJbmZvID0gKCkgPT4ge1xuICBjb25zdCBkYXRhID0gZnMucmVhZEZpbGVTeW5jKFwiLi4vLi4vbGFzdC1kZXBsb3kuanNvblwiLCBcInV0Zi04XCIpO1xuICBjb25zdCBkZXBsb3lJbmZvID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgcmV0dXJuIHtcbiAgICBjbHVzdGVyVXJsOiBkZXBsb3lJbmZvLmNsdXN0ZXJVcmwsXG4gICAgc3RhYmxlU3dhcFByb2dyYW1JZDogbmV3IFB1YmxpY0tleShkZXBsb3lJbmZvLnN3YXBQcm9ncmFtSWQpLFxuICB9O1xufTtcbiJdfQ==
