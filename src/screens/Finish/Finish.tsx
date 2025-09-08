import React, { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { X, Download, Upload, Zap, Image as ImageIcon, CheckCircle, Sparkles } from "lucide-react";

interface OptimizedImage {
  id: string;
  name: string;
  format: string;
  originalSize: string;
  optimizedSize: string;
  thumbnail: string;
  blob: Blob;
  compressionRatio: number;
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

  const calculateCompressionRatio = (originalSize: number, compressedSize: number): number => {
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
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
      const compressionRatio = calculateCompressionRatio(file.size, compressedFile.size);

      const optimizedImage: OptimizedImage = {
        id: crypto.randomUUID(),
        name: file.name,
        format: file.type.split('/')[1].toUpperCase(),
        originalSize: formatFileSize(file.size),
        optimizedSize: formatFileSize(compressedFile.size),
        thumbnail,
        blob: compressedFile,
        compressionRatio
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Apple-style background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-violet-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-5xl relative z-10">
        {/* Header with your logo */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            {/* Your custom logo */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/25 backdrop-blur-xl border border-white/20">
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="drop-shadow-lg">
                  <path d="M19.5019 34.3397L1.5 22.8695L28.2639 29.4915L12.4923 24.6219L5.32342 10.9213L39.8935 2L53.5941 20.7985L64.5864 3.91171L105.051 10.9213L101.865 18.1163L111.105 14.1075L94.0585 30.5163V65.5643L62.0374 85L19.5019 69.547V34.3397Z" fill="#000000"/>
                </svg>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur opacity-30 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent tracking-tight">
                SmollPNG
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium mt-1">
                Smart image compression for faster websites
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        {/* Apple-style liquid glass stats cards */}
        {optimizedImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/20 dark:border-slate-700/30 shadow-2xl shadow-black/5 hover:shadow-black/10 transition-all duration-500 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                  <ImageIcon className="w-8 h-8 text-white drop-shadow-sm" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {optimizedImages.length}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Images Optimized
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/20 dark:border-slate-700/30 shadow-2xl shadow-black/5 hover:shadow-black/10 transition-all duration-500 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                  <Sparkles className="w-8 h-8 text-white drop-shadow-sm" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {getTotalOptimization()}%
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Size Reduction
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/20 dark:border-slate-700/30 shadow-2xl shadow-black/5 hover:shadow-black/10 transition-all duration-500 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                  <Download className="w-8 h-8 text-white drop-shadow-sm" />
                </div>
                <Button 
                  onClick={handleDownloadAll}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-xl shadow-purple-500/25 font-semibold py-3 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  Download All
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Apple-style liquid glass drop zone */}
        <Card 
          className={`mb-12 transition-all duration-500 border-0 shadow-2xl backdrop-blur-2xl cursor-pointer group ${
            isDragging 
              ? 'bg-gradient-to-br from-amber-50/60 to-orange-100/60 dark:from-amber-900/20 dark:to-orange-900/20 scale-105 shadow-amber-500/20' 
              : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:scale-102 shadow-black/5 hover:shadow-black/10'
          } border border-white/20 dark:border-slate-700/30`}
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
          <CardContent className="p-16">
            {isProcessing && currentProcessing ? (
              <div className="text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/25">
                    <Zap className="w-12 h-12 text-white animate-pulse drop-shadow-lg" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl blur opacity-30 animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Optimizing Images...
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
                  Processing {currentProcessing.name}
                </p>
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm mb-3 font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="text-slate-900 dark:text-white">{Math.round(currentProcessing.progress)}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 rounded-full shadow-lg"
                      style={{ width: `${currentProcessing.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className={`relative mb-8 transition-all duration-500 ${
                  isDragging ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  <div className={`w-28 h-28 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transition-all duration-500 ${
                    isDragging 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30' 
                      : 'bg-gradient-to-br from-slate-200/80 to-slate-300/80 dark:from-slate-700/80 dark:to-slate-600/80 shadow-black/10 group-hover:shadow-black/20'
                  } backdrop-blur-xl border border-white/20`}>
                    <Upload className={`w-14 h-14 transition-all duration-300 drop-shadow-lg ${
                      isDragging ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`} />
                  </div>
                  {!isDragging && (
                    <div className="absolute -inset-3 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  )}
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                  {isDragging ? 'Drop your images here!' : 'Drag & drop your images'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg font-medium">
                  Or click to browse • Up to 10 images • PNG, JPG, WebP supported
                </p>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-2xl shadow-blue-500/25 font-semibold px-8 py-4 text-lg rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  Choose Files
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apple-style liquid glass results */}
        {optimizedImages.length > 0 && (
          <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/20 dark:border-slate-700/30 shadow-2xl shadow-black/5">
            <CardContent className="p-10">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-4 tracking-tight">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <CheckCircle className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                Optimization Complete!
              </h2>
              
              <div className="space-y-4">
                {optimizedImages.map((image) => (
                  <div key={image.id} className="group relative bg-white/30 dark:bg-slate-700/30 backdrop-blur-xl rounded-2xl p-6 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-300 border border-white/20 dark:border-slate-600/20 shadow-lg hover:shadow-xl hover:scale-102">
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="absolute top-4 right-4 w-10 h-10 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20"
                    >
                      <X className="w-5 h-5 text-white drop-shadow-sm" />
                    </button>
                    
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <img
                          className="w-20 h-20 object-cover rounded-2xl shadow-lg border border-white/20"
                          alt="Optimized thumbnail"
                          src={image.thumbnail}
                        />
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate mb-2">
                          {image.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="bg-slate-200/80 dark:bg-slate-600/80 backdrop-blur-sm px-3 py-1 rounded-lg font-semibold border border-white/20">
                            {image.format}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {image.originalSize} → {image.optimizedSize}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold mb-1 ${
                          image.compressionRatio > 50 ? 'text-green-600 dark:text-green-400' : 
                          image.compressionRatio > 25 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          -{image.compressionRatio}%
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          saved
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
