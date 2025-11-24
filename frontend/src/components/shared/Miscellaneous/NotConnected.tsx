import { AlertCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"

// import {
//   Alert,
//   AlertDescription,
//   AlertTitle,
// } from "@/src/components/ui/alert"

export const NotConnected = () => {
  const t = useTranslations('NotConnected')
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div
        className="max-w-xl bg-gradient-to-br from-[#0f172a] via-[#0b1126] to-[#1e293b] border border-cyan-500/30 shadow-xl p-10 rounded-2xl space-y-6"
      >
        {/* Icon container */}
        <div className="flex justify-start items-center gap-5 mb-5">
          <AlertCircleIcon className="h-12 w-12 text-cyan-400 drop-shadow-md" />
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            {t('title')}
          </div>
        </div>
        <div className="text-lg text-white/80">
          {t('description')}
        </div>
      </div>
    </div>
  )
}
