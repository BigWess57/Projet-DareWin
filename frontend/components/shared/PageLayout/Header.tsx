import Image from 'next/image'
import Link from "next/link";

import { tokenAbi, tokenAddress, feeTierBronzeCap, feeTierSilverCap, feeTierGoldCap} from "@/constants/TokenInfo";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { formatEther } from "viem";
import { useAccount, useReadContract } from "wagmi";

// import { HiHome, HiLightningBolt, HiOutlineUser, HiOutlineClipboardList } from 'react-icons/hi'

const Header = (/*{ activePage }: { activePage: 'home' | 'create' | 'profile' | 'brands' }*/) => {
    const {address} = useAccount()
    
    const { data: balance, error: error, isPending: IsPending, refetch: refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'balanceOf',
        args: [address],
        account: address as `0x${string}` | undefined
    })

    const displayBalance = (() => {
        if (IsPending) return 'Loading…';
        if (error) return 'Error fetching balance';
        
        return typeof balance === 'bigint' ? formatEther(balance) : "ERROR FETCHING BALANCE"
    })()

    const displayFeeTier = (() => {
        if (IsPending) return null;
        if (error) return null;
        
        if(balance as bigint < feeTierBronzeCap){
            return <span className='text-orange-500 font-bold'>BRONZE</span>
        }else if(balance as bigint < feeTierSilverCap){
            return <span className='text-slate-500 font-bold'>SILVER</span>
        }else if(balance as bigint < feeTierGoldCap){
            return <span className='text-yellow-500 font-bold'>GOLD</span>
        }else {
            return <span className='text-cyan-500 font-bold'>PLATINUM</span>
        }
    })()


    // const linkClasses = (page: string) =>
    // `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition 
    //  ${activePage === page
    //    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg'
    //    : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'}`

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
            <div className='flex flex-col items-center'>
                <ConnectButton />
                <div className='mt-4'>Balance : <span className='font-bold ml-1'>{displayBalance} DARE</span></div>
                <div>Fee tier : {displayFeeTier}</div>
            </div>
        </nav>
        
        //     <nav className="w-full flex items-center gap-6 px-8 py-4 bg-[#0B1126]">
      
        // {/* Logo */}
        // <div className="flex items-center gap-2">
        //     <div
        //     className="flex items-center justify-center h-10 w-10 rounded-lg 
        //                 bg-gradient-to-br from-cyan-400 to-blue-500 text-xl font-bold text-white"
        //     >
        //     D
        //     </div>
        //     <h1 className="flex items-center text-lg font-bold tracking-wide">
        //     <span className="text-cyan-400">DARE</span><span className="text-white">WIN</span>
        //     <span className="ml-2 px-2 py-0.5 text-xs font-medium uppercase bg-[#1F2240] text-white rounded">
        //         BETA
        //     </span>
        //     </h1>
        // </div>

        // {/* Nav Links */}
        // <ul className="flex items-center gap-3">
        //     <li>
        //     <Link href="/" className={linkClasses('home')}>
        //         <HiHome className="text-lg" /> ACCUEIL
        //     </Link>
        //     </li>
        //     <li>
        //     <Link href="/createchallenge" className={linkClasses('create')}>
        //         <HiLightningBolt className="text-lg" /> CRÉER
        //     </Link>
        //     </li>
        //     <li>
        //     <Link href="/profile" className={linkClasses('profile')}>
        //         <HiOutlineUser className="text-lg" /> PROFIL
        //     </Link>
        //     </li>
        //     <li>
        //     <Link href="/brands" className={linkClasses('brands')}>
        //         <HiOutlineClipboardList className="text-lg" /> MARQUES
        //     </Link>
        //     </li>
        // </ul>

        // {/* Spacer + Wallet */}
        // <div className="ml-auto">
        //     <ConnectButton
        //     showBalance={false}
        //     chainStatus="none"
        //     className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 
        //                 rounded-xl text-sm font-semibold text-white 
        //                 hover:brightness-110 transition"
        //     />
        // </div>
        // </nav>
    )
}

export default Header;