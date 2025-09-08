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

  // --- Add Ko-fi Widget ---
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;
    script.id = "kofi-widget-script";

    script.onload = () => {
      if (typeof (window as any).kofiWidgetOverlay?.draw === "function") {
        (window as any).kofiWidgetOverlay.draw("ahmadmizanh", {
          type: "floating-chat",
          "floating-chat.donateButton.text": "Tip Me",
          "floating-chat.donateButton.background-color": "#00b9fe",
          "floating-chat.donateButton.text-color": "#fff",
        });
      } else {
        console.error("Ko-fi widget script loaded, but draw function not found.");
      }
    };

    script.onerror = () => {
      console.error("Failed to load Ko-fi widget script.");
    };

    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById("kofi-widget-script");
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
      const kofiContainer = document.getElementById("kofi-chat-widget-container");
      if (kofiContainer) kofiContainer.remove();
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
      {/* Apple-style background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-violet-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-5xl relative z-10">
        {/* ... keep ALL your JSX for header, cards, drop zone, results ... */}
      </div>
    </div>
  );
};

// --- TypeScript global declaration ---
declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, config: Record<string, any>) => void;
    };
  }
}
