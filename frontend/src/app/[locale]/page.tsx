
import { use } from "react";
import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import Layout from "@/src/components/shared/PageLayout/Layout";


export default function Home({params}: PageProps<'/[locale]'>) {

  const {locale} = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  return (
    <Layout/>
  );
}
