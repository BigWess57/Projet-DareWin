import { useTranslations } from "next-intl";

import { Address } from "viem";
import { useRouter } from "next/navigation";
import { ChallengeTabs } from "../Miscellaneous/ChallengeTabs";
import useFetchChallengesCreated from "../../hooks/useFetchChallengesCreated";

export type Challenge = {
    description: string;
    creator: Address;
    contractAddress: Address;
    duration: string;
    bid: string;
    timestampOfCreation: string;
};

const LoadingSpinner = () => {
    const t = useTranslations("MyChallenges.ChallengeList");

    return (
        <div className="flex flex-col items-center justify-center p-8 pt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-gray-600">{t("loading")}</p>
        </div>
    );
};

const ChallengeList = () => {
    const {
        loadingChallenges,
        challengesCreated,
        challengesJoined,
        latestChallenges,
    } = useFetchChallengesCreated();

    const router = useRouter();

    //Redirection when challenge address is entered
    function handleChallengeClick(challengeAddress: Address) {
        router.push(`/mychallenges/${challengeAddress}`);
    }

    return (
        <>
            {loadingChallenges ? (
                <LoadingSpinner />
            ) : (
                <ChallengeTabs
                    challengesCreated={challengesCreated}
                    challengesJoined={challengesJoined}
                    latestChallenges={latestChallenges}
                    handleChallengeClick={handleChallengeClick}
                />
            )}
        </>
    );
};

export default ChallengeList;
