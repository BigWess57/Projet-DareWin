import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon, CircleChevronRight, ClockFading } from "lucide-react"
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WaitForTransactionReceiptErrorType, WriteContractErrorType } from "viem";


type CurrentTransactionProps = {
  hash?: `0x${string}` | undefined;
  isConfirming?: boolean;
  isSuccess?: boolean;
  errorConfirmation?: WaitForTransactionReceiptErrorType | null;
  error?: unknown;
};

const CurrentTransaction = ({
  hash,
  isConfirming,
  isSuccess,
  errorConfirmation,
  error,
}: CurrentTransactionProps) => {

  const [showHash, setShowHash] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);

  // useEffect(() => {
  //   if (hash) {
  //     const timer = setTimeout(() => setShowHash(false), 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [hash]);

  // useEffect(() => {
  //   if (isSuccess) {
  //     toast.success("Success", {
  //         description: "Transaction successful'",
  //     })
  //     const timer = setTimeout(() => {
  //       setShowSuccess(false);
  //     }, 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [isSuccess]);
  
  return (
    <div className="flex flex-col w-full">
        { hash && showHash &&
          <Alert className="mb-4 bg-sky-200">
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
                Transaction Hash: {hash}
            </AlertDescription>
          </Alert>
        }
        {isConfirming && 
          <Alert className="mb-4 bg-amber-200">
            <ClockFading className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
                Waiting for confirmation...
            </AlertDescription>
          </Alert>
        }
        {isSuccess && showSuccess &&
          <Alert className="mb-4 bg-lime-200">
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
                Transaction confirmed.
            </AlertDescription>
          </Alert>
        }
        {errorConfirmation &&
          <Alert className="mb-4 bg-red-400">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                {errorConfirmation.message}
            </AlertDescription>
          </Alert>
        }
        {error as WriteContractErrorType && (
          <Alert className="mb-4 bg-red-400">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                {(error as WriteContractErrorType).message}
            </AlertDescription>
          </Alert>)
        }
      </div>
  )
}

export default CurrentTransaction