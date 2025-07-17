'use client'
import ChallengePage from "@/components/shared/ChallengePage";

export default function myChallenges() {

  // const getChallengeEndedEvents = async() => {
  
  //     //Get the latest block - 100, to only get the few last blocks
  //     const latest = await publicClient.getBlockNumber();
  //     const from = latest > 100n ? latest - 100n : 0n;

  //     const Logs = await publicClient.getLogs({
  //         address: factoryAddress,
  //         event: parseAbiItem("event ChallengeCreated(address indexed admin, address challengeAddress, uint256 blockNumber)"),
  //         fromBlock: from,
  //         toBlock: 'latest'
  //     })
  //     console.log("New Challenge creation event!", Logs)
  //     if (Logs.length === 0) {
  //         console.error("No recently created challenge has been found")
  //         return null;
  //     }else{
  //           // Loop through logs in reverse to find latest match
  //         for (let i = Logs.length - 1; i >= 0; i--) {
  //             const log = Logs[i];
  //             const logAdmin = log.args?.admin;
  //             const challengeAddress = log.args?.challengeAddress;

  //             if (logAdmin && address && isAddressEqual(logAdmin, address)) {
  //                 console.log("Latest challenge created by user:", challengeAddress);
  //                 return challengeAddress;
  //             }
  //         }

  //         console.error("No challenge found created by current user");
  //         return null;
  //     }
  // }

  return (
    <>
      <div className='text-3xl'>My challenges :</div>
      {/* <ChallengePage></ChallengePage> */}
    </>
  );
}