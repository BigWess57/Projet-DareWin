'use client'

import ChallengeList from "@/components/shared/ChallengeList"

export default function myChallenges() {

  return (
    <>
      <div className='text-3xl flex justify-center'>My challenges :</div>
      <ChallengeList/>
    </>
  );
}