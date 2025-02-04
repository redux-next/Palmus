"use client"

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent } from "@/components/ui/card"
import { usePlayerStore } from '@/lib/playerStore'
import Link from 'next/link'
import { Heart, GripVertical } from 'lucide-react'

export default function Library() {
  const { likedSongs, likedAlbums, reorderLikedAlbums } = usePlayerStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 檢測是否為移動設備
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false)
    if (!result.destination) return
    // 移除原本的 -1 操作，直接使用索引
    reorderLikedAlbums(result.source.index, result.destination.index)
  }

  // 如果不是移動設備，直接渲染非拖拽版本
  if (!isMobile) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Your Library</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link href="/library/liked-songs">
            <Card className="overflow-hidden rounded-2xl hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-primary rounded-xl">
                    <Heart className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-grow">
                    <h2 className="font-semibold">Liked Songs</h2>
                    <p className="text-sm text-muted-foreground">
                      {likedSongs.length} songs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {likedAlbums.map((album) => (
            <Link key={album.id} href={`/library/${album.id}`}>
              <Card className="overflow-hidden rounded-2xl hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={`${album.cover}?param=128y128`}
                      alt={album.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <h2 className="font-semibold truncate">{album.name}</h2>
                      <p className="text-sm text-muted-foreground truncate">{album.artists}</p>
                      <p className="text-sm text-muted-foreground">
                        {album.songCount} songs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // 移動設備版本（可拖拽）
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Your Library</h1>
      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId="library-items">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-4 ${isDragging ? 'pointer-events-none' : ''}`}
            >
              {/* 將 Liked Songs 從拖拽系統中完全移除 */}
              <div>
                <Link href="/library/liked-songs">
                  <Card className="overflow-hidden rounded-2xl hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-4 bg-primary rounded-xl">
                          <Heart className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div className="flex-grow">
                          <h2 className="font-semibold">Liked Songs</h2>
                          <p className="text-sm text-muted-foreground">
                            {likedSongs.length} songs
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* 專輯列表現在有自己的 Droppable 區域 */}
              <Droppable droppableId="album-list">
                {(albumsProvided) => (
                  <div
                    {...albumsProvided.droppableProps}
                    ref={albumsProvided.innerRef}
                    className="space-y-4"
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
                          >
                            <Card className={`overflow-hidden rounded-2xl hover:bg-accent/50 transition-colors cursor-pointer group ${
                              snapshot.isDragging ? 'bg-accent/50 backdrop-blur-2xl' : ''
                            }`}>
                              <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                  <Link 
                                    href={`/library/${album.id}`} 
                                    className="flex items-center space-x-4 flex-grow min-w-0"
                                    onClick={(e) => snapshot.isDragging && e.preventDefault()}
                                  >
                                    <img
                                      src={`${album.cover}?param=128y128`}
                                      alt={album.name}
                                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <h2 className="font-semibold truncate">{album.name}</h2>
                                      <p className="text-sm text-muted-foreground truncate">{album.artists}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {album.songCount} songs
                                      </p>
                                    </div>
                                  </Link>
                                  <div
                                    {...provided.dragHandleProps}
                                    className="p-2"
                                  >
                                    <GripVertical className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {albumsProvided.placeholder}
                  </div>
                )}
              </Droppable>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

