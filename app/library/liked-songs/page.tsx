"use client"

import { usePlayerStore } from '@/lib/playerStore'
import { Heart, GripVertical, X, Play } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useState } from 'react'

export default function LikedSongs() {
  const likedSongs = usePlayerStore((state) => state.likedSongs)
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong)
  const removeLikedSong = usePlayerStore((state) => state.removeLikedSong)
  const reorderLikedSongs = usePlayerStore((state) => state.reorderLikedSongs)

  const [isDragging, setIsDragging] = useState(false)

  const handlePlay = (song: typeof likedSongs[0]) => {
    setCurrentSong({
      id: song.id,
      name: song.name,
      artists: song.artists,
      albumName: '',
      cover: song.cover,
    })
  }

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      handlePlay(likedSongs[0])
    }
  }

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false)
    if (!result.destination) return
    reorderLikedSongs(result.source.index, result.destination.index)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-6">
        <div className="h-64 w-64 sm:h-48 sm:w-48 md:h-64 md:w-64 lg:h-48 lg:w-48 rounded-xl shadow-md shrink-0 bg-primary flex items-center justify-center">
          <Heart className="w-24 h-24 text-primary-foreground" />
        </div>
        <div className="space-y-3 text-center md:text-center sm:text-left lg:text-left">
          <h1 className="text-4xl font-bold leading-tight">Liked Songs</h1>
          <div className="flex flex-col items-center sm:items-start md:items-center lg:items-start gap-4">
            <span className="text-muted-foreground text-sm">{likedSongs.length} songs</span>
            <button
              onClick={handlePlayAll}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            >
              <Play size={20} />
              <span>Play</span>
            </button>
          </div>
        </div>
      </div>

      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId="liked-songs">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`${isDragging ? 'pointer-events-none' : ''}`}
            >
              {likedSongs.map((song, index) => (
                <Draggable
                  key={song.id}
                  draggableId={song.id.toString()}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer group ${
                        snapshot.isDragging
                          ? 'bg-accent/50 backdrop-blur-2xl border'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handlePlay(song)}
                    >
                      <span className="w-6 text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <img
                        src={song.cover + "?param=128y128"}
                        alt={song.name}
                        className="h-12 w-12 rounded-md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{song.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{song.artists}</p>
                      </div>
                      
                      <div className={`
                        flex items-center space-x-2
                        ${snapshot.isDragging ? 'opacity-100' : ''}
                        opacity-100 md:opacity-0
                        group-hover:opacity-100
                      `}>
                        <button
                          {...provided.dragHandleProps}
                          className="p-2 hover:bg-accent rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="w-6 h-6 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeLikedSong(song.id)
                          }}
                          className="p-2 hover:bg-accent rounded-lg"
                        >
                          <X className="w-6 h-6 text-muted-foreground" />
                        </button>
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
  )
}
