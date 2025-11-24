import ChallengeFactory from "@/src/components/shared/RouteBaseElements/ChallengeFactory";
import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

export default function myChallenges({
  params
}: PageProps<'/[locale]/createchallenge'>) {

  const {locale} = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  return (
    <>
      <ChallengeFactory/>
    </>
  );
}