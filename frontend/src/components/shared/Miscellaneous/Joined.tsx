import {
    Card
} from "@/src/components/ui/card"
import { User } from "lucide-react"
import { Address } from "viem"

const Joined = ({ address } : {address: Address|undefined}) => {
  return (
    <Card className="
      p-4 mb-2 bg-[#1F243A] border border-white/10 rounded-xl 
      shadow-sm hover:shadow-md transition-shadow duration-200
    ">
      <div className="flex items-center space-x-3">
        <div className="
          h-8 w-8 flex items-center justify-center 
          bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full
        ">
          <User className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm font-mono text-white break-all">
          {address}
        </p>
      </div>
    </Card>
  )
}

export default Joined