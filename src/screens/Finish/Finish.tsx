import React, { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";

interface OptimizedImage {
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  const getTotalOptimization = () => {
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

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 md:p-8">
      <div className="max-w-[452px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-[#ffbc04] rounded-[28px]">
            <div className="relative w-[44.5px] h-[42.5px]">
              <img className="absolute w-[9px] h-3.5 top-[29px] left-2" alt="Clip path group" src="/clip-path-group.png" />
              <img className="absolute w-2 h-3 top-[29px] left-3.5" alt="Clip path group" src="/clip-path-group-1.png" />
              <img className="absolute w-1.5 h-[9px] top-7 left-[19px]" alt="Clip path group" src="/clip-path-group-2.png" />
              <img className="absolute w-[34px] h-[26px] top-3.5 left-0" alt="Clip path group" src="/clip-path-group-3.png" />
              <img className="absolute w-4 h-[11px] top-[22px] left-[11px]" alt="Clip path group" src="/clip-path-group-4.png" />
              <img className="absolute w-[31px] h-[17px] top-3.5 left-[11px]" alt="Clip path group" src="/clip-path-group-5.png" />
              <img className="absolute w-1 h-1 top-[27px] left-[11px]" alt="Clip path group" src="/clip-path-group-6.png" />
              <img className="absolute w-2.5 h-[9px] top-[13px] left-[23px]" alt="Clip path group" src="/clip-path-group-7.png" />
              <img className="absolute w-1.5 h-[3px] top-[21px] left-[15px]" alt="Clip path group" src="/clip-path-group-8.png" />
              <img className="absolute w-4 h-[15px] top-0 left-[29px]" alt="Vector" src="/vector-3.svg" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-normal">
                smollpng <span className="text-xs">by</span>
              </h1>
              <img alt="Frame" src="/frame-17.svg" />
            </div>
            <p className="text-xs text-[#1e1e1e80]">
              Smart AVIF, WebP, PNG and JPEG Compression for Faster Websites
            </p>
          </div>
        </div>

        <Separator />

        {/* Drop Zone */}
        <Card 
          className={`w-full h-[254px] ${isDragging ? 'bg-[#ffbc04]/10' : 'bg-[#d7deeb3d]'} rounded-[28px] border-2 border-dashed ${isDragging ? 'border-[#ffbc04]' : 'border-[#a4a4a4]'} cursor-pointer transition-colors duration-200`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input
            type="file"
            id="fileInput"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileInput}
          />
          <CardContent className="flex flex-col items-center justify-center h-full p-4 sm:p-6">
            {isProcessing && currentProcessing ? (
              <div className="w-full max-w-md p-4 sm:p-6">
                <h3 className="text-[#ffbc04] font-bold text-xl mb-2 text-center">
                  Wait a minute... ({optimizedImages.length}/{optimizedImages.length + 1})
                </h3>
                <p className="text-sm text-gray-500 mb-6 text-center">
                  Your image is being optimized
                </p>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="truncate max-w-[200px]">{currentProcessing.name}</span>
                    <span>{currentProcessing.format}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#ffbc04] transition-all duration-300"
                      style={{ width: `${currentProcessing.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <img className="w-[111px] h-[85px] mb-3" alt="Group" src="/group-3.png" />
                <div className="text-center">
                  <h2 className="font-bold text-xl sm:text-2xl">
                    Drop your Images here
                  </h2>
                  <p className="text-sm text-[#00000080]">
                    Up to 10 Images
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {optimizedImages.length > 0 && (
          <Card className="w-full bg-[#d7deeb3d] rounded-[28px] border-2 border-dashed border-[#a4a4a4]">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                  <h2 className="font-bold text-xl sm:text-2xl text-[#ffbc04]">
                    Smoll Just saved you {getTotalOptimization()}%
                  </h2>
                  <p className="text-xs text-[#1e1e1e80]">
                    {optimizedImages.length} image{optimizedImages.length > 1 ? 's' : ''} optimized
                  </p>
                </div>

                {/* Image Details */}
                <div className="space-y-4">
                  {optimizedImages.map((image, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start gap-4">
                      <img
                        className="w-full sm:w-[67px] h-[67px] object-cover rounded-lg"
                        alt="Optimized image thumbnail"
                        src={image.thumbnail}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-normal truncate">
                          {image.name}
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          <p className="text-sm">{image.format}</p>
                          <p className="text-sm">{image.originalSize}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">Optimized</p>
                        <p className="text-sm">{image.optimizedSize}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Download Button */}
                <Button 
                  className="w-full h-[49px] bg-[#ffbc04] rounded-lg text-black hover:bg-[#e6aa04] font-semibold"
                  onClick={handleDownloadAll}
                >
                  Download All Images
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};