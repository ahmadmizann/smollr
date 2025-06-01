import React, { useCallback, useState } from "react";
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
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        initialQuality: 0.9,
        alwaysKeepResolution: true,
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
 // --- Add Ko-fi Widget ---Add commentMore actions
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;
    script.id = 'kofi-widget-script'; // Add an ID for easy removal in cleanup

    script.onload = () => {
      // Check if the function exists before calling (TypeScript might need 'as any')
      if (typeof (window as any).kofiWidgetOverlay?.draw === 'function') {
        (window as any).kofiWidgetOverlay.draw('ahmadmizanh', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Tip Me',
          'floating-chat.donateButton.background-color': '#00b9fe',
          'floating-chat.donateButton.text-color': '#fff'
        });
      } else {
        console.error("Ko-fi widget script loaded, but draw function not found.");
      }
    };

    script.onerror = () => {
        console.error("Failed to load Ko-fi widget script.");
    }

    document.body.appendChild(script);

    // Cleanup function: remove the script when the component unmounts
    return () => {
      const existingScript = document.getElementById('kofi-widget-script');
      if (existingScript) {
        document.body.removeChild(existingScript);Add commentMore actions
      }
      // You might need more specific cleanup if the widget adds elements
      // with specific IDs or classes that you want to remove.
      // For example, inspect the element added by Ko-fi and find its container.
      // const kofiContainer = document.getElementById('kofi-chat-widget-container'); // Example ID
      // if (kofiContainer) kofiContainer.remove();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Return JSX ---
  
  return (
    <div className="bg-white dark:bg-[#0f172a] flex justify-center w-full min-h-screen">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-[1440px] min-h-screen relative px-4 sm:px-6">
        <div className="flex flex-col w-full max-w-[452px] items-center gap-[18px] mx-auto pt-6 sm:pt-[47px]">
          {/* Header */}
          <div className="flex items-start justify-between w-full">
            <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex flex-col w-12 h-12 sm:w-16 sm:h-16 items-center justify-center gap-2.5 px-2 py-3.5 bg-[#ffbc04] rounded-[28px] shrink-0">
                <div className="relative w-[34.5px] h-[32.5px] sm:w-[44.5px] sm:h-[42.5px]">
                  <img className="absolute w-[7px] h-2.5 sm:w-[9px] sm:h-3.5 top-[22px] sm:top-[29px] left-1.5 sm:left-2" alt="Clip path group" src="/clip-path-group.png" />
                  <img className="absolute w-1.5 h-2.5 sm:w-2 sm:h-3 top-[22px] sm:top-[29px] left-3 sm:left-3.5" alt="Clip path group" src="/clip-path-group-1.png" />
                  <img className="absolute w-1 h-[7px] sm:w-1.5 sm:h-[9px] top-5 sm:top-7 left-[15px] sm:left-[19px]" alt="Clip path group" src="/clip-path-group-2.png" />
                  <img className="absolute w-[26px] h-[20px] sm:w-[34px] sm:h-[26px] top-2.5 sm:top-3.5 left-0" alt="Clip path group" src="/clip-path-group-3.png" />
                  <img className="absolute w-3 h-[8px] sm:w-4 sm:h-[11px] top-[17px] sm:top-[22px] left-[8px] sm:left-[11px]" alt="Clip path group" src="/clip-path-group-4.png" />
                  <img className="absolute w-[24px] h-[13px] sm:w-[31px] sm:h-[17px] top-2.5 sm:top-3.5 left-[8px] sm:left-[11px]" alt="Clip path group" src="/clip-path-group-5.png" />
                  <img className="absolute w-0.5 h-0.5 sm:w-1 sm:h-1 top-[21px] sm:top-[27px] left-[8px] sm:left-[11px]" alt="Clip path group" src="/clip-path-group-6.png" />
                  <img className="absolute w-2 h-[7px] sm:w-2.5 sm:h-[9px] top-[10px] sm:top-[13px] left-[18px] sm:left-[23px]" alt="Clip path group" src="/clip-path-group-7.png" />
                  <img className="absolute w-1 h-[2px] sm:w-1.5 sm:h-[3px] top-[16px] sm:top-[21px] left-[12px] sm:left-[15px]" alt="Clip path group" src="/clip-path-group-8.png" />
                  <img className="absolute w-3 h-[12px] sm:w-4 sm:h-[15px] top-0 left-[22px] sm:left-[29px]" alt="Vector" src="/vector-3.svg" />
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex flex-col w-full sm:w-[377px] items-start gap-2">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-fit mt-[-1.00px] font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#313131] dark:text-white text-xl sm:text-2xl tracking-[0] leading-[normal]">
                      <span className="font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#313131] dark:text-white text-xl sm:text-2xl tracking-[0]">
                        smollpng{" "}
                      </span>
                      <span className="text-[10px] sm:text-xs">by</span>
                      <span className="font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#313131] dark:text-white text-xl sm:text-2xl tracking-[0]">
                        &nbsp;
                      </span>
                    </div>
                    <img className="h-4 sm:h-5 w-auto" alt="Frame" src="/frame-17.svg" />
                  </div>
                  <div className="w-full font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#1e1e1e80] dark:text-gray-400 text-[10px] sm:text-xs tracking-[0] leading-[normal]">
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
            className={`w-full h-[200px] sm:h-[254px] ${isDragging ? 'bg-[#ffbc04]/10' : 'bg-[#d7deeb3d] dark:bg-gray-800/50'} rounded-[28px] border-2 border-dashed ${isDragging ? 'border-[#ffbc04]' : 'border-[#a4a4a4] dark:border-gray-700'} cursor-pointer transition-colors duration-200`}
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
                <div className="flex flex-col items-center w-full max-w-md p-4 sm:p-6">
                  <h3 className="text-[#ffbc04] font-bold text-lg sm:text-xl mb-2">
                    Wait a minute... ({optimizedImages.length}/{optimizedImages.length + 1})
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
                    Your image is being optimized
                  </p>
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{currentProcessing.name}</span>
                      <span>{currentProcessing.format}</span>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#ffbc04] transition-all duration-300"
                        style={{ width: `${currentProcessing.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <img className="w-[90px] h-[68px] sm:w-[111px] sm:h-[85px] mb-3" alt="Group" src="/group-3.png" />
                  <div className="flex flex-col items-center">
                    <h2 className="font-['Plus_Jakarta_Sans',Helvetica] font-bold text-black dark:text-white text-xl sm:text-2xl">
                      Drop your Images here
                    </h2>
                    <p className="font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#00000080] dark:text-gray-400 text-xs sm:text-sm">
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
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-start gap-[20px] sm:gap-[25px]">
                  {/* Header */}
                  <div className="flex flex-col items-start gap-[10px] sm:gap-[13px] w-full">
                    <h2 className="font-['Plus_Jakarta_Sans',Helvetica] font-bold text-[#ffbc04] text-xl sm:text-2xl">
                      Smoll Just saved you {getTotalOptimization()}%
                    </h2>
                    <p className="font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#1e1e1e80] dark:text-gray-400 text-[10px] sm:text-xs">
                      {optimizedImages.length} image{optimizedImages.length > 1 ? 's' : ''} optimized
                    </p>
                  </div>

                  {/* Image Details */}
                  <div className="flex flex-col gap-3 sm:gap-4 w-full">
                    {optimizedImages.map((image) => (
                      <div key={image.id} className="group relative flex items-start gap-3 sm:gap-[21px]">
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        <img
                          className="w-[50px] h-[50px] sm:w-[67px] sm:h-[67px] object-cover rounded-lg"
                          alt="Optimized image thumbnail"
                          src={image.thumbnail}
                        />
                        <div className="flex flex-col items-start gap-0.5 sm:gap-1 flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-['Plus_Jakarta_Sans',Helvetica] font-normal text-black dark:text-white truncate w-full">
                            {image.name}
                          </h3>
                          <div className="flex items-start gap-[12px] sm:gap-[18px]">
                            <p className="text-xs sm:text-sm font-['Plus_Jakarta_Sans',Helvetica] font-normal text-black dark:text-white">
                              {image.format}
                            </p>
                            <p className="text-xs sm:text-sm font-['Plus_Jakarta_Sans',Helvetica] font-normal text-black dark:text-white">
                              {image.originalSize}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-start justify-center gap-0.5 sm:gap-1">
                          <p className="text-xs sm:text-sm font-['Plus_Jakarta_Sans',Helvetica] font-normal text-green-600">
                            Optimized
                          </p>
                          <p className="text-xs sm:text-sm font-['Plus_Jakarta_Sans',Helvetica] font-normal text-black dark:text-white">
                            {image.optimizedSize}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Download Button */}
                  <Button 
                    className="w-full h-[40px] sm:h-[49px] bg-[#ffbc04] rounded-lg text-black hover:bg-[#e6aa04] font-semibold text-sm sm:text-base"
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

// If you don't have global declarations for window properties:
declare global {
    interface Window {
        kofiWidgetOverlay?: {
            draw: (username: string, config: Record<string, any>) => void;
            // Add other methods if you use them
        };
    }
}
