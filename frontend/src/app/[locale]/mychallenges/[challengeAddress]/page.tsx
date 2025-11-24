'use client'
import ChallengePage from '@/src/components/shared/RouteBaseElements/ChallengePage'
import { Locale, useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { useParams } from 'next/navigation'
import { use } from 'react';


function page() {

    const t = useTranslations('Challenge');
    
    const params = useParams()
   
    const addr = params.challengeAddress as `0x${string}`

    if (!addr) {
        return <div>{t('loading')}</div>
    }

    return (
        <ChallengePage contractAddress={addr} />
    )
}

export default page