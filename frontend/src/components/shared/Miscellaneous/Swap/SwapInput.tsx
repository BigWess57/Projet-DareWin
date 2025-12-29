import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { TokenIcon } from "./SwapWidget";
import { SwapForm, SwapStatus } from "@/utils/types";

type SwapInputProps = {
    form: SwapForm;
    status: SwapStatus
}   

const SwapInput = ({form, status}: SwapInputProps) => {
    const t = useTranslations("HomePage.Swap");

    return (
        <div
            className={`bg-[#0F111A] rounded-2xl p-4 mb-2 border transition-colors group 
                            ${
                                status.isInsufficientBalance
                                    ? "border-red-500/50"
                                    : "border-white/5 hover:border-white/10 focus-within:border-cyan-500/30"
                            }`}
        >
            <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{t("you_pay")}</span>
                <span
                    className={`flex items-center gap-1 ${status.isInsufficientBalance ? "text-red-400" : ""}`}
                >
                    {t("balance")}:{" "}
                    {form.pay.token.loading ? (
                        <span className="animate-pulse bg-white/10 w-10 h-3 rounded"></span>
                    ) : (
                        <span
                            className={
                                status.isInsufficientBalance
                                    ? "text-red-400 font-medium"
                                    : "text-white/90"
                            }
                        >
                            {form.pay.token.balance?.formatted
                                ? Number(
                                      form.pay.token.balance.formatted,
                                  ).toFixed(form.isEthToDare ? 6 : 2)
                                : "0.00"}
                        </span>
                    )}
                    {form.pay.token.symbol}
                </span>
            </div>
            <div className="flex justify-between items-center">
                {status.isQuoteLoading && form.receive.active ? (
                    <div className="w-2/3 h-9 flex items-center">
                        <Loader2
                            className="animate-spin text-blue-500"
                            size={24}
                        />
                        <span className="ml-3 text-white/30 text-sm">
                            {t("calculating")}
                        </span>
                    </div>
                ) : (
                    <input
                        type="text"
                        inputMode="decimal"
                        value={form.pay.amount}
                        onChange={form.pay.setAmount}
                        className={`bg-transparent text-3xl font-medium outline-none w-2/3 placeholder-gray-600
                        ${status.isInsufficientBalance ? "text-red-400" : "text-white"}
                        ${status.isQuoteLoading && form.receive.active && "opacity-50"}
                    `}
                        placeholder="0.0"
                    />
                )}
                <button
                    className={`flex items-center bg-[#1F243A] text-white px-3 py-1.5 rounded-full font-medium transition-all border border-white/10 ring-2 ${form.isEthToDare ? "ring-blue-500/20" : "ring-purple-500/20"}`}
                >
                    <TokenIcon
                        symbol={form.pay.token.symbol}
                        color={form.pay.token.color}
                    />
                    {form.pay.token.symbol}
                </button>
            </div>
            <div className="text-gray-500 text-sm mt-1 flex flex-col">
                {status.isQuoteLoading ? null : (
                    <span className="text-gray-500">
                        {/* DISPLAY REAL USD VALUE FOR ETH */}≈ $
                        {form.pay.usdValue.toLocaleString("en-US", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                        })}
                    </span>
                )}
                {status.isInsufficientBalance && (
                    <span className="text-red-400 font-medium">
                        {t("insufficient_balance")}
                    </span>
                )}
            </div>
        </div>
    );
};

export default SwapInput;
