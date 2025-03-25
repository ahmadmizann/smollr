import React, { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { ThemeToggle } from "../../components/ui/theme-toggle";

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
    <div className="bg-white dark:bg-[#0f172a] flex justify-center w-full min-h-screen">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-[1440px] h-[1024px] relative">
        <div className="flex flex-col w-full max-w-[452px] items-center gap-[18px] mx-auto pt-[47px]">
          {/* Header */}
          <div className="flex items-start justify-between w-full">
            <div className="flex items-start gap-2">
              <div className="flex flex-col w-16 h-16 items-center justify-center gap-2.5 px-2 py-3.5 bg-[#ffbc04] rounded-[28px]">
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

              <div className="flex items-center gap-2.5">
                <div className="flex flex-col w-[377px] items-start gap-2">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-fit mt-[-1.00px] font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#313131] dark:text-white text-2xl tracking-[0] leading-[normal]">
                      <span className="font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#313131] dark:text-white text-2xl tracking-[0]">
                        smollpng{" "}
                      </span>
                      <span className="text-xs">by</span>
                      <span className="font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#313131] dark:text-white text-2xl tracking-[0]">
                        &nbsp;
                      </span>
                    </div>
                    <img className="flex-[0_0_auto]" alt="Frame" src="/frame-17.svg" />
                  </div>
                  <div className="w-full font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#1e1e1e80] dark:text-gray-400 text-xs tracking-[0] leading-[normal]">
                    Smart AVIF, WebP, PNG and JPEG Compression for Faster Websites
                  </div>
                </div>
              </div>
            </div>
            
            <ThemeToggle />
          </div>

          <Separator className="w-full dark:border-gray-700" />

          {/* Drop Zone */}
          <Card 
            className={`w-full h-[254px] ${isDragging ? 'bg-[#ffbc04]/10' : 'bg-[#d7deeb3d] dark:bg-gray-800/50'} rounded-[28px] border-2 border-dashed ${isDragging ? 'border-[#ffbc04]' : 'border-[#a4a4a4] dark:border-gray-700'} cursor-pointer transition-colors duration-200`}
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
            <CardContent className="flex flex-col items-center justify-center h-full p-0">
              {isProcessing && currentProcessing ? (
                <div className="flex flex-col items-center w-full max-w-md p-6">
                  <h3 className="text-[#ffbc04] font-bold text-xl mb-2">
                    Wait a minute... ({optimizedImages.length}/{optimizedImages.length + 1})
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Your image is being optimized
                  </p>
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="truncate max-w-[200px]">{currentProcessing.name}</span>
                      <span>{currentProcessing.format}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
                  <div className="flex flex-col items-center">
                    <h2 className="font-['Plus_Jakarta_Sans',Helvetica] font-bold text-black dark:text-white text-2xl">
                      Drop your Images here
                    </h2>
                    <p className="font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#00000080] dark:text-gray-400 text-sm">
                      Up to 10 Images
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {optimizedImages.length > 0 && (
            <Card className="w-full bg-[#d7deeb3d] dark:bg-gray-800/50 rounded-[28px] border-2 border-dashed border-[#a4a4a4] dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-[25px]">
                  {/* Header */}
                  <div className="flex flex-col items-start gap-[13px] w-full">
                    <h2 className="font-['Plus_Jakarta_Sans',Helvetica] font-bold text-[#ffbc04] text-2xl">
                      Smoll Just saved you {getTotalOptimization()}%
                    </h2>
                    <p className="font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#1e1e1e80] dark:text-gray-400 text-xs">
                      {optimizedImages.length} image{optimizedImages.length > 1 ? 's' : ''} optimized
                    </p>
                  </div>

                  {/* Image Details */}
                  <div className="flex flex-col gap-4 w-full">
                    {optimizedImages.map((image, index) => (
                      <div key={index} className="flex items-start gap-[21px]">
                        <img
                          className="w-[67px] h-[67px] object-cover rounded-lg"
                          alt="Optimized image thumbnail"
                          src={image.thumbnail}
                        />
                        <div className="flex flex-col items-start gap-1">
                          <h3 className="text-lg font-['Plus_Jakarta_Sans',Helvetica] font-normal text-black dark:text-white">
                            {image.name}
                          </h3>
                          <div className="flex items-start gap-[18px]">
                            <p className="text-sm font-['Plus_Jakarta_Sans',Helvetica] font-normal text-black dark:text-white">
                              {image.format}
                            </p>
                            <p className="text-sm font-['Plus_Jakarta_Sans',Helvetica] font-normal text-black dark:text-white">
                              {image.originalSize}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-start justify-center gap-1 ml-auto">
                          <p className="text-sm font-['Plus_Jakarta_Sans',Helvetica] font-normal text-green-600">
                            Optimized
                          </p>
                          <p className="text-sm font-['Plus_Jakarta_Sans',Helvetica] font-normal text-black dark:text-white">
                            {image.optimizedSize}
                          </p>
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
    </div>
  );
};
