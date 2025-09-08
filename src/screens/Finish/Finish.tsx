import React, { useCallback, useState, useEffect } from "react";
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
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const calculateCompressionRatio = (originalSize: number, compressedSize: number): number => {
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  };

  const handleImageOptimization = async (file: File) => {
    try {
      setCurrentProcessing({
        name: file.name,
        format: file.type.split("/")[1].toUpperCase(),
        progress: 0,
      });

      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        initialQuality: 0.9,
        alwaysKeepResolution: true,
        onProgress: (progress: number) => {
          setCurrentProcessing((prev) => (prev ? { ...prev, progress } : null));
        },
      };

      const compressedFile = await imageCompression(file, options);
      const thumbnail = URL.createObjectURL(compressedFile);
      const compressionRatio = calculateCompressionRatio(file.size, compressedFile.size);

      const optimizedImage: OptimizedImage = {
        id: crypto.randomUUID(),
        name: file.name,
        format: file.type.split("/")[1].toUpperCase(),
        originalSize: formatFileSize(file.size),
        optimizedSize: formatFileSize(compressedFile.size),
        thumbnail,
        blob: compressedFile,
        compressionRatio,
      };

      setOptimizedImages((prev) => [...prev, optimizedImage]);
    } catch (error) {
      console.error("Error optimizing image:", error);
    }
  };

  const handleFiles = async (files: FileList) => {
    setIsProcessing(true);
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 10) {
      alert("Please select up to 10 images only");
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
      const link = document.createElement("a");
      link.href = URL.createObjectURL(image.blob);
      link.download = `optimized-${image.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleDeleteImage = (id: string) => {
    setOptimizedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const getTotalOptimization = () => {
    if (optimizedImages.length === 0) return 0;

    const totalOriginal = optimizedImages.reduce((acc, img) => {
      const size = parseFloat(img.originalSize.split(" ")[0]);
      const unit = img.originalSize.split(" ")[1];
      return acc + (unit === "MB" ? size * 1024 : size);
    }, 0);

    const totalOptimized = optimizedImages.reduce((acc, img) => {
      const size = parseFloat(img.optimizedSize.split(" ")[0]);
      const unit = img.optimizedSize.split(" ")[1];
      return acc + (unit === "MB" ? size * 1024 : size);
    }, 0);

    return Math.round(((totalOriginal - totalOptimized) / totalOriginal) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-violet-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-5xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-amber-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Image Optimizer
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Drop Zone */}
        <Card className="mb-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 transition-colors duration-300">
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex flex-col items-center justify-center p-12 cursor-pointer transition-colors ${
                isDragging
                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500"
                  : "bg-transparent"
              }`}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                id="fileInput"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <Upload className="h-12 w-12 text-amber-500 mb-4" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                Drag & drop images here, or click to select
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Supports up to 10 images
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Processing */}
        {isProcessing && currentProcessing && (
          <Card className="mb-8 border-amber-200 dark:border-amber-900">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Sparkles className="h-8 w-8 text-amber-500 animate-spin" />
                <div className="flex-1">
                  <h3 className="font-semibold">{currentProcessing.name}</h3>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 mt-2">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${currentProcessing.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {currentProcessing.progress.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {optimizedImages.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-amber-500" />
                  Optimized Images
                </h2>
                <Button
                  onClick={handleDownloadAll}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Download className="h-4 w-4 mr-2" /> Download All
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {optimizedImages.map((image) => (
                  <div
                    key={image.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={image.thumbnail}
                      alt={image.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium truncate">{image.name}</h3>
                      <p className="text-sm text-slate-500">
                        {image.format} | {image.optimizedSize} (↓
                        {image.compressionRatio}%)
                      </p>
                      <Separator className="my-3" />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(image.blob);
                            link.download = `optimized-${image.name}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" /> Download
                        </Button>
                        <Button
                          onClick={() => handleDeleteImage(image.id)}
                          variant="outline"
                          className="px-3"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Total optimization */}
              <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900">
                <p className="text-amber-700 dark:text-amber-300 font-medium">
                  Total optimization achieved: {getTotalOptimization()}%
                </p>
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
