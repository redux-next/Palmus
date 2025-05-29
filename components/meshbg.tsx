"use client"
import MeshGradient from 'mesh-gradient.js';
import { useEffect, useRef, useState } from 'react';
import ColorThief from 'colorthief';

interface AnimatedMeshGradientProps {
  imageUrl?: string;
  fps?: number;
  className?: string;
}

function rgbToHex([r, g, b]: number[]) {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

export default function AnimatedMeshGradient({ 
  imageUrl, 
  fps = 60,
  className
}: AnimatedMeshGradientProps) {
  const [colors, setColors] = useState<string[]>([
    "#eb75b6", "#ddf3ff", "#6e3deb", "#c92f3c"
  ]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageColors, setImageColors] = useState<string[] | null>(null);
  const [isGradientReady, setIsGradientReady] = useState(false);
  const gradientRef = useRef<typeof MeshGradient | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [canvasId, setCanvasId] = useState<string>("");
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate canvas ID on client side only
  useEffect(() => {
    setCanvasId(`mesh-canvas-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Update canvas size based on container with ResizeObserver (debounced)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          // Debounce resize updates
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
          
          resizeTimeoutRef.current = setTimeout(() => {
            setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
          }, 100);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Extract colors from image
  useEffect(() => {
    if (imageUrl && imgRef.current) {
      setIsImageLoading(true);
      const img = imgRef.current;
      img.onload = () => {
        const colorThief = new ColorThief();
        try {
          const palette = colorThief.getPalette(img, 4);
          const extractedColors = palette.map(rgbToHex);
          setImageColors(extractedColors);
          setIsImageLoading(false);
        } catch {
          console.warn('Failed to extract colors from image');
          setIsImageLoading(false);
        }
      };
      img.onerror = () => {
        setIsImageLoading(false);
      };
      img.src = imageUrl;
    } else {
      setImageColors(null);
      setIsImageLoading(false);
    }
  }, [imageUrl]);

  // Update colors when image colors are extracted
  useEffect(() => {
    if (imageColors && !isImageLoading) {
      setColors(imageColors);
    }
  }, [imageColors, isImageLoading]);

  // Initialize and animate gradient
  useEffect(() => {
    if (!canvasRef.current || !canvasId || canvasSize.width === 0 || canvasSize.height === 0) return;
    
    setIsGradientReady(false);
    
    // Don't reinitialize if only size changed and gradient exists
    const needsReinit = !gradientRef.current;
    
    // Clear previous animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    if (needsReinit) {
      gradientRef.current = new MeshGradient();
      gradientRef.current.initGradient("#" + canvasId, colors);
    } else {
      // Just update colors if gradient already exists
      try {
        gradientRef.current.initGradient("#" + canvasId, colors);
      } catch (error) {
        // Fallback: reinitialize if update fails
        gradientRef.current = new MeshGradient();
        gradientRef.current.initGradient("#" + canvasId, colors);
        console.warn(error);
      }
    }
    
    // Mark gradient as ready after a short delay to ensure initialization
    setTimeout(() => {
      setIsGradientReady(true);
    }, 100);
    
    let pos = 0;
    animationRef.current = setInterval(() => {
      if (gradientRef.current) {
        gradientRef.current.changePosition(pos);
        pos += 0.02;
      }
    }, 1000 / fps);
    
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [colors, fps, canvasId, canvasSize]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {canvasId && canvasSize.width > 0 && canvasSize.height > 0 && (
        <canvas 
          ref={canvasRef}
          id={canvasId}
          width={canvasSize.width} 
          height={canvasSize.height}
          style={{ 
            display: 'block',
            width: '100%',
            height: '100%',
            transition: 'opacity 0.3s ease-in-out'
          }}
          className={className}
        />
      )}
      
      {/* Loading Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#808080',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isGradientReady ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
          pointerEvents: isGradientReady ? 'none' : 'auto',
          zIndex: 1
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #ffffff40',
            borderTop: '4px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      </div>
      
      {/* CSS Animation for loading spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {imageUrl && (
        <img
          ref={imgRef}
          alt=""
          style={{ display: "none" }}
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
}
