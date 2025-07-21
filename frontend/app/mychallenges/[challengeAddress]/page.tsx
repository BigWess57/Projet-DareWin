'use client'
import ChallengePage from '@/components/shared/RouteBaseElements/ChallengePage'
import { useParams } from 'next/navigation'
import React from 'react'


function page() {

    const params = useParams()
    const addr = params.challengeAddress as `0x${string}`

    if (!addr) {
        return <div>Loading...</div>
    }

    return (
        <ChallengePage contractAddress={addr} />
    )
}

export default page