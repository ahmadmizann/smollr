import React, { useCallback, useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
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
  const [currentProcessing, setCurrentProcessing] =
    useState<ProcessingImage | null>(null);

  // ✅ Manual conversion toggle
  const [manualMode, setManualMode] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<
    "avif" | "jpeg" | "png" | "webp"
  >("avif");

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
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const calculateCompressionRatio = (
    originalSize: number,
    compressedSize: number
  ): number => {
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
          setCurrentProcessing((prev) =>
            prev ? { ...prev, progress } : null
          );
        },
      };

      const compressedFile = await imageCompression(file, options);
      const thumbnail = URL.createObjectURL(compressedFile);
      const compressionRatio = calculateCompressionRatio(
        file.size,
        compressedFile.size
      );

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
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

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

  // ✅ Convert with manual format if selected
  const handleManualConversion = async (
    file: File,
    format: string
  ): Promise<Blob> => {
    const options = {
      fileType: `image/${format}`,
      initialQuality: 0.9,
    };
    const converted = await imageCompression(file, options);
    return converted;
  };

  const handleDownloadAll = async () => {
    for (const image of optimizedImages) {
      let blob = image.blob;

      if (manualMode) {
        blob = await handleManualConversion(
          new File([image.blob], image.name, { type: image.blob.type }),
          selectedFormat
        );
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `optimized-${image.name.split(".")[0]}.${
        manualMode ? selectedFormat : image.format.toLowerCase()
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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

    return Math.round(
      ((totalOriginal - totalOptimized) / totalOriginal) * 100
    );
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
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/25 backdrop-blur-xl border border-white/20">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 48 48"
                  fill="none"
                  className="drop-shadow-lg"
                >
                  <path
                    d="M19.5019 34.3397L1.5 22.8695L28.2639 29.4915L12.4923 24.6219L5.32342 10.9213L39.8935 2L53.5941 20.7985L64.5864 3.91171L105.051 10.9213L101.865 18.1163L111.105 14.1075L94.0585 30.5163V65.5643L62.0374 85L19.5019 69.547V34.3397Z"
                    fill="#000000"
                  />
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

        {/* ✅ Manual conversion toggle + buttons */}
        <div className="flex items-center gap-4 mb-6">
          <Switch checked={manualMode} onCheckedChange={setManualMode} />
          <Label className="text-slate-700 dark:text-slate-300 font-medium">
            Convert my images manually
          </Label>
        </div>

        {manualMode && (
          <div className="flex gap-3 mb-8">
            {["avif", "jpeg", "png", "webp"].map((fmt) => (
              <Button
                key={fmt}
                onClick={() => setSelectedFormat(fmt as any)}
                className={`px-6 py-2 rounded-xl font-semibold transition ${
                  selectedFormat === fmt
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        )}

        {/* Stats cards, dropzone, results... (unchanged) */}
        {/* ... keep your existing code here ... */}
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
