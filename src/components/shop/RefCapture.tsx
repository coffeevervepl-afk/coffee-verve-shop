'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Mounted in layout — captures ?ref=CODE and saves to localStorage.
 * On first checkout the code is read and referral promos are issued.
 */
export default function RefCapture() {
  const sp = useSearchParams()

  useEffect(() => {
    const ref = sp.get('ref')
    if (ref && !localStorage.getItem('cv_ref')) {
      localStorage.setItem('cv_ref', ref)
    }
  }, [sp])

  return null
}
