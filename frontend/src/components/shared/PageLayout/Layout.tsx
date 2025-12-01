'use client'

import Header from "./Header";
import Footer from "./Footer";

import { NotConnected } from "../Miscellaneous/NotConnected";
import { useAccount } from "wagmi";


const Layout = ({ children }: { children: React.ReactNode }) => {
    const {isConnected} = useAccount()
    return (
        <div className="app">
            <Header />
            <main className="p-10 relative min-h-screen text-white overflow-hidden
             bg-[radial-gradient(circle_at_center,_#1A2545,_#0F111A)]">
                <div className="absolute inset-0
               bg-[radial-gradient(ellipse_at_center,_rgba(80,120,200,0.12)_0%,transparent_80%)] 
               pointer-events-none"  />
                {isConnected ? (
                    children
                ) : (
                    <NotConnected />
                )}
            </main>
            <Footer />
        </div>
    )
}

export default Layout;