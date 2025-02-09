"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface TooltipButtonProps {
    icon: React.ReactNode
    tooltip: string
    onClick?: (e: React.MouseEvent) => void
    className?: string
}

export const TooltipButton = ({ icon, tooltip, onClick, className = "" }: TooltipButtonProps) => {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
        <div className="relative flex items-center w-fit">
            <motion.button
                className={`p-2 ${className}`}
                onClick={onClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
            >
                {icon}
            </motion.button>
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        className="absolute bottom-full left-1/2 px-2 py-1 bg-background border rounded-lg text-xs whitespace-nowrap"
                        initial={{ opacity: 0, y: 10, x: "-50%", filter: 'blur(5px)' }}
                        animate={{ opacity: 1, y: 0, x: "-50%", filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                        transition={{ duration: 0.2 }}
                    >
                        {tooltip}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
