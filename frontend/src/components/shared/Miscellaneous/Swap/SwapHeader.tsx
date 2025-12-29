import { SwapSettings } from "@/utils/types";
import { AlertTriangle, Info, Settings, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type SwapHeaderProps = {
    settings: SwapSettings;
};

const SwapHeader = ({ settings }: SwapHeaderProps) => {
    const t = useTranslations("HomePage.Swap");

    // Settings State
    const [showSettings, setShowSettings] = useState<boolean>(false);

    // Refs for click outside handling
    const settingsRef = useRef<HTMLDivElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);

    // --- CLICK OUTSIDE HANDLER ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close if click is NOT in the settings modal AND NOT on the settings button
            if (
                showSettings &&
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node) &&
                settingsButtonRef.current &&
                !settingsButtonRef.current.contains(event.target as Node)
            ) {
                setShowSettings(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSettings]);

    return (
        <>
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-white font-semibold text-lg">
                    {t("title")}
                </h3>
                <div className="flex gap-2">
                    <button className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <Info size={20} />
                    </button>
                    <button
                        ref={settingsButtonRef}
                        onClick={() => setShowSettings(!showSettings)}
                        className={`text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full ${showSettings ? "bg-white/10 text-white" : ""}`}
                    >
                        <Settings size={20} />
                    </button>
                </div>

                {/* SETTINGS MODAL */}
                {showSettings && (
                    <div
                        ref={settingsRef}
                        className="absolute top-12 right-2 z-50 bg-[#1F243A] border border-white/10 rounded-xl p-4 shadow-xl w-64 animate-in fade-in zoom-in-95 duration-200"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-semibold text-white">
                                {t("transaction_settings")}
                            </span>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full p-1"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="text-xs text-gray-400 mb-2 font-medium">
                            {t("slippage_tolerance")}
                        </div>
                        <div className="flex gap-2 mb-3">
                            {[0.5, 1.0, 2.0, 5.0].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => settings.setSlippage(val)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${settings.slippage === val ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}
                                >
                                    {val}%
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <div
                                className={`flex items-center bg-[#0F111A] border rounded-lg px-3 py-2 ${settings.slippage > 5 || settings.slippage < 0.01 ? "border-yellow-500/50" : "border-white/10"}`}
                            >
                                <input
                                    type="number"
                                    value={settings.slippage}
                                    onChange={(e) =>
                                        settings.setSlippage(
                                            parseFloat(e.target.value),
                                        )
                                    }
                                    className={`bg-transparent text-right text-sm outline-none w-full font-medium ${settings.slippage > 5 || settings.slippage < 0.01 ? "text-yellow-400" : "text-white"}`}
                                    placeholder="Custom"
                                    min="0"
                                    max="50"
                                    step="0.1"
                                />
                                <span className="text-gray-400 text-xs ml-1 font-medium">
                                    %
                                </span>
                            </div>
                        </div>
                        {settings.slippage > 5 && (
                            <div className="flex items-start gap-1.5 mt-2 text-yellow-400/90 text-[10px] leading-tight bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
                                <AlertTriangle
                                    size={12}
                                    className="shrink-0 mt-0.5"
                                />
                                <span>{t("frontrun_warning")}</span>
                            </div>
                        )}
                        {settings.slippage < 0.5 && (
                            <div className="flex items-start gap-1.5 mt-2 text-yellow-400/90 text-[10px] leading-tight bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
                                <AlertTriangle
                                    size={12}
                                    className="shrink-0 mt-0.5"
                                />
                                <span>{t("fail_warning")}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default SwapHeader;
