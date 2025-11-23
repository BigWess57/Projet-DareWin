import Link from 'next/link'
import React from 'react'

import {useTranslations} from 'next-intl';

const HomePage = () => {

  const t = useTranslations('HomePage');

  return (
    <div>
    {/* Decorative SVG circles */}
      <div className="absolute top-20 right-1/6 w-96 h-96 bg-cyan-500/20 rounded-full animate-pulse" />
      <div className="absolute top-60 left-1/6 w-72 h-72 bg-cyan-500/20 rounded-full" />
      <div className="absolute bottom-40 right-1/3 w-56 h-56 bg-purple-500/20 rounded-full animate-spin-slow" />

      <section
        className="
          relative flex flex-col items-center text-center 
          pt-24 pb-16 px-6 overflow-hidden
        "
      >
        {/* Main content */}
        <h1 className="relative text-6xl md:text-6xl font-extrabold pb-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-pink-500 to-purple-500 animate-text">
          {/* Play - Dare - Win */}{t('title')}
        </h1>
        <p className="relative text-lg md:text-xl mb-8 max-w-2xl text-white-200 animate-fade-in">
          Rejoins la communauté qui transforme chaque défi en aventure blockchain{" "}
          <span className="text-pink-400 font-semibold">ludique</span> et{" "}
          <span className="text-cyan-300 font-semibold">sécurisée</span>.
        </p>
        <Link
          href="/createchallenge"
          className="
            relative z-10 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 
            rounded-2xl text-lg font-semibold text-white shadow-2xl 
            hover:scale-105 hover:brightness-110 transition-transform duration-300
          "
        >
          Commencer
        </Link>
      </section>

      {/* How It Works */}
      <section className="relative px-6 pb-16 overflow-hidden">
        
        <h2 className="relative text-3xl md:text-4xl font-extrabold text-center text-white mb-12 z-10">
          Comment ça marche ?
        </h2>
        
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 z-10">
          {[
            {
              title: "1. Crée ton défi",
              desc: "Défini la durée, la mise en DARE et le nombre de participants (ou choisis un groupe privé).",
              color: "from-cyan-500 to-blue-600",
            },
            {
              title: "2. Participe ou invite",
              desc: "Paye ta mise en DARE et rejoins le challenge !",
              color: "from-indigo-500 to-violet-600",
            },
            {
              title: "3. Relevez le défi",
              desc: "Réalisez votre exploit dans le temps imparti et capturez l’attention de la communauté.",
              color: "from-purple-500 to-pink-600",
            },
            {
              title: "4. Votez pour le vainqueur",
              desc: "Les participants votent en toute transparence sur la meilleure performance.",
              color: "from-blue-500 to-indigo-600",
            },
            {
              title: "5. Automatisation & récompense",
              desc: "À la fin du vote, le smart contract distribue automatiquement la cagnotte aux gagnants.",
              color: "from-cyan-500 to-blue-600",
            },
            {
              title: "6. Répétez",
              desc: "Lancez un nouveau défi, changez de mise ou passez en mode privé pour relever toujours plus de challenges !",
              color: "from-violet-500 to-purple-600",
            },
          ].map(({ title, desc, color }, idx) => (
            <div
              key={idx}
              className={`bg-[#1F243A] border border-white/10 rounded-2xl p-6 flex flex-col h-full shadow-lg
                        bg-gradient-to-br ${color} bg-opacity-10`}
            >
              <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
              <p className="text-lg text-white/90 flex-grow">{desc}</p>
            </div>
          ))}
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