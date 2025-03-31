import React, { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { X } from "lucide-react";

interface OptimizedImage {
  id: string;
  name: string;
  format: string;
  originalSize: string;
  optimizedSize: string;
  thumbnail: string;
  blob: Blob;
}

interface ProcessingImage {
  name: string;
  format: string;
  progress: number;
}

export const Finish = (): JSX.Element => {
  const [isDragging, setIsDragging] = useState(false);
  const [optimizedImages, setOptimizedImages] = useState<OptimizedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessing, setCurrentProcessing] = useState<ProcessingImage | null>(null);

  // Format File Size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Image Optimization
  const handleImageOptimization = async (file: File) => {
    try {
      setCurrentProcessing({
        name: file.name,
        format: file.type.split('/')[1].toUpperCase(),
        progress: 0
      });

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (progress: number) => {
          setCurrentProcessing(prev => prev ? { ...prev, progress } : null);
        }
      };

      const compressedFile = await imageCompression(file, options);
      const thumbnail = URL.createObjectURL(compressedFile);

      const optimizedImage: OptimizedImage = {
        id: crypto.randomUUID(),
        name: file.name,
        format: file.type.split('/')[1].toUpperCase(),
        originalSize: formatFileSize(file.size),
        optimizedSize: formatFileSize(compressedFile.size),
        thumbnail,
        blob: compressedFile,
      };

      setOptimizedImages(prev => [...prev, optimizedImage]);
    } catch (error) {
      console.error('Error optimizing image:', error);
    }
  };

  const handleFiles = async (files: FileList) => {
    setIsProcessing(true);
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 10) {
      alert('Please select up to 10 images only');
      setIsProcessing(false);
      return;
    }

    for (const file of imageFiles) {
      await handleImageOptimization(file);
    }
    setIsProcessing(false);
    setCurrentProcessing(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDownloadAll = () => {
    optimizedImages.forEach((image) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(image.blob);
      link.download = `optimized-${image.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleDeleteImage = (id: string) => {
    setOptimizedImages(prev => prev.filter(img => img.id !== id));
  };

  const getTotalOptimization = () => {
    if (optimizedImages.length === 0) return 0;
    
    const originalSize = optimizedImages.reduce((acc, img) => {
      const size = parseFloat(img.originalSize.split(' ')[0]);
      const unit = img.originalSize.split(' ')[1];
      return acc + (unit === 'MB' ? size * 1024 : size);
    }, 0);

    const optimizedSize = optimizedImages.reduce((acc, img) => {
      const size = parseFloat(img.optimizedSize.split(' ')[0]);
      const unit = img.optimizedSize.split(' ')[1];
      return acc + (unit === 'MB' ? size * 1024 : size);
    }, 0);

    const savings = ((originalSize - optimizedSize) / originalSize) * 100;
    return Math.round(savings);
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;
    script.onload = () => {
      // Initialize the Ko-fi widget when the script is loaded
      window.kofiWidgetOverlay.draw('ahmadmizanh', {
        'type': 'floating-chat',
        'floating-chat.donateButton.text': 'Tip Me',
        'floating-chat.donateButton.background-color': '#f45d22',
        'floating-chat.donateButton.text-color': '#fff'
      });
    };
    document.body.appendChild(script);

    // Cleanup: remove the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-[#0f172a] flex justify-center w-full min-h-screen">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-[1440px] min-h-screen relative px-4 sm:px-6">
        <div className="flex flex-col w-full max-w-[452px] items-center gap-[18px] mx-auto pt-6 sm:pt-[47px]">
          {/* Header and other content goes here */}
          
          {/* Ko-fi Widget */}
          <div className="w-full mt-8 rounded-lg dark:bg-gray-800">
            <iframe
              id='kofiframe'
              src='https://ko-fi.com/ahmadmizanh/?hidefeed=true&widget=true&embed=true&preview=true'
              style={{ border: 'none', width: '100%', height: '712px' }}
              title='ahmadmizanh'
            />
          </div>
        </div>
      </div>
    </div>
  );
};
