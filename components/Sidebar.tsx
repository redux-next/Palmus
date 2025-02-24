"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import Link from "next/link"
import { Home, Search, Library, Heart, ListVideo, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import SidePlayer from "@/components/SidePlayer"
import { usePlayerStore } from "@/lib/playerStore"
import { cn } from "@/lib/utils"

const Sidebar = () => {
  const { likedAlbums, reorderLikedAlbums } = usePlayerStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed))
    document.documentElement.setAttribute('data-sidebar-collapsed', String(isCollapsed))
  }, [isCollapsed])

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false)
    if (!result.destination) return
    reorderLikedAlbums(result.source.index, result.destination.index)
  }

  return (
    <aside className={cn(
      "hidden md:flex flex-col m-4",
      "transition-all duration-300 ease-in-out",
      isCollapsed ? "min-w-[5rem] max-w-[5rem]" : "min-w-72 max-w-72"
    )}>
      <nav className="bg-card text-card-foreground p-4 rounded-3xl shadow-lg border flex flex-col h-[calc(100vh-2rem)] relative">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-card border rounded-full p-1.5 hover:bg-accent transition-all duration-300 z-50"
        >
          <div className={cn(
            "transition-transform duration-300",
            isCollapsed ? "rotate-0" : "rotate-180"
          )}>
            <ChevronRight size={16} />
          </div>
        </button>

        <div className="flex flex-col min-h-0 flex-1">
          <ul className="space-y-2 flex-none">
            <li>
              <Link href="/" className={cn(
                "flex items-center p-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors",
                isCollapsed ? "justify-center" : "space-x-2"
              )}>
                <Home />
                {!isCollapsed && <span>Home</span>}
              </Link>
            </li>
            <li>
              <Link href="/search" className={cn(
                "flex items-center p-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors",
                isCollapsed ? "justify-center" : "space-x-2"
              )}>
                <Search />
                {!isCollapsed && <span>Search</span>}
              </Link>
            </li>
            <li>
              <Link href="/library" className={cn(
                "flex items-center p-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors",
                isCollapsed ? "justify-center" : "space-x-2"
              )}>
                <Library />
                {!isCollapsed && <span>Library</span>}
              </Link>
            </li>
          </ul>

          {!isCollapsed && (
            <div className={cn(
              "pl-2 my-2 flex-1 min-h-0",
              "transition-opacity duration-300",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}>
              <div className="relative h-full">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <div className="library-list pl-4 pb-2 relative before:absolute before:left-2 before:top-0 before:bottom-4 before:w-[2px] before:bg-border/80">
                    <div className="relative pb-2 mr-2">
                      <Link href="/library/liked-songs" className="flex items-center space-x-2 p-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm flex-grow">Liked Songs</span>
                      </Link>
                    </div>

                    <DragDropContext
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={handleDragEnd}
                    >
                      <Droppable droppableId="sidebar-albums">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={isDragging ? 'pointer-events-none' : ''}
                          >
                            {likedAlbums.map((album, index) => (
                              <Draggable
                                key={album.id}
                                draggableId={album.id.toString()}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="relative pb-2 mr-2"
                                  >
                                    <div className={`flex items-center space-x-2 p-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors group ${
                                      snapshot.isDragging ? 'bg-accent/50 backdrop-blur-2xl' : ''
                                    }`}>
                                      <Link
                                        href={`/library/${album.id}`}
                                        className="flex items-center space-x-2 flex-grow min-w-0"
                                        onClick={(e) => snapshot.isDragging && e.preventDefault()}
                                      >
                                        <ListVideo className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm truncate">{album.name}</span>
                                      </Link>
                                      <div
                                        {...provided.dragHandleProps}
                                        className="opacity-0 group-hover:opacity-100 p-1"
                                      >
                                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-none mt-4">
          <SidePlayer collapsed={isCollapsed} />
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar

