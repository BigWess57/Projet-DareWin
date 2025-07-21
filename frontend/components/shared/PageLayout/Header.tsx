'use client'
import Image from 'next/image'
import Link from "next/link";

import { tokenAbi, tokenAddress, feeTierBronzeCap, feeTierSilverCap, feeTierGoldCap, TierBronzeFee, TierSilverFee, TierGoldFee, TierPlatinumFee} from "@/constants/TokenInfo";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { formatEther } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { usePathname } from 'next/navigation';

import { Home, Zap, PencilRuler } from 'lucide-react'
import { FeeTierExplanation } from '../Miscellaneous/FeeTierExplanation';

const Header = () => {

/************
 * Blockchain interaction
 ************/
    const {address, isConnected} = useAccount()
    
    const { data: balance, error: error, isPending: IsPending, refetch: refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'balanceOf',
        args: [address],
        account: address as `0x${string}` | undefined,
        query: {
            enabled: Boolean(address),
            refetchInterval: 5_000,
        },
    })

/******Display ******/
    const displayBalance = (() => {
        if (!isConnected) return { success: false, message: "-" };
        if (IsPending) return { success: false, message: "Chargement..." };
        if (error) return { success: false, message: "Erreur lors du fetch du solde" };
        
        if (typeof balance === 'bigint') {
            return { success: true, message: formatEther(balance) };
        }

        return { success: false, message: "Erreur inattendue" };
    })()

    const displayFeeTier = (() => {
        if (!isConnected) return "-"
        if (IsPending) return null;
        if (error) return null;

        const balanceFormated = Number(formatEther(balance as bigint))
        if(balanceFormated < feeTierBronzeCap){
            return <span className='text-[#CE8946] font-bold'>BRONZE - {TierBronzeFee} de frais</span>
        }else if(balanceFormated < feeTierSilverCap){
            return <span className='text-slate-400 font-bold'>SILVER - {TierSilverFee} de frais</span>
        }else if(balanceFormated < feeTierGoldCap){
            return <span className='text-yellow-400 font-bold'>GOLD - {TierGoldFee} de frais</span>
        }else {
            return <span className='text-cyan-400 font-bold'>PLATINUM - {TierPlatinumFee} de frais</span>
        }
    })()


    const pathname = usePathname()
    const isActive = {
        home: pathname === '/',
        create: pathname.startsWith('/createchallenge'),
        mychallenges: pathname.startsWith('/mychallenges'),
    }
    const linkClasses = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
      active
        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg'
        : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
    }`

    return (
        <nav className="w-full flex items-center gap-6 px-8 py-4 bg-[#0B1126] border-b border-white/20">
            {/* Logo + texte */}
            {/* <div className="flex items-center gap-2">
                <div
                className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-xl font-bold text-white"
                >
                D
                </div>
                <h1 className="flex items-center text-lg font-bold tracking-wide">
                <span className="text-cyan-400">DARE</span><span className="text-white">WIN</span>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium uppercase bg-[#1F2240] text-white rounded">
                    BETA
                </span>
                </h1>
            </div> */}
            <div className="relative h-[50px] w-[200px]">
                <Image
                    src="/Logo DareWin allongé blanc.png"
                    alt="Logo"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>

            {/* Liens de navigation */}
            <ul className="flex items-center gap-3">
                <li>
                <Link href="/" className={linkClasses(isActive.home)}>
                    <Home size={20} /> ACCUEIL
                </Link>
                </li>
                <li>
                <Link href="/createchallenge" className={linkClasses(isActive.create)}>
                    <PencilRuler size={20} /> CRÉER
                </Link>
                </li>
                <li>
                <Link href="/mychallenges" className={linkClasses(isActive.mychallenges)}>
                    <Zap size={20} /> MES CHALLENGES
                </Link>
                </li>
            </ul>

            {/* Infos Wallet (balance + fee tier) */}
            <div className="ml-auto flex gap-10 items-center text-sm text-white/80 gap-1">

                <div className="px-4 py-3 rounded-xl bg-[#1F243A] border border-white/10 text-sm text-white shadow-sm">
                    <div className="text-white/90 text-lg mb-1">
                        Balance : <span className="ml-2 font-semibold text-white-400 text-xl font-mono tracking-wide">
                            { displayBalance.success ?
                                <>{Number(displayBalance.message).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 6,
                                })} DARE</> : displayBalance.message
                            } 
                        </span>
                    </div>
                    <div className='flex items-center'>
                        <div className="text-white/60">Palier de frais : <span className="text-white/80">{displayFeeTier}</span></div>
                        <FeeTierExplanation/>
                    </div>
                    
                </div>

                <ConnectButton.Custom>
                    {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                        const ready = mounted
                        const connected = ready && account && chain && !chain.unsupported

                        return (
                        <div {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' } })}>
                            {!connected ? (
                            <button
                                onClick={openConnectModal}
                                type="button"
                                className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition"
                            >
                                Se connecter
                            </button>
                            ) : chain.unsupported ? (
                            <button
                                onClick={openChainModal}
                                className="px-4 py-2 border border-red-400 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition"
                            >
                                Mauvais réseau
                            </button>
                            ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={openChainModal}
                                    className="flex items-center px-3 py-2 bg-gray-800 rounded-xl text-sm text-white hover:bg-gray-700 transition"
                                >
                                    {chain.hasIcon && (
                                        <div className="h-5 w-5 rounded-full overflow-hidden mr-2 bg-white">
                                            <img src={chain.iconUrl!} alt={chain.name} />
                                        </div>
                                    )}
                                    <span>{chain.name}</span>
                                </button>
                                <button
                                    onClick={openAccountModal}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition"
                                >
                                    {account.displayName}
                                    {account.displayBalance ? ` (${account.displayBalance})` : ''}
                                </button>
                            </div>
                            )}
                        </div>
                        )
                    }}
                </ConnectButton.Custom>
            </div>
        </nav>
    )
}

export default Header;