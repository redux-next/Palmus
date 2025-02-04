"use client"

import { Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { usePlayerStore } from "@/lib/playerStore"
import { useColorStore } from '@/lib/colorStore'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SettingsDropdown() {
  const { theme, setTheme } = useTheme()
  const audioQuality = usePlayerStore((state) => state.audioQuality)
  const setAudioQuality = usePlayerStore((state) => state.setAudioQuality)
  const isDynamicColorEnabled = useColorStore((state) => state.isDynamicColorEnabled)
  const setDynamicColorEnabled = useColorStore((state) => state.setDynamicColorEnabled)

  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
