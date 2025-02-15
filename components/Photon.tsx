import { useState, useEffect, useRef } from 'react';

interface PhotonProps extends React.HTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  defaultWidth?: number;
}

const Photon: React.FC<PhotonProps> = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  defaultWidth = 400,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src); // 修正：正確解構 useState
  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: defaultWidth, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const hasSetInitialSize = useRef(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (imgRef.current) {
        const { clientWidth, clientHeight } = imgRef.current;
        if (clientWidth > 0 && !hasSetInitialSize.current) {
          setDimensions({
            width: clientWidth,
            height: clientHeight,
          });
          hasSetInitialSize.current = true;
        }
      }
    };

    // 首次渲染後立即測量
    updateDimensions();
    
    // 創建 ResizeObserver 以監聽尺寸變化
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && Math.abs(width - dimensions.width) > 50) {
        setDimensions({ width, height });
      }
    });

    if (imgRef.current) {
      resizeObserver.observe(imgRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [dimensions.width]);

  useEffect(() => {
    if (dimensions.width > 0) {
      try {
        const encodedUrl = encodeURIComponent(src);
        const width = Math.round(dimensions.width * 2);
        setOptimizedSrc(`/api/image/photon?url=${encodedUrl}&w=${width}`);
      } catch {
        setOptimizedSrc(src);
      }
    }
  }, [src, dimensions.width]);

  const handleError = () => {
    setImgSrc('/placeholder.svg'); // 現在可以正確使用 setImgSrc
  };

  return (
    <img
      ref={imgRef}
      src={optimizedSrc || `/api/image/photon?url=${encodeURIComponent(imgSrc)}&w=${defaultWidth * 2}`}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      {...props}
    />
  );
};

export default Photon;
