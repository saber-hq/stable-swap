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
var PublicKeyLayout = function (property) {
  if (property === void 0) {
    property = "publicKey";
  }
  return BufferLayout.blob(32, property);
};
exports.PublicKeyLayout = PublicKeyLayout;
/**
 * Layout for a 64bit unsigned value
 */
var Uint64Layout = function (property) {
  if (property === void 0) {
    property = "uint64";
  }
  return BufferLayout.blob(8, property);
};
exports.Uint64Layout = Uint64Layout;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xheW91dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMERBQThDO0FBRTlDOztHQUVHO0FBQ0ksSUFBTSxlQUFlLEdBQUcsVUFBQyxRQUE4QjtJQUE5Qix5QkFBQSxFQUFBLHNCQUE4QjtJQUM1RCxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLENBQUMsQ0FBQztBQUZXLFFBQUEsZUFBZSxtQkFFMUI7QUFFRjs7R0FFRztBQUNJLElBQU0sWUFBWSxHQUFHLFVBQUMsUUFBMkI7SUFBM0IseUJBQUEsRUFBQSxtQkFBMkI7SUFDdEQsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN4QyxDQUFDLENBQUM7QUFGVyxRQUFBLFlBQVksZ0JBRXZCO0FBRUY7O0dBRUc7QUFDVSxRQUFBLGdCQUFnQixHQUFrQyxZQUFZLENBQUMsTUFBTSxDQUNoRjtJQUNFLFlBQVksQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDO0lBQ2hDLFlBQVksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDO0lBQzNCLFlBQVksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO0lBQ3hCLFlBQVksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUM7SUFDckMsWUFBWSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztJQUNwQyxZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUNoQyxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztJQUMvQixZQUFZLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDO0lBQ3hDLHVCQUFlLENBQUMsb0JBQW9CLENBQUM7SUFDckMsdUJBQWUsQ0FBQyxjQUFjLENBQUM7SUFDL0IsdUJBQWUsQ0FBQyxlQUFlLENBQUM7SUFDaEMsdUJBQWUsQ0FBQyxlQUFlLENBQUM7SUFDaEMsdUJBQWUsQ0FBQyxXQUFXLENBQUM7SUFDNUIsdUJBQWUsQ0FBQyxPQUFPLENBQUM7SUFDeEIsdUJBQWUsQ0FBQyxPQUFPLENBQUM7SUFDeEIsdUJBQWUsQ0FBQyxrQkFBa0IsQ0FBQztJQUNuQyx1QkFBZSxDQUFDLGtCQUFrQixDQUFDO0lBQ25DLFlBQVksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUM7SUFDM0MsWUFBWSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQztJQUM3QyxZQUFZLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDO0lBQzlDLFlBQVksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUM7SUFDaEQsWUFBWSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztJQUN0QyxZQUFZLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDO0lBQ3hDLFlBQVksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUM7SUFDekMsWUFBWSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztDQUM1QyxDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBCdWZmZXJMYXlvdXQgZnJvbSBcImJ1ZmZlci1sYXlvdXRcIjtcblxuLyoqXG4gKiBMYXlvdXQgZm9yIGEgcHVibGljIGtleVxuICovXG5leHBvcnQgY29uc3QgUHVibGljS2V5TGF5b3V0ID0gKHByb3BlcnR5OiBzdHJpbmcgPSBcInB1YmxpY0tleVwiKTogb2JqZWN0ID0+IHtcbiAgcmV0dXJuIEJ1ZmZlckxheW91dC5ibG9iKDMyLCBwcm9wZXJ0eSk7XG59O1xuXG4vKipcbiAqIExheW91dCBmb3IgYSA2NGJpdCB1bnNpZ25lZCB2YWx1ZVxuICovXG5leHBvcnQgY29uc3QgVWludDY0TGF5b3V0ID0gKHByb3BlcnR5OiBzdHJpbmcgPSBcInVpbnQ2NFwiKTogb2JqZWN0ID0+IHtcbiAgcmV0dXJuIEJ1ZmZlckxheW91dC5ibG9iKDgsIHByb3BlcnR5KTtcbn07XG5cbi8qKlxuICogTGF5b3V0IGZvciBzdGFibGUgc3dhcCBzdGF0ZVxuICovXG5leHBvcnQgY29uc3QgU3RhYmxlU3dhcExheW91dDogdHlwZW9mIEJ1ZmZlckxheW91dC5TdHJ1Y3R1cmUgPSBCdWZmZXJMYXlvdXQuc3RydWN0KFxuICBbXG4gICAgQnVmZmVyTGF5b3V0LnU4KFwiaXNJbml0aWFsaXplZFwiKSxcbiAgICBCdWZmZXJMYXlvdXQudTgoXCJpc1BhdXNlZFwiKSxcbiAgICBCdWZmZXJMYXlvdXQudTgoXCJub25jZVwiKSxcbiAgICBCdWZmZXJMYXlvdXQubnU2NChcImluaXRpYWxBbXBGYWN0b3JcIiksXG4gICAgQnVmZmVyTGF5b3V0Lm51NjQoXCJ0YXJnZXRBbXBGYWN0b3JcIiksXG4gICAgQnVmZmVyTGF5b3V0Lm5zNjQoXCJzdGFydFJhbXBUc1wiKSxcbiAgICBCdWZmZXJMYXlvdXQubnM2NChcInN0b3BSYW1wVHNcIiksXG4gICAgQnVmZmVyTGF5b3V0Lm5zNjQoXCJmdXR1cmVBZG1pbkRlYWRsaW5lXCIpLFxuICAgIFB1YmxpY0tleUxheW91dChcImZ1dHVyZUFkbWluQWNjb3VudFwiKSxcbiAgICBQdWJsaWNLZXlMYXlvdXQoXCJhZG1pbkFjY291bnRcIiksXG4gICAgUHVibGljS2V5TGF5b3V0KFwidG9rZW5BY2NvdW50QVwiKSxcbiAgICBQdWJsaWNLZXlMYXlvdXQoXCJ0b2tlbkFjY291bnRCXCIpLFxuICAgIFB1YmxpY0tleUxheW91dChcInRva2VuUG9vbFwiKSxcbiAgICBQdWJsaWNLZXlMYXlvdXQoXCJtaW50QVwiKSxcbiAgICBQdWJsaWNLZXlMYXlvdXQoXCJtaW50QlwiKSxcbiAgICBQdWJsaWNLZXlMYXlvdXQoXCJhZG1pbkZlZUFjY291bnRBXCIpLFxuICAgIFB1YmxpY0tleUxheW91dChcImFkbWluRmVlQWNjb3VudEJcIiksXG4gICAgQnVmZmVyTGF5b3V0Lm51NjQoXCJhZG1pblRyYWRlRmVlTnVtZXJhdG9yXCIpLFxuICAgIEJ1ZmZlckxheW91dC5udTY0KFwiYWRtaW5UcmFkZUZlZURlbm9taW5hdG9yXCIpLFxuICAgIEJ1ZmZlckxheW91dC5udTY0KFwiYWRtaW5XaXRoZHJhd0ZlZU51bWVyYXRvclwiKSxcbiAgICBCdWZmZXJMYXlvdXQubnU2NChcImFkbWluV2l0aGRyYXdGZWVEZW5vbWluYXRvclwiKSxcbiAgICBCdWZmZXJMYXlvdXQubnU2NChcInRyYWRlRmVlTnVtZXJhdG9yXCIpLFxuICAgIEJ1ZmZlckxheW91dC5udTY0KFwidHJhZGVGZWVEZW5vbWluYXRvclwiKSxcbiAgICBCdWZmZXJMYXlvdXQubnU2NChcIndpdGhkcmF3RmVlTnVtZXJhdG9yXCIpLFxuICAgIEJ1ZmZlckxheW91dC5udTY0KFwid2l0aGRyYXdGZWVEZW5vbWluYXRvclwiKSxcbiAgXVxuKTtcbiJdfQ==
