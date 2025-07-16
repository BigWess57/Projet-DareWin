import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from 'next/image'
import Link from "next/link";

const Header = () => {
    return (
        <nav className="navbar">
            
            <div className="relative h-[50px] w-[200px] border">
            <Image
                src="/Logo DareWin allongé bleu.png"
                alt="Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority // loads immediately
            />
            </div>
            <ul className="flex flex-1 justify-around bg-lime-600 p-5 rounded-xl text-white">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/createchallenge">Create Challenge</Link></li>
                <li><Link href="/mychallenges">My Challenges</Link></li>
            </ul>
            <div>
                <ConnectButton />
            </div>
        </nav>
    )
}

export default Header;