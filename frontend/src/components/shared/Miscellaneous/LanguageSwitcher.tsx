'use client';

import Image from "next/image";
import {ChangeEvent, useTransition} from 'react';
import {Locale} from 'next-intl';

import {useParams} from 'next/navigation';
import {usePathname, useRouter, getPathname} from '@/src/i18n/navigation';

import FR from '@/public/icons/france-flag.svg'
import UK from '@/public/icons/uk-flag.svg'

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(lang: string) {
    const nextLocale = lang as Locale;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        {pathname, params},
        {locale: nextLocale}
      );
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => onSelectChange('en')}
        className={`rounded-md text-sm font-medium transition-colors ${
          isPending 
            ? 'bg-transparent text-white'
            : params.locale === 'en'
              ? 'bg-gray-500 text-white'
              : 'bg-gray-800 text-white/90 hover:bg-gray-300'
        }`}
        disabled={ isPending || params.locale === 'en'}
      >
        {isPending && params.locale === 'fr' ? (
          'Switching...'
        ) : (
          <div>
            <Image 
              src={UK}
              alt="United Kingdom"
              className="w-12 h-8"
              priority
            />
          </div>
        )}
      </button>
      <button
        onClick={() => onSelectChange('fr')}
        className={`rounded-md text-sm font-medium transition-colors ${
          isPending 
            ? 'bg-transparent text-white'
            : params.locale === 'fr'
              ? 'bg-gray-500 text-white'
              : 'bg-gray-800 text-white/90 hover:bg-gray-300'
        }`}
        disabled={ isPending || params.locale === 'fr'}
      >
        {isPending && params.locale === 'en' ? (
          'Switching...'
        ) : (
          <div>
            <Image 
              src={FR}
              alt="France"
              className="w-12 h-8"
              priority
            />
          </div>
        )}
      </button>
    </div>
  );
}