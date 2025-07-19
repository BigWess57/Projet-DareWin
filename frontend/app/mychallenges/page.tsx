'use client'

import ChallengeList from "@/components/shared/RouteBaseElements/ChallengeList"

export default function myChallenges() {

  return (
    <>
      <div className='text-3xl font-bold flex justify-center'>Mes challenges :</div>
      <ChallengeList/>
    </>
  );
}