'use client'

import Header from "./Header";
import Footer from "./Footer";

import { NotConnected } from "../Miscellaneous/NotConnected";
import { useAccount } from "wagmi";


const Layout = ({ children }: Readonly<{
  children: React.ReactNode;
}>) => {
    const {isConnected} = useAccount()
    return (
        <div className="app">
            <Header />
            <main className="main">
                {isConnected ? (
                    <>{children}</>
                ) : (
                    <NotConnected />
                )}
            </main>
            <Footer />
        </div>
    )
}

export default Layout;