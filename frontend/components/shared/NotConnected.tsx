import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export const NotConnected = () => {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
        <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        Please connect your Wallet to our DApp.
      </AlertDescription>
    </Alert>
  )
}
