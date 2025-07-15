import { useState, useEffect, useContext } from 'react'
// import { RefreshDisplayContext } from '../ChallengeState';

export function ChallengeTimer({
  startingTime,
  duration,
  refreshDisplay = async () => {},
}: {
  startingTime: bigint
  duration: bigint
  refreshDisplay?: () => Promise<void>
}) {

    // const refreshDisplay = useContext(RefreshDisplayContext);

    const start = Number(startingTime)
    const dur = Number(duration)

    const calculateTimeLeft = () => {
        const now = Math.floor(Date.now() / 1000)
        return Math.max(start + 35 - now, 0)
    }

    const [timeLeft, setTimeLeft] = useState<number>(calculateTimeLeft)

    useEffect(() => {
        const interval = setInterval(() => {
            const amountTimeLeft = calculateTimeLeft()
            //If time left is 0, refresh the state display (go to voting/challengeWon)
            if(amountTimeLeft == 0){
                refreshDisplay()
            }
            setTimeLeft(amountTimeLeft)
        }, 1000)

        return () => clearInterval(interval)
    }, [start, dur])

    const hours = Math.floor(timeLeft / 3600)
        .toString()
        .padStart(2, '0')
    const minutes = Math.floor((timeLeft % 3600) / 60)
        .toString()
        .padStart(2, '0')
    const seconds = (timeLeft % 60).toString().padStart(2, '0')

    return (
        <div className="text-lg font-mono">
        ⏳ {hours}:{minutes}:{seconds}
        </div>
    )
}