"use client"

import { Settings, Download, Upload, AlertTriangle, XCircle } from "lucide-react"
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

// 添加錯誤彈窗組件
const ErrorPopup = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-center"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', y: 20 }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-card border rounded-2xl p-6 max-w-md w-full mx-4 shadow-lg"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Invalid File</h2>
        <p className="text-center text-muted-foreground">{message}</p>
        <Button
          variant="outline"
          onClick={onClose}
          className="w-24"
        >
          Close
        </Button>
      </div>
    </motion.div>
  </motion.div>
)

const WarningPopup = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-center"
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
        <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleExportSettings = () => {
    const settings = {
      theme,
      audioQuality,
      isDynamicColorEnabled,
      likedSongs,
      likedAlbums
    }

    // 格式化當前日期和時間
    const now = new Date()
    const date = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
    
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase().replace('_', '-')

    const fileName = `Palmus-Data-Export-${date}-${time}.json`

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
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

  interface Song {
    id: number;
    name: string;
    artists: string;
    cover: string;
  }

  interface Album {
    id: number;
    name: string;
    artists: string;
    cover: string;
    songCount: number;
  }

  interface Settings {
    theme?: string;
    audioQuality?: number;
    isDynamicColorEnabled?: boolean;
    likedSongs?: Array<Song>;
    likedAlbums?: Array<Album>;
  }

  // 添加設定檔驗證函數
  const validateSettings = (settings: Settings): boolean => {
    // 檢查基本屬性存在性和類型
    if (settings.theme && !['light', 'dark', 'system'].includes(settings.theme)) {
      setErrorMessage('Invalid theme value')
      return false
    }

    if (settings.audioQuality && ![1, 2, 7].includes(settings.audioQuality)) {
      setErrorMessage('Invalid audio quality value')
      return false
    }

    if (settings.isDynamicColorEnabled && typeof settings.isDynamicColorEnabled !== 'boolean') {
      setErrorMessage('Invalid dynamic color setting')
      return false
    }

    // 驗證歌曲列表格式
    if (settings.likedSongs && Array.isArray(settings.likedSongs)) {
      const isValidSong = settings.likedSongs.every((song: Song) => 
        typeof song === 'object' &&
        typeof song.id === 'number' &&
        typeof song.name === 'string' &&
        typeof song.artists === 'string' &&
        typeof song.cover === 'string'
      )

      if (!isValidSong) {
        setErrorMessage('Invalid liked songs format')
        return false
      }
    }

    // 驗證專輯列表格式
    if (settings.likedAlbums && Array.isArray(settings.likedAlbums)) {
      const isValidAlbum = settings.likedAlbums.every((album: Album) =>
        typeof album === 'object' &&
        typeof album.id === 'number' &&
        typeof album.name === 'string' &&
        typeof album.artists === 'string' &&
        typeof album.cover === 'string' &&
        typeof album.songCount === 'number'
      )

      if (!isValidAlbum) {
        setErrorMessage('Invalid liked albums format')
        return false
      }
    }

    return true
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const settings = JSON.parse(e.target?.result as string)
            if (validateSettings(settings)) {
              setPendingFile(file)
              setShowWarning(true)
            }
          } catch (error) {
            setErrorMessage('Failed to parse settings file')
            console.error('Failed to parse settings file:', error)
          }
        }
        reader.readAsText(file)
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
          settings.likedSongs.forEach((song: { id: number; name: string; artists: string; cover: string }) => {
            usePlayerStore.getState().addLikedSong({
              id: song.id,
              name: song.name,
              artists: [{ id: 0, name: song.artists }],
              album: {
                id: 0,
                name: '',
                cover: song.cover
              }
            })
          })
        }
        if (Array.isArray(settings.likedAlbums)) {
          settings.likedAlbums.forEach((album: { id: number; name: string; artists: string; cover: string; songCount: number }) => {
            usePlayerStore.getState().addLikedAlbum({
              id: album.id,
              name: album.name,
              artists: [{ id: 0, name: album.artists }],
              cover: album.cover,
              songCount: album.songCount
            })
          })
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
        {errorMessage && (
          <ErrorPopup
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
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