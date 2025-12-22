"use client";
import ChallengePage from "@/src/components/shared/RouteBaseElements/ChallengePage";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

function Challenge() {
    const t = useTranslations("Challenge");

    const params = useParams();

    const addr = params.challengeAddress as `0x${string}`;

    if (!addr) {
        return <div>{t("loading")}</div>;
    }

    return <ChallengePage contractAddress={addr} />;
}

export default Challenge;
