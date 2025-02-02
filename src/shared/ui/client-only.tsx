import { type ReactNode, useEffect, useState } from "react"

export function ClientOnly({ children }: { children?: ReactNode }) {
  const [isClient, setClient] = useState(false)

  useEffect(() => {
    setClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return children
}
