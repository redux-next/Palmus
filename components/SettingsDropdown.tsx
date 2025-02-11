"use client"

import { Settings, Download, Upload, AlertTriangle } from "lucide-react"
import { useTheme } from "next-themes"
import { usePlayerStore } from "@/lib/playerStore"
import { useColorStore } from '@/lib/colorStore'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const WarningPopup = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
  >
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.9,
        filter: 'blur(10px)',
        y: 20
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        filter: 'blur(0px)',
        y: 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.9,
        filter: 'blur(10px)',
        y: 20
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className="bg-card border rounded-2xl p-6 max-w-md w-full mx-4 shadow-lg"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Warning</h2>
        <p className="text-center text-muted-foreground">
          This will clear all your current settings and data before importing new ones. This action cannot be undone.
        </p>
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-24"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="w-24"
          >
            Continue
          </Button>
        </div>
      </div>
    </motion.div>
  </motion.div>
)

export function SettingsDropdown() {
  const { theme, setTheme } = useTheme()
  const audioQuality = usePlayerStore((state) => state.audioQuality)
  const setAudioQuality = usePlayerStore((state) => state.setAudioQuality)
  const isDynamicColorEnabled = useColorStore((state) => state.isDynamicColorEnabled)
  const setDynamicColorEnabled = useColorStore((state) => state.setDynamicColorEnabled)
  const likedSongs = usePlayerStore((state) => state.likedSongs)
  const likedAlbums = usePlayerStore((state) => state.likedAlbums)
  const [showWarning, setShowWarning] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const handleExportSettings = () => {
    const settings = {
      theme,
      audioQuality,
      isDynamicColorEnabled,
      likedSongs,
      likedAlbums
    }

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'palmus-settings.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearAllData = () => {
    usePlayerStore.setState({ currentSong: null, isPlaying: false })
    usePlayerStore.getState().clearCurrentAlbum()
    likedSongs.forEach(song => usePlayerStore.getState().removeLikedSong(song.id))
    likedAlbums.forEach(album => usePlayerStore.getState().removeLikedAlbum(album.id))
    setTheme('system')
    setAudioQuality(2)
    setDynamicColorEnabled(true)
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setPendingFile(file)
        setShowWarning(true)
      }
    }
    input.click()
  }

  const handleConfirmImport = () => {
    if (!pendingFile) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        clearAllData()
        const settings = JSON.parse(e.target?.result as string)
        if (settings.theme) setTheme(settings.theme)
        if (typeof settings.audioQuality === 'number') setAudioQuality(settings.audioQuality)
        if (typeof settings.isDynamicColorEnabled === 'boolean') setDynamicColorEnabled(settings.isDynamicColorEnabled)
        
        if (Array.isArray(settings.likedSongs)) {
          settings.likedSongs.forEach((song: { id: number; name: string; artists: string; cover: string }) => 
            usePlayerStore.getState().addLikedSong(song)
          )
        }
        if (Array.isArray(settings.likedAlbums)) {
          settings.likedAlbums.forEach((album: { id: number; name: string; artists: string; cover: string; songCount: number }) => 
            usePlayerStore.getState().addLikedAlbum(album)
          )
        }
      } catch (error) {
        console.error('Failed to parse settings file:', error)
      }
    }
    reader.readAsText(pendingFile)
    setShowWarning(false)
    setPendingFile(null)
  }

  const handleCancelImport = () => {
    setShowWarning(false)
    setPendingFile(null)
  }

  return (
    <>
      <AnimatePresence>
        {showWarning && (
          <WarningPopup
            onConfirm={handleConfirmImport}
            onCancel={handleCancelImport}
          />
        )}
      </AnimatePresence>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <Settings className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Open settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-background/75 backdrop-blur-2xl border">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <span>Light</span>
              {theme === "light" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <span>Dark</span>
              {theme === "dark" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <span>System</span>
              {theme === "system" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm">Dynamic</span>
              <Switch
                checked={isDynamicColorEnabled}
                onCheckedChange={setDynamicColorEnabled}
              />
            </div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Audio Quality</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setAudioQuality(1)}>
              <span>Standard (128kbps)</span>
              {audioQuality === 1 && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAudioQuality(2)}>
              <span>High (320kbps)</span>
              {audioQuality === 2 && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAudioQuality(7)}>
              <span>Hi-Res</span>
              {audioQuality === 7 && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleExportSettings}>
              <Download className="mr-2 h-4 w-4" />
              <span>Export Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportSettings}>
              <Upload className="mr-2 h-4 w-4" />
              <span>Import Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
