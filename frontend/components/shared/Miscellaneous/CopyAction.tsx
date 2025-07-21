import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StickyNote } from 'lucide-react'

export function CopyAction({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button className="bg-blue-600" onClick={handleCopy}>
      {copied ? 'Copié!' : 'Copier CA'}
      <StickyNote />
    </Button>
  )
}