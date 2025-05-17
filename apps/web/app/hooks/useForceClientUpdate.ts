'use client'

import { useEffect } from 'react'
import packageJson from '../../package.json'

const CURRENT_VERSION = packageJson.version

export default function useForceClientUpdate() {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data.version && data.version !== CURRENT_VERSION) {
          window.location.reload()
        }
      } catch (err) {
        console.error('Failed to check client version', err)
      }
    }

    checkVersion()
    const timer = setInterval(checkVersion, 60 * 1000)
    return () => clearInterval(timer)
  }, [])
}
