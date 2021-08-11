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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StableSwapLayout = exports.Uint64Layout = exports.PublicKeyLayout = void 0;
var BufferLayout = __importStar(require("buffer-layout"));
/**
 * Layout for a public key
 */
exports.PublicKeyLayout = function (property) {
  if (property === void 0) {
    property = "publicKey";
  }
  return BufferLayout.blob(32, property);
};
/**
 * Layout for a 64bit unsigned value
 */
exports.Uint64Layout = function (property) {
  if (property === void 0) {
    property = "uint64";
  }
  return BufferLayout.blob(8, property);
};
/**
 * Layout for stable swap state
 */
exports.StableSwapLayout = BufferLayout.struct([
  BufferLayout.u8("isInitialized"),
  BufferLayout.u8("isPaused"),
  BufferLayout.u8("nonce"),
  BufferLayout.nu64("initialAmpFactor"),
  BufferLayout.nu64("targetAmpFactor"),
  BufferLayout.ns64("startRampTs"),
  BufferLayout.ns64("stopRampTs"),
  BufferLayout.ns64("futureAdminDeadline"),
  exports.PublicKeyLayout("futureAdminAccount"),
  exports.PublicKeyLayout("adminAccount"),
  exports.PublicKeyLayout("tokenAccountA"),
  exports.PublicKeyLayout("tokenAccountB"),
  exports.PublicKeyLayout("tokenPool"),
  exports.PublicKeyLayout("mintA"),
  exports.PublicKeyLayout("mintB"),
  exports.PublicKeyLayout("adminFeeAccountA"),
  exports.PublicKeyLayout("adminFeeAccountB"),
  BufferLayout.nu64("adminTradeFeeNumerator"),
  BufferLayout.nu64("adminTradeFeeDenominator"),
  BufferLayout.nu64("adminWithdrawFeeNumerator"),
  BufferLayout.nu64("adminWithdrawFeeDenominator"),
  BufferLayout.nu64("tradeFeeNumerator"),
  BufferLayout.nu64("tradeFeeDenominator"),
  BufferLayout.nu64("withdrawFeeNumerator"),
  BufferLayout.nu64("withdrawFeeDenominator"),
]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xheW91dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMERBQThDO0FBRTlDOztHQUVHO0FBQ1UsUUFBQSxlQUFlLEdBQUcsVUFBQyxRQUE4QjtJQUE5Qix5QkFBQSxFQUFBLHNCQUE4QjtJQUM1RCxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ1UsUUFBQSxZQUFZLEdBQUcsVUFBQyxRQUEyQjtJQUEzQix5QkFBQSxFQUFBLG1CQUEyQjtJQUN0RCxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ1UsUUFBQSxnQkFBZ0IsR0FBa0MsWUFBWSxDQUFDLE1BQU0sQ0FDaEY7SUFDRSxZQUFZLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQztJQUNoQyxZQUFZLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQztJQUMzQixZQUFZLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQztJQUN4QixZQUFZLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDO0lBQ3JDLFlBQVksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7SUFDcEMsWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDaEMsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDL0IsWUFBWSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztJQUN4Qyx1QkFBZSxDQUFDLG9CQUFvQixDQUFDO0lBQ3JDLHVCQUFlLENBQUMsY0FBYyxDQUFDO0lBQy9CLHVCQUFlLENBQUMsZUFBZSxDQUFDO0lBQ2hDLHVCQUFlLENBQUMsZUFBZSxDQUFDO0lBQ2hDLHVCQUFlLENBQUMsV0FBVyxDQUFDO0lBQzVCLHVCQUFlLENBQUMsT0FBTyxDQUFDO0lBQ3hCLHVCQUFlLENBQUMsT0FBTyxDQUFDO0lBQ3hCLHVCQUFlLENBQUMsa0JBQWtCLENBQUM7SUFDbkMsdUJBQWUsQ0FBQyxrQkFBa0IsQ0FBQztJQUNuQyxZQUFZLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDO0lBQzNDLFlBQVksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUM7SUFDN0MsWUFBWSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQztJQUM5QyxZQUFZLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDO0lBQ2hELFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUM7SUFDdEMsWUFBWSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztJQUN4QyxZQUFZLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDO0lBQ3pDLFlBQVksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUM7Q0FDNUMsQ0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQnVmZmVyTGF5b3V0IGZyb20gXCJidWZmZXItbGF5b3V0XCI7XG5cbi8qKlxuICogTGF5b3V0IGZvciBhIHB1YmxpYyBrZXlcbiAqL1xuZXhwb3J0IGNvbnN0IFB1YmxpY0tleUxheW91dCA9IChwcm9wZXJ0eTogc3RyaW5nID0gXCJwdWJsaWNLZXlcIik6IG9iamVjdCA9PiB7XG4gIHJldHVybiBCdWZmZXJMYXlvdXQuYmxvYigzMiwgcHJvcGVydHkpO1xufTtcblxuLyoqXG4gKiBMYXlvdXQgZm9yIGEgNjRiaXQgdW5zaWduZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGNvbnN0IFVpbnQ2NExheW91dCA9IChwcm9wZXJ0eTogc3RyaW5nID0gXCJ1aW50NjRcIik6IG9iamVjdCA9PiB7XG4gIHJldHVybiBCdWZmZXJMYXlvdXQuYmxvYig4LCBwcm9wZXJ0eSk7XG59O1xuXG4vKipcbiAqIExheW91dCBmb3Igc3RhYmxlIHN3YXAgc3RhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IFN0YWJsZVN3YXBMYXlvdXQ6IHR5cGVvZiBCdWZmZXJMYXlvdXQuU3RydWN0dXJlID0gQnVmZmVyTGF5b3V0LnN0cnVjdChcbiAgW1xuICAgIEJ1ZmZlckxheW91dC51OChcImlzSW5pdGlhbGl6ZWRcIiksXG4gICAgQnVmZmVyTGF5b3V0LnU4KFwiaXNQYXVzZWRcIiksXG4gICAgQnVmZmVyTGF5b3V0LnU4KFwibm9uY2VcIiksXG4gICAgQnVmZmVyTGF5b3V0Lm51NjQoXCJpbml0aWFsQW1wRmFjdG9yXCIpLFxuICAgIEJ1ZmZlckxheW91dC5udTY0KFwidGFyZ2V0QW1wRmFjdG9yXCIpLFxuICAgIEJ1ZmZlckxheW91dC5uczY0KFwic3RhcnRSYW1wVHNcIiksXG4gICAgQnVmZmVyTGF5b3V0Lm5zNjQoXCJzdG9wUmFtcFRzXCIpLFxuICAgIEJ1ZmZlckxheW91dC5uczY0KFwiZnV0dXJlQWRtaW5EZWFkbGluZVwiKSxcbiAgICBQdWJsaWNLZXlMYXlvdXQoXCJmdXR1cmVBZG1pbkFjY291bnRcIiksXG4gICAgUHVibGljS2V5TGF5b3V0KFwiYWRtaW5BY2NvdW50XCIpLFxuICAgIFB1YmxpY0tleUxheW91dChcInRva2VuQWNjb3VudEFcIiksXG4gICAgUHVibGljS2V5TGF5b3V0KFwidG9rZW5BY2NvdW50QlwiKSxcbiAgICBQdWJsaWNLZXlMYXlvdXQoXCJ0b2tlblBvb2xcIiksXG4gICAgUHVibGljS2V5TGF5b3V0KFwibWludEFcIiksXG4gICAgUHVibGljS2V5TGF5b3V0KFwibWludEJcIiksXG4gICAgUHVibGljS2V5TGF5b3V0KFwiYWRtaW5GZWVBY2NvdW50QVwiKSxcbiAgICBQdWJsaWNLZXlMYXlvdXQoXCJhZG1pbkZlZUFjY291bnRCXCIpLFxuICAgIEJ1ZmZlckxheW91dC5udTY0KFwiYWRtaW5UcmFkZUZlZU51bWVyYXRvclwiKSxcbiAgICBCdWZmZXJMYXlvdXQubnU2NChcImFkbWluVHJhZGVGZWVEZW5vbWluYXRvclwiKSxcbiAgICBCdWZmZXJMYXlvdXQubnU2NChcImFkbWluV2l0aGRyYXdGZWVOdW1lcmF0b3JcIiksXG4gICAgQnVmZmVyTGF5b3V0Lm51NjQoXCJhZG1pbldpdGhkcmF3RmVlRGVub21pbmF0b3JcIiksXG4gICAgQnVmZmVyTGF5b3V0Lm51NjQoXCJ0cmFkZUZlZU51bWVyYXRvclwiKSxcbiAgICBCdWZmZXJMYXlvdXQubnU2NChcInRyYWRlRmVlRGVub21pbmF0b3JcIiksXG4gICAgQnVmZmVyTGF5b3V0Lm51NjQoXCJ3aXRoZHJhd0ZlZU51bWVyYXRvclwiKSxcbiAgICBCdWZmZXJMYXlvdXQubnU2NChcIndpdGhkcmF3RmVlRGVub21pbmF0b3JcIiksXG4gIF1cbik7XG4iXX0=
