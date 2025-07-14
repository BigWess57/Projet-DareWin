import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from 'next/image'

const Header = () => {
    return (
        <nav className="navbar">
            
            <div className="relative h-[50px] w-[200px]">
            <Image
                src="/Logo DareWin allongé bleu.png"
                alt="Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority // loads immediately
            />
            </div>
                
            <div>
                <ConnectButton />
            </div>
        </nav>
    )
}

export default Header;