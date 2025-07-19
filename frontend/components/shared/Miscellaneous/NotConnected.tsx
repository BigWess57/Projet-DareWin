import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export const NotConnected = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <Alert
        className="max-w-xl w-full bg-gradient-to-br from-[#0f172a] via-[#0b1126] to-[#1e293b] border border-cyan-500/30 shadow-xl p-10 text-center rounded-2xl space-y-6"
      >
        <div className="flex justify-center">
          <AlertCircleIcon className="h-12 w-12 text-cyan-400 drop-shadow-md" />
        </div>
        <AlertTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          Wallet non connecté
        </AlertTitle>
        <AlertDescription className="text-lg text-white/80">
          Connecte ton wallet pour accéder à l’application Darewin.
        </AlertDescription>
      </Alert>
    </div>
  )
}
