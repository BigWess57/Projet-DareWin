'use client'
import ChallengePage from '@/components/shared/RouteBaseElements/ChallengePage'
import { useParams } from 'next/navigation'
import React from 'react'


function page() {

    const params = useParams()
    const addr = params.challengeAddress as `0x${string}`

    if (!addr) {
        // While waiting for params, you can show a loading indicator or return null
        return <div>Loading...</div>
    }

    return (
        <ChallengePage contractAddress={addr} />
        // <div>Address : {challengeAddress}</div>
    )
}

export default page