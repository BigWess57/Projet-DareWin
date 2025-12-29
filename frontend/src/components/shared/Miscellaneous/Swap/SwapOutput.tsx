import { Info, Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { TokenIcon } from "./SwapWidget";
import { SwapForm, SwapStatus } from "@/utils/types";

type SwapOutputProps = {
    form: SwapForm;
    status: SwapStatus;
};

const SwapOutput = ({ form, status }: SwapOutputProps) => {
    // Function to calculate price Impact
    const renderPriceImpact = () => {
        if (
            typeof form.pay.usdValue === "string" ||
            typeof form.receive.usdValue === "string"
        )
            return null;
        const payVal = form.pay.usdValue;
        const receiveVal = form.receive.usdValue;

        if (!payVal || !receiveVal || payVal === 0) return null;

        // Calculate percentage loss
        const diff = payVal - receiveVal;
        const impactPercent = (diff / payVal) * 100;

        let colorClass = "bg-emerald-500/20 text-emerald-400";
        let label = "";

        if (impactPercent < 0.1) return;

        let danger = false;
        if (impactPercent > 8) {
            danger = true;
            colorClass = "bg-red-500/20 text-red-400";
            label = t("high_price_impact");
        } else if (impactPercent > 1) {
            colorClass = "bg-yellow-500/20 text-yellow-400";
            label = "";
        }

        return (
            <div className="relative group/tooltip inline-block ml-2 cursor-help">
                <div
                    className={`flex items-center gap-1 ${danger ? "text-[12px]" : "text-[10px]"} px-1.5 py-0.5 rounded ml-2 font-medium whitespace-nowrap ${colorClass}`}
                >
                    {danger ? <TriangleAlert size={danger ? 12 : 10} /> : null}
                    {label} - {impactPercent.toFixed(2)}%
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1F243A] text-gray-200 text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal w-48 text-center border border-white/10 shadow-xl z-50">
                    {t("price_impact_tooltip")}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1F243A] rotate-45 border-r border-b border-white/10"></div>
                </div>
            </div>
        );
    };

    const t = useTranslations("HomePage.Swap");
    return (
        <>
            <div className="bg-[#0F111A] rounded-2xl p-4 mt-2 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>{t("you_receive")}</span>
                    <span>
                        {t("balance")}:{" "}
                        {form.receive.token.loading ? (
                            <span className="animate-pulse bg-white/10 w-10 h-3 rounded"></span>
                        ) : (
                            <span className="text-white/90">
                                {form.receive.token.balance?.formatted
                                    ? Number(
                                          form.receive.token.balance.formatted,
                                      ).toFixed(form.isEthToDare ? 2 : 6)
                                    : "0.00"}
                            </span>
                        )}{" "}
                        {form.receive.token.symbol}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    {status.isQuoteLoading && form.pay.active ? (
                        <div className="w-2/3 h-9 flex items-center">
                            <Loader2
                                className="animate-spin text-purple-600"
                                size={24}
                            />
                            <span className="ml-3 text-white/30 text-sm">
                                {t("fetching_rate")}
                            </span>
                        </div>
                    ) : (
                        <input
                            type="text"
                            inputMode="decimal"
                            value={form.receive.amount}
                            onChange={form.receive.setAmount}
                            className="bg-transparent text-3xl text-white font-medium outline-none w-2/3 placeholder-gray-600"
                            placeholder="0.0"
                        />
                    )}
                    <button
                        className={`flex items-center bg-[#1F243A] text-white px-3 py-1.5 rounded-full font-medium transition-all border border-white/10 ring-2 ${form.isEthToDare ? "ring-purple-500/20" : "ring-blue-500/20"}`}
                    >
                        <TokenIcon
                            symbol={form.receive.token.symbol}
                            color={form.receive.token.color}
                        />
                        {form.receive.token.symbol}
                    </button>
                </div>
                {status.quoteError ? (
                    <span className="text-red-400">{status.quoteError}</span>
                ) : status.isQuoteLoading ? null : (
                    <div className="flex items-center">
                        ≈ $
                        {form.receive.usdValue.toLocaleString("en-US", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                        })}
                        {renderPriceImpact()}
                    </div>
                )}
            </div>

            {/* Price Info */}
            <div className="flex justify-between items-center px-4 py-3 text-sm">
                <div
                    className={`flex items-center font-medium cursor-pointer  ${status.isDarePriceError ? "text-red-500  hover:text-red-400" : "text-cyan-400  hover:text-cyan-300"}`}
                >
                    <Info size={14} className="mr-1" />
                    {status.isDarePriceError ? (
                        t("error_retrieving_price")
                    ) : status.isDarePriceLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />{" "}
                            <span className="ml-2">
                                {t("fetching_dare_price")}
                            </span>
                        </>
                    ) : form.isEthToDare ? (
                        form.currentDarePrice?.formattedFromEthToDare
                    ) : (
                        form.currentDarePrice?.formattedFromDareToEth
                    )}
                </div>
                {/* <div className="flex items-center text-gray-400">
              <span className="mr-2">Gas</span>
              <span className="text-white font-medium">$4.50</span>
            </div> */}
            </div>
        </>
    );
};

export default SwapOutput;
