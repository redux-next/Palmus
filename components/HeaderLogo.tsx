'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function HeaderLogo() {
  const { theme, systemTheme } = useTheme()
  const [logoSrc, setLogoSrc] = useState('/logo500light.png')
  
  useEffect(() => {
    const currentTheme = theme === 'system' ? systemTheme : theme
    setLogoSrc(currentTheme === 'dark' ? '/logo500dark.png' : '/logo500light.png')
  }, [theme, systemTheme])
  
  return (
    <div className="flex items-center gap-2">
      <Image 
        src={logoSrc}
        alt="Palmus Logo" 
        width={40} 
        height={40} 
        className="rounded-lg"
      />
      <h1 className="text-2xl font-bold">Palmus Music</h1>
    </div>
  )
}
