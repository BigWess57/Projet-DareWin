import {
    Clock1,
    Clock2,
    Clock3,
    Clock4,
    Clock5,
    Clock6,
    Clock7,
    Clock8,
    Clock9,
    Clock10,
    Clock11,
    Clock12,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const calculateTimeLeft = (start: number, dur: number) => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(start + dur - now, 0);
};

export function ChallengeTimer({
    startingTime,
    duration,
    refreshDisplay = async () => {},
}: {
    startingTime: bigint;
    duration: bigint;
    refreshDisplay?: () => Promise<void>;
}) {
    const t = useTranslations("Challenge.ChallengeTimer");
    const start = Number(startingTime);
    const dur = Number(duration);

    const [displayTimer, setDisplayTimer] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<number>(
        calculateTimeLeft(start, dur),
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayTimer((prev) => {
                if (!prev) return true;
                return prev;
            });
            const amountTimeLeft = calculateTimeLeft(start, dur);
            if (amountTimeLeft == 0) {
                refreshDisplay();
            }
            setTimeLeft(amountTimeLeft);
        }, 1000);

        return () => clearInterval(interval);
    }, [start, dur, refreshDisplay]);

    const hours = Math.floor(timeLeft / 3600)
        .toString()
        .padStart(2, "0");
    const minutes = Math.floor((timeLeft % 3600) / 60)
        .toString()
        .padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");

    //For displaying spinning clock
    const [idx, setIdx] = useState(0);
    const clockIcons = [
        Clock1,
        Clock2,
        Clock3,
        Clock4,
        Clock5,
        Clock6,
        Clock7,
        Clock8,
        Clock9,
        Clock10,
        Clock11,
        Clock12,
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIdx((i) => (i + 1) % clockIcons.length);
        }, 250);
        return () => clearInterval(interval);
    }, [clockIcons.length]);

    const Icon = clockIcons[idx];

    return (
        <div className="space-y-2">
            <div className="text-white text-base">{t("time_remaining")}</div>
            {!displayTimer ? (
                <div className="italic">{t("loading")}</div>
            ) : (
                <div className="flex items-center text-xl font-mono text-cyan-400">
                    <Icon className="mr-5 w-8 h-8 text-cyan-400 animate-pulse" />{" "}
                    {hours}:{minutes}:{seconds}
                </div>
            )}
        </div>
    );
}
