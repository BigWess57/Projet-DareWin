import Link from 'next/link'

import {useTranslations} from 'next-intl';
import SwapWidget from '../Miscellaneous/SwapWidget';

const HomePage = () => {

  const t = useTranslations('HomePage');

  return (
    <div>
    {/* Decorative SVG circles */}
      <div className="absolute top-20 right-1/6 w-96 h-96 bg-cyan-500/30 rounded-full animate-pulse blur-3xl" />
      <div className="absolute top-60 left-1/6 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-1/3 w-56 h-56 bg-purple-500/30 rounded-full animate-spin-slow blur-3xl" />

      <section
        className="
          relative flex flex-col items-center text-center 
          pt-24 pb-16 px-6 overflow-hidden
        "
      >
        {/* Main content */}
        <h1 className="relative text-6xl md:text-6xl font-extrabold pb-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-pink-500 to-purple-500 animate-text">
          {t('title')}
        </h1>
        <p className="relative text-xl md:text-2xl mb-8 max-w-2xl text-white-200 animate-fade-in">
          {t.rich('subtitle', {
            fun: (chunks) => <span className="text-pink-400 font-semibold">{chunks}</span>,
            secure: (chunks) => <span className="text-cyan-300 font-semibold">{chunks}</span>
          })}
        </p>
        <Link
          href="/createchallenge"
          className="
            relative z-10 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 
            rounded-2xl text-lg font-semibold text-white shadow-2xl 
            hover:scale-105 hover:brightness-110 transition-transform duration-300
          "
        >
          {t('cta_button')}
        </Link>
      </section>

      <section className="relative px-6 py-20 flex flex-col items-center">
          
        {/* Section Header */}
        <div className="text-center mb-10 max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            {t('buy_dare_title')}
          </h2>
          <p className="text-gray-400 text-xl">
            {t('buy_dare_subtitle')}
          </p>
        </div>

        {/* Swap Component Injection */}
          <div className="w-full flex justify-center z-20">
             <SwapWidget />
          </div>
      </section>
      

      {/* How It Works */}
      <section className="relative px-6 pb-16 overflow-hidden">
        
        <h2 className="relative text-3xl md:text-5xl font-extrabold text-center text-white mb-12 z-10">
          {t('how_it_works_title')}
        </h2>
        
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 z-10">
          {[
            {
              title: t('step_1_title'),
              desc: t('step_1_desc'),
              color: "from-cyan-500 to-blue-600",
            },
            {
              title: t('step_2_title'),
              desc: t('step_2_desc'),
              color: "from-indigo-500 to-violet-600",
            },
            {
              title: t('step_3_title'),
              desc: t('step_3_desc'),
              color: "from-purple-500 to-pink-600",
            },
            {
              title: t('step_4_title'),
              desc: t('step_4_desc'),
              color: "from-blue-500 to-indigo-600",
            },
            {
              title: t('step_5_title'),
              desc: t('step_5_desc'),
              color: "from-cyan-500 to-blue-600",
            },
            {
              title: t('step_6_title'),
              desc: t('step_6_desc'),
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
          {t('footer_cta')}
        </h2>
      </section>
    </div>
  )
}

export default HomePage