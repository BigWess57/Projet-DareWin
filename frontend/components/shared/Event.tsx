import {
    Card
} from "@/components/ui/card"
import { Address } from "viem"

const Event = ({ address } : {address: Address|undefined}) => {
  return (
    <Card className="p-4 mb-2 bg-lime-200">
        <div className="flex items-center">
            {/* <p className="ml-2">Old Value : <span className="font-bold">{event.oldValue}</span></p>
            <p className='ml-2 mr-2'>|</p> 
            <p>New Value : <span className="font-bold">{event.newValue}</span></p> */}
            <p>{address}</p>
        </div>
    </Card>
  )
}

export default Event