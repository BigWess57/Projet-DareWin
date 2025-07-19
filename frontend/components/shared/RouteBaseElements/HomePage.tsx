import Link from 'next/link'
import React from 'react'

const HomePage = () => {
  return (
    <div>

      {/* Hero */}
      <section className="flex flex-col items-center text-center pt-24 pb-16 px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          Challenge • Vote • Gagne
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-8">
          Rejoins la communauté qui transforme chaque défi en aventure blockchain ludique et sécurisée.
        </p>
        <Link
          href="/createchallenge"
          className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-lg font-semibold text-white shadow-lg hover:brightness-110 transition"
        >
          Commencer
        </Link>
      </section>

      {/* How It Works */}
      <section className="px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Comment ça marche ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Étape 1 */}
          <div className="bg-[#1F243A] border border-white/10 rounded-xl p-6 flex flex-col h-full shadow-sm">
            <h3 className="text-xl font-semibold mb-2">1. Crée ton défi</h3>
            <p className="text-white/70 flex-grow">
              Défini la durée, la mise en DARE et le nombre de participants (ou choisis un groupe privé).
            </p>
          </div>
          {/* Étape 2 */}
          <div className="bg-[#1F243A] border border-white/10 rounded-xl p-6 flex flex-col h-full shadow-sm">
            <h3 className="text-xl font-semibold mb-2">2. Participe ou invite</h3>
            <p className="text-white/70 flex-grow">
              Paye ta mise en DARE et rejoins le challenge!
            </p>
          </div>
          {/* Étape 3 */}
          <div className="bg-[#1F243A] border border-white/10 rounded-xl p-6 flex flex-col h-full shadow-sm">
            <h3 className="text-xl font-semibold mb-2">3. Relevez le défi</h3>
            <p className="text-white/70 flex-grow">
              Réalisez votre exploit dans le temps imparti et capturez l’attention de la communauté.
            </p>
          </div>
          {/* Étape 4 */}
          <div className="bg-[#1F243A] border border-white/10 rounded-xl p-6 flex flex-col h-full shadow-sm">
            <h3 className="text-xl font-semibold mb-2">4. Votez pour le vainqueur</h3>
            <p className="text-white/70 flex-grow">
              Les participants votent en toute transparence sur la meilleure performance.
            </p>
          </div>
          {/* Étape 5 */}
          <div className="bg-[#1F243A] border border-white/10 rounded-xl p-6 flex flex-col h-full shadow-sm">
            <h3 className="text-xl font-semibold mb-2">5. Automatisation & récompense</h3>
            <p className="text-white/70 flex-grow">
              À la fin du vote, le smart contract distribue automatiquement la cagnotte aux gagnants.
            </p>
          </div>
          {/* Étape 6 */}
          <div className="bg-[#1F243A] border border-white/10 rounded-xl p-6 flex flex-col h-full shadow-sm">
            <h3 className="text-xl font-semibold mb-2">6. Répétez</h3>
            <p className="text-white/70 flex-grow">
              Lancez un nouveau défi, changez de mise ou passez en mode privé pour relever toujours plus de challenges !
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <section className="py-12 text-center px-6">
        <h2 className="text-2xl font-bold mb-4">
          Prêt à relever le prochain défi ?
        </h2>
      </section>
    </div>
  )
}

export default HomePage