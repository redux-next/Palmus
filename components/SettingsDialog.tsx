"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { usePlayerStore } from "@/lib/playerStore"
import { useColorStore } from '@/lib/colorStore'
import { X, Palette, Database, AlertTriangle, Music2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

const tabs = [
  {
    id: "personalization",
    label: "Personalization",
    icon: <Palette className="h-4 w-4" />,
  },
  {
    id: "audio",
    label: "Audio",
    icon: <Music2 className="h-4 w-4" />,
  },
  {
    id: "data",
    label: "Data",
    icon: <Database className="h-4 w-4" />,
  },
]

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState("personalization")
  const [showWarning, setShowWarning] = useState<'clear' | 'import' | null>(null)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const { theme, setTheme } = useTheme()
  const audioQuality = usePlayerStore((state) => state.audioQuality)
  const setAudioQuality = usePlayerStore((state) => state.setAudioQuality)
  const isDynamicColorEnabled = useColorStore((state) => state.isDynamicColorEnabled)
  const setDynamicColorEnabled = useColorStore((state) => state.setDynamicColorEnabled)
  const likedSongs = usePlayerStore((state) => state.likedSongs)
  const likedAlbums = usePlayerStore((state) => state.likedAlbums)
  const [tabDirection, setTabDirection] = useState(0)
  const lastTabRef = useRef(activeTab)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab)
    const lastTabIndex = tabs.findIndex(tab => tab.id === lastTabRef.current)
    if (isMobile) {
      setTabDirection(currentTabIndex > lastTabIndex ? 1 : -1)
    } else {
      setTabDirection(currentTabIndex > lastTabIndex ? 1 : -1)
    }
    lastTabRef.current = activeTab
  }, [activeTab, isMobile])

  const clearAllData = () => {
    usePlayerStore.setState({ 
      currentSong: null, 
      isPlaying: false,
      likedSongs: [],
      likedAlbums: [],
      audioQuality: 2
    })
    usePlayerStore.getState().clearCurrentAlbum()
    setTheme('system')
    setDynamicColorEnabled(true)
    useColorStore.getState().resetPalette()
  }

  const handleExportData = () => {
    const settings = {
      theme,
      audioQuality,
      isDynamicColorEnabled,
      likedSongs,
      likedAlbums
    }

    const now = new Date()
    const date = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')

    const fileName = `Palmus-Data-Export-${date}.json`

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

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setPendingImportFile(file)
      setShowWarning('import')
    }
    input.click()
  }

  const handleConfirmImport = async () => {
    if (!pendingImportFile) return

    try {
      const text = await pendingImportFile.text()
      const data = JSON.parse(text)

      clearAllData()

      if (data.theme) setTheme(data.theme)
      if (typeof data.isDynamicColorEnabled === 'boolean') {
        setDynamicColorEnabled(data.isDynamicColorEnabled)
      }
      if (typeof data.audioQuality === 'number') {
        usePlayerStore.getState().setAudioQuality(data.audioQuality)
      }
      if (Array.isArray(data.likedSongs)) {
        data.likedSongs.forEach((song: { id: string; name: string; artist: string }) => {
          usePlayerStore.getState().addLikedSong({
            id: parseInt(song.id),
            name: song.name,
            artists: [{ id: 0, name: song.artist }],
            album: {
              id: 0,
              name: '',
              cover: ''
            }
          })
        })
      }
      if (Array.isArray(data.likedAlbums)) {
        data.likedAlbums.forEach((album: { id: string; name: string; artist: string }) => {
          usePlayerStore.getState().addLikedAlbum({
            id: parseInt(album.id),
            name: album.name,
            artists: [{ id: 0, name: album.artist }],
            cover: '',
            songCount: 0
          })
        })
      }
    } catch (error) {
      console.error('Failed to import data:', error)
    }

    setShowWarning(null)
    setPendingImportFile(null)
  }

  const handleClearData = () => {
    setShowWarning('clear')
  }

  const handleConfirmClear = () => {
    clearAllData()
    setShowWarning(null)
  }

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[60] flex items-center justify-center"
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
                This will clear all your current settings and data{showWarning === 'import' ? ' before importing new ones' : ''}. This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWarning(null)
                    setPendingImportFile(null)
                  }}
                  className="w-24"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={showWarning === 'import' ? handleConfirmImport : handleConfirmClear}
                  className="w-24"
                >
                  Continue
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-full grid gap-4 border bg-background p-6 shadow-lg duration-200",
              isMobile ? "h-screen" : "max-w-3xl rounded-2xl mx-4"
            )}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Settings</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col md:flex-row md:space-x-4">
                <div className="flex space-x-2 md:hidden overflow-x-auto pb-2">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      className="flex items-center space-x-2 whitespace-nowrap"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </Button>
                  ))}
                </div>
                
                <div className="hidden md:flex md:w-48 md:flex-col md:space-y-2">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      className="justify-start space-x-2"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </Button>
                  ))}
                </div>

                <motion.div 
                  className="flex-1 overflow-hidden rounded-lg border relative" // 新增 relative, 移除 layout 與 transition props
                >
                  <AnimatePresence mode="wait" custom={tabDirection}>
                    <motion.div
                      key={activeTab}
                      custom={tabDirection}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      variants={{
                        hidden: (direction) => ({
                          opacity: 0,
                          x: isMobile ? direction * 50 : 0,
                          y: isMobile ? 0 : direction * 20,
                          filter: 'blur(5px)'
                        }),
                        show: {
                          opacity: 1,
                          x: 0,
                          y: 0,
                          filter: 'blur(0px)',
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            mass: 0.5
                          }
                        },
                        exit: (direction) => ({
                          opacity: 0,
                          x: isMobile ? direction * -50 : 0,
                          y: isMobile ? 0 : direction * -20,
                          filter: 'blur(5px)',
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                          }
                        })
                      }}
                      className="p-4 absolute inset-0" // 新增 absolute inset-0
                    >
                      {activeTab === "personalization" && (
                        <motion.div className="space-y-4">
                          <motion.h3 className="font-medium">Theme</motion.h3>
                          <motion.div className="grid gap-2">
                            {["light", "dark", "system"].map((t) => (
                              <motion.div key={t}>
                                <Button
                                  variant={theme === t ? "default" : "outline"}
                                  className={cn(
                                    "justify-start w-full",
                                    theme === t && "border-2 border-primary"
                                  )}
                                  onClick={() => setTheme(t)}
                                >
                                  <span className="capitalize">{t}</span>
                                  {theme === t && (
                                    <span className="ml-auto">✓</span>
                                  )}
                                </Button>
                              </motion.div>
                            ))}
                          </motion.div>
                          <motion.div className="flex items-center justify-between">
                            <span>Dynamic Theme Colors</span>
                            <Switch
                              checked={isDynamicColorEnabled}
                              onCheckedChange={setDynamicColorEnabled}
                            />
                          </motion.div>
                        </motion.div>
                      )}

                      {activeTab === "audio" && (
                        <motion.div className="space-y-4">
                          <motion.h3 className="font-medium">Audio Quality</motion.h3>
                          <motion.div className="grid gap-2">
                            {[
                              { value: 1, label: "Standard", desc: "128 kbps MP3" },
                              { value: 2, label: "High", desc: "320 kbps MP3" },
                              { value: 7, label: "Hi-Res", desc: "Lossless FLAC" },
                            ].map((quality) => (
                              <motion.div key={quality.value}>
                                <Button
                                  variant={audioQuality === quality.value ? "default" : "outline"}
                                  className={cn(
                                    "justify-start w-full p-6",
                                    audioQuality === quality.value && "border-2 border-primary"
                                  )}
                                  onClick={() => setAudioQuality(quality.value)}
                                >
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{quality.label}</span>
                                    <span className={cn(
                                      "text-xs",
                                      audioQuality === quality.value 
                                        ? "text-background" 
                                        : "text-muted-foreground"
                                    )}>
                                      {quality.desc}
                                    </span>
                                  </div>
                                  {audioQuality === quality.value && (
                                    <span className="ml-auto">✓</span>
                                  )}
                                </Button>
                              </motion.div>
                            ))}
                          </motion.div>
                          <motion.p className="text-sm text-muted-foreground">
                            Higher quality audio requires more bandwidth and storage.
                          </motion.p>
                        </motion.div>
                      )}

                      {activeTab === "data" && (
                        <motion.div className="space-y-4">
                          <motion.h3 className="font-medium">Data Management</motion.h3>
                          <motion.div className="grid gap-2">
                            <Button
                              variant="outline"
                              onClick={handleExportData}
                              className="justify-start"
                            >
                              Export Data
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleImportData}
                              className="justify-start"
                            >
                              Import Data
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleClearData}
                              className="justify-start"
                            >
                              Clear All Data
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}