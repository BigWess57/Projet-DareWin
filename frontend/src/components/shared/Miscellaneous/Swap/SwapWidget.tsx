"use client";
import { ArrowDownUp, Loader2, Wallet } from "lucide-react";
import { Button } from "../../../ui/button";

import { CurrentTransactionToast } from "../CurrentTransactionToast";
import { useTranslations } from "next-intl";

import useSwapWidgetLogic from "../../../hooks/useSwapWidgetLogic";
import SwapInput from "./SwapInput";
import SwapOutput from "./SwapOutput";
import SwapHeader from "./SwapHeader";

interface TokenIconProps {
    symbol: string;
    color: string;
}

export const TokenIcon = ({ symbol, color }: TokenIconProps) => (
    <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white mr-2 ${color}`}
    >
        {symbol[0]}
    </div>
);

const SwapWidget = () => {
    const t = useTranslations("HomePage.Swap");

    //CUSTOM HOOKS

    const { form, settings, status, execution } = useSwapWidgetLogic();

    // --- RENDERING ---
    return (
        <div className="w-full max-w-md mx-auto">
            {/* Glow Effect */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl opacity-40 blur-lg group-hover:opacity-60 transition duration-500"></div>

                <div className="relative bg-[#151929] border border-white/10 rounded-3xl p-4 shadow-2xl">
                    {/* Header */}
                    <SwapHeader settings={settings} />

                    {/* Pay Input Section */}
                    <SwapInput form={form} status={status} />

                    {/* Switch Button (Centered) */}
                    <div className="relative h-4 flex justify-center items-center z-10">
                        <button
                            onClick={form.switchDirection}
                            className="absolute bg-[#1F243A] border-4 border-[#151929] rounded-xl p-2 text-cyan-400 transition-all shadow-lg  hover:text-white hover:bg-cyan-600 hover:scale-110 active:scale-95"
                        >
                            <ArrowDownUp
                                size={30}
                                className={`duration-300 ${!form.isEthToDare ? "rotate-180" : ""}`}
                            />
                        </button>
                    </div>

                    {/* Receive Input Section */}
                    <SwapOutput form={form} status={status} />

                    {/* Action Button */}
                    {!status.isConnected ? (
                        <button className="w-full bg-cyan-600/20  text-cyan-400 font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2">
                            <Wallet size={20} />
                            {t("connect_wallet")}
                        </button>
                    ) : (
                        <Button
                            onClick={execution.handleSwap}
                            disabled={
                                !form.pay.amount ||
                                execution.isSwapping ||
                                status.isInsufficientBalance ||
                                status.isQuoteLoading ||
                                !!status.quoteError
                            }
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-8 text-xl rounded-2xl shadow-lg shadow-purple-500/25 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {execution.isSwapping ? (
                                <>
                                    <Loader2
                                        size={20}
                                        className="animate-spin"
                                    />
                                    <span className="ml-2">
                                        {t("swapping")}
                                    </span>
                                </>
                            ) : status.isInsufficientBalance ? (
                                t("insufficient_balance")
                            ) : status.quoteError ? (
                                t("invalid_amount")
                            ) : status.isQuoteLoading ? (
                                t("fetching_price")
                            ) : !form.pay.amount ? (
                                t("enter_amount")
                            ) : (
                                t("swap_tokens")
                            )}
                        </Button>
                    )}

                    <CurrentTransactionToast
                        isConfirming={execution.isConfirming}
                        isSuccess={execution.isSuccess}
                        successMessage={t("swap_success")}
                        txHash={execution.hash}
                    />
                </div>
            </div>
        </div>
    );
};

export default SwapWidget;
