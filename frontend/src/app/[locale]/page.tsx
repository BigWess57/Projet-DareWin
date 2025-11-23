
import { use } from "react";
import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { NotConnected } from "@/src/components/shared/Miscellaneous/NotConnected";
import HomePage from "@/src/components/shared/RouteBaseElements/HomePage";

import { useAccount } from "wagmi";
import Layout from "@/src/components/shared/PageLayout/Layout";

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default function Home({children, params}: Props) {

  const {locale} = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);
  
  // const {isConnected} = useAccount();

  return (
    // <div>
    //   {isConnected ? (
    //     <HomePage/>
    //   ) : (
    //     <NotConnected/>
    //   )}
    // </div>
    <Layout>
      {children}
    </Layout>
  );
}
