import React, { useCallback, useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { X, Download, Upload, Zap, Image as ImageIcon, CheckCircle, Sparkles, Settings, RefreshCw } from "lucide-react";

interface OptimizedImage {
  id: string;
  name: string;
  format: string;
  originalFormat: string;
  originalSize: string;
  optimizedSize: string;
  thumbnail: string;
  blob: Blob;
  compressionRatio: number;
  isConverted: boolean;
}

interface ProcessingImage {
  name: string;
  format: string;
  progress: number;
}

type ConversionFormat = 'AVIF' | 'WEBP' | 'JPEG' | 'PNG';
export const Finish = (): JSX.Element => {
  const [isDragging, setIsDragging] = useState(false);
  const [optimizedImages, setOptimizedImages] = useState<OptimizedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessing, setCurrentProcessing] = useState<ProcessingImage | null>(null);
  const [manualConversion, setManualConversion] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ConversionFormat>('WEBP');
  
  // ✅ Ko-fi widget loader
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;
    script.id = "kofi-widget-script";

    script.onload = () => {
      if (typeof window.kofiWidgetOverlay?.draw === "function") {
        window.kofiWidgetOverlay.draw("ahmadmizanh", {
          type: "floating-chat",
          "floating-chat.donateButton.text": "Tip Me",
          "floating-chat.donateButton.background-color": "#00b9fe",
          "floating-chat.donateButton.text-color": "#fff",
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      document.getElementById("kofi-widget-script")?.remove();
      document.getElementById("kofi-chat-widget-container")?.remove();
    };
  }, []);
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateCompressionRatio = (originalSize: number, compressedSize: number): number => {
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  };

  const convertImageFormat = async (file: File, targetFormat: ConversionFormat): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const mimeType = targetFormat === 'AVIF' ? 'image/avif' :
                        targetFormat === 'WEBP' ? 'image/webp' :
                        targetFormat === 'JPEG' ? 'image/jpeg' : 'image/png';
        
        const quality = targetFormat === 'PNG' ? undefined : 0.9;
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image'));
          }
        }, mimeType, quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };
  const handleImageOptimization = async (file: File) => {
    try {
      const originalFormat = file.type.split('/')[1].toUpperCase();
      let targetFormat = originalFormat;
      let isConverted = false;
      
      if (manualConversion) {
        targetFormat = selectedFormat;
        isConverted = originalFormat !== selectedFormat;
      }
      
      setCurrentProcessing({
        name: file.name,
        format: targetFormat,
        progress: 0
      });

      let processedFile = file;
      
      // Convert format if needed
      if (manualConversion && isConverted) {
        setCurrentProcessing(prev => prev ? { ...prev, progress: 25 } : null);
        const convertedBlob = await convertImageFormat(file, selectedFormat);
        processedFile = new File([convertedBlob], file.name, { type: convertedBlob.type });
      }

      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        initialQuality: 0.9,
        alwaysKeepResolution: true,
        onProgress: (progress: number) => {
          const adjustedProgress = manualConversion && isConverted ? 25 + (progress * 0.75) : progress;
          setCurrentProcessing(prev => prev ? { ...prev, progress: adjustedProgress } : null);
        }
      };

      const compressedFile = await imageCompression(processedFile, options);
      const thumbnail = URL.createObjectURL(compressedFile);
      const compressionRatio = calculateCompressionRatio(file.size, compressedFile.size);

      const optimizedImage: OptimizedImage = {
        id: crypto.randomUUID(),
        name: file.name,
        format: targetFormat,
        originalFormat,
        originalSize: formatFileSize(file.size),
        optimizedSize: formatFileSize(compressedFile.size),
        thumbnail,
        blob: compressedFile,
        compressionRatio,
        isConverted
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
      const extension = image.format.toLowerCase();
      const nameWithoutExt = image.name.replace(/\.[^/.]+$/, "");
      link.download = `${nameWithoutExt}-optimized.${extension}`;
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
    
    const totalOriginal = optimizedImages.reduce((acc, img) => {
      const size = parseFloat(img.originalSize.split(' ')[0]);
      const unit = img.originalSize.split(' ')[1];
      return acc + (unit === 'MB' ? size * 1024 : size);
    }, 0);

    const totalOptimized = optimizedImages.reduce((acc, img) => {
      const size = parseFloat(img.optimizedSize.split(' ')[0]);
      const unit = img.optimizedSize.split(' ')[1];
      return acc + (unit === 'MB' ? size * 1024 : size);
    }, 0);

    return Math.round(((totalOriginal - totalOptimized) / totalOriginal) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 relative overflow-hidden transition-all duration-700">
      {/* Apple-style background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-tr from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-7xl relative z-10">
        {/* Header with your logo */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 lg:mb-16 gap-6 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            {/* Your custom logo */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/25 backdrop-blur-xl border border-white/20 transition-all duration-500 hover:scale-110 animate-glow">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none" className="drop-shadow-lg sm:w-10 sm:h-10 lg:w-12 lg:h-12">
                  <path d="M19.5019 34.3397L1.5 22.8695L28.2639 29.4915L12.4923 24.6219L5.32342 10.9213L39.8935 2L53.5941 20.7985L64.5864 3.91171L105.051 10.9213L101.865 18.1163L111.105 14.1075L94.0585 30.5163V65.5643L62.0374 85L19.5019 69.547V34.3397Z" fill="#000000"/>
                </svg>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl sm:rounded-3xl blur opacity-30 animate-glow"></div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent tracking-tight transition-all duration-300">
                SmollR
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base lg:text-lg font-medium mt-1 sm:mt-2 max-w-md">
                Smart image compression for faster websites
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Apple-style liquid glass stats cards */}
        {optimizedImages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16 animate-slide-up">
            <Card className="glass rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 group">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 glass-intense rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                  <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-sm" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 transition-colors duration-300">
                  {optimizedImages.length}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                  Images Optimized
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 group">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 glass-intense rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-all duration-300">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-sm" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 transition-colors duration-300">
                  {getTotalOptimization()}%
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                  Size Reduction
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 group sm:col-span-2 lg:col-span-1">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 glass-intense rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300">
                  <Download className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-sm" />
                </div>
                <Button 
                  onClick={handleDownloadAll}
                  className="w-full glass-intense bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-600/90 hover:to-pink-600/90 text-white border-0 shadow-xl shadow-purple-500/25 font-semibold py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  Download All
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Apple-style liquid glass drop zone */}
        <Card 
          className={`mb-8 sm:mb-12 lg:mb-16 transition-all duration-500 border-0 shadow-2xl backdrop-blur-2xl cursor-pointer group ${
            isDragging 
              ? 'glass-intense scale-102 sm:scale-105 shadow-blue-500/30' 
              : 'glass hover:scale-101 sm:hover:scale-102 hover:shadow-3xl'
          } rounded-2xl`}
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
          <CardContent className="p-8 sm:p-12 lg:p-16">
            {isProcessing && currentProcessing ? (
              <div className="text-center">
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 glass-intense bg-gradient-to-br from-blue-500/80 to-purple-500/80 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/25 animate-float">
                    {manualConversion ? (
                      <RefreshCw className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-spin drop-shadow-lg" />
                    ) : (
                      <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-pulse drop-shadow-lg" />
                    )}
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl sm:rounded-3xl blur opacity-30 animate-glow"></div>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
                  {manualConversion ? 'Converting & Optimizing...' : 'Optimizing Images...'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 font-medium text-sm sm:text-base">
                  Processing {currentProcessing.name} {manualConversion ? `→ ${currentProcessing.format}` : ''}
                </p>
                <div className="max-w-xs sm:max-w-md mx-auto">
                  <div className="flex justify-between text-xs sm:text-sm mb-2 sm:mb-3 font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="text-slate-900 dark:text-white">{Math.round(currentProcessing.progress)}%</span>
                  </div>
                  <div className="w-full h-3 sm:h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 rounded-full shadow-lg"
                      style={{ width: `${currentProcessing.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className={`relative mb-8 transition-all duration-500 ${
                  isDragging ? 'scale-105 sm:scale-110' : 'group-hover:scale-105'
                }`}>
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-2xl transition-all duration-500 ${
                    isDragging 
                      ? 'glass-intense bg-gradient-to-br from-blue-400/80 to-indigo-500/80 shadow-blue-500/30' 
                      : 'glass-subtle shadow-black/10 group-hover:shadow-black/20'
                  }`}>
                    <Upload className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 transition-all duration-300 drop-shadow-lg ${
                      isDragging ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`} />
                  </div>
                  {!isDragging && (
                    <div className="absolute -inset-3 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-2xl sm:rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 tracking-tight">
                  {isDragging ? 'Drop your images here!' : 'Drag & drop your images'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg font-medium max-w-md mx-auto">
                  Or click to browse • Up to 10 images • PNG, JPG, WebP supported
                </p>
                
                {/* Manual Conversion Toggle */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setManualConversion(!manualConversion);
                      }}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                        manualConversion 
                          ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/25' 
                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                      }`}
                    >
                      {manualConversion && (
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                      )}
                    </button>
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">
                      Convert my images manually
                    </span>
                  </div>
                  
                  {/* Format Selection */}
                  {manualConversion && (
                    <div className="animate-slide-up">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-md mx-auto">
                        {(['AVIF', 'WEBP', 'JPEG', 'PNG'] as ConversionFormat[]).map((format) => (
                          <button
                            key={format}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFormat(format);
                            }}
                            className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
                              selectedFormat === format
                                ? 'glass-intense bg-blue-500/80 text-white shadow-lg shadow-blue-500/25 scale-105'
                                : 'glass-subtle text-slate-700 dark:text-slate-300 hover:scale-102'
                            }`}
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 font-medium">
                        {selectedFormat === 'AVIF' && 'Best compression, modern browsers'}
                        {selectedFormat === 'WEBP' && 'Great compression, wide support'}
                        {selectedFormat === 'JPEG' && 'Universal support, good for photos'}
                        {selectedFormat === 'PNG' && 'Lossless, supports transparency'}
                      </p>
                    </div>
                  )}
                </div>
                
                <Button className="glass-intense bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/90 hover:to-purple-600/90 text-white border-0 shadow-2xl shadow-blue-500/25 font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/40">
                  Choose Files
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apple-style liquid glass results */}
        {optimizedImages.length > 0 && (
          <Card className="glass rounded-2xl shadow-2xl animate-slide-up">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 tracking-tight text-center sm:text-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 glass-intense bg-gradient-to-br from-green-500/80 to-emerald-400/80 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 animate-glow">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm" />
                </div>
                {manualConversion ? 'Conversion & Optimization Complete!' : 'Optimization Complete!'}
              </h2>
              
              <div className="space-y-3 sm:space-y-4">
                {optimizedImages.map((image) => (
                  <div key={image.id} className="group relative glass-subtle rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:scale-102 hover:-translate-y-1 transition-all duration-300">
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 glass-intense bg-red-500/80 hover:bg-red-500/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-10"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" />
                    </button>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="relative">
                        <img
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl sm:rounded-2xl shadow-lg glass-subtle transition-transform duration-300 group-hover:scale-110"
                          alt="Optimized thumbnail"
                          src={image.thumbnail}
                        />
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate mb-1 sm:mb-2">
                          {image.name}
                        </h3>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          <span className="glass-subtle px-2 sm:px-3 py-1 rounded-md sm:rounded-lg font-semibold">
                            {image.isConverted ? (
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="glass-subtle bg-orange-200/50 dark:bg-orange-600/50 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg font-semibold text-xs">
                                  {image.originalFormat}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500">→</span>
                                <span className="glass-subtle bg-green-200/50 dark:bg-green-600/50 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg font-semibold text-xs">
                                  {image.format}
                                </span>
                              </div>
                            ) : (
                              <span className="glass-subtle px-2 sm:px-3 py-1 rounded-md sm:rounded-lg font-semibold">
                                {image.format}
                              </span>
                            )}
                            {image.originalSize} → {image.optimizedSize}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center sm:text-right shrink-0">
                        <div className={`text-xl sm:text-2xl font-bold mb-1 transition-colors duration-300 ${
                          image.compressionRatio > 50 ? 'text-green-600 dark:text-green-400' : 
                          image.compressionRatio > 25 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          -{image.compressionRatio}%
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {image.isConverted ? 'converted' : 'saved'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
// ✅ TS global for Ko-fi
declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, config: Record<string, any>) => void;
    };
  }
}
