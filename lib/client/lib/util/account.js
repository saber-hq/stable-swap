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
exports.loadAccount = void 0;
exports.loadAccount = function (connection, address, programId) {
  return __awaiter(void 0, void 0, void 0, function () {
    var accountInfo;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, connection.getAccountInfo(address)];
        case 1:
          accountInfo = _a.sent();
          if (accountInfo === null) {
            throw new Error("Failed to find account");
          }
          if (!accountInfo.owner.equals(programId)) {
            throw new Error(
              "Invalid owner: expected " +
                programId.toBase58() +
                ", found " +
                accountInfo.owner.toBase58()
            );
          }
          return [2 /*return*/, Buffer.from(accountInfo.data)];
      }
    });
  });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2FjY291bnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR2EsUUFBQSxXQUFXLEdBQUcsVUFDekIsVUFBc0IsRUFDdEIsT0FBa0IsRUFDbEIsU0FBb0I7Ozs7b0JBRUEscUJBQU0sVUFBVSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBQTs7Z0JBQXRELFdBQVcsR0FBRyxTQUF3QztnQkFDNUQsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO29CQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7aUJBQzNDO2dCQUVELElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDeEMsTUFBTSxJQUFJLEtBQUssQ0FDYiw2QkFBMkIsU0FBUyxDQUFDLFFBQVEsRUFBRSxnQkFBVyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBSSxDQUN6RixDQUFDO2lCQUNIO2dCQUVELHNCQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFDOzs7S0FDdEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29ubmVjdGlvbiB9IGZyb20gXCJAc29sYW5hL3dlYjMuanNcIjtcbmltcG9ydCB7IFB1YmxpY0tleSB9IGZyb20gXCJAc29sYW5hL3dlYjMuanNcIjtcblxuZXhwb3J0IGNvbnN0IGxvYWRBY2NvdW50ID0gYXN5bmMgKFxuICBjb25uZWN0aW9uOiBDb25uZWN0aW9uLFxuICBhZGRyZXNzOiBQdWJsaWNLZXksXG4gIHByb2dyYW1JZDogUHVibGljS2V5XG4pOiBQcm9taXNlPEJ1ZmZlcj4gPT4ge1xuICBjb25zdCBhY2NvdW50SW5mbyA9IGF3YWl0IGNvbm5lY3Rpb24uZ2V0QWNjb3VudEluZm8oYWRkcmVzcyk7XG4gIGlmIChhY2NvdW50SW5mbyA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBmaW5kIGFjY291bnRcIik7XG4gIH1cblxuICBpZiAoIWFjY291bnRJbmZvLm93bmVyLmVxdWFscyhwcm9ncmFtSWQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEludmFsaWQgb3duZXI6IGV4cGVjdGVkICR7cHJvZ3JhbUlkLnRvQmFzZTU4KCl9LCBmb3VuZCAke2FjY291bnRJbmZvLm93bmVyLnRvQmFzZTU4KCl9YFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gQnVmZmVyLmZyb20oYWNjb3VudEluZm8uZGF0YSk7XG59O1xuIl19
