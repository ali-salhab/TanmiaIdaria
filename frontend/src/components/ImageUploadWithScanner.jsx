import React, { useRef, useState } from "react";
import { Upload, Camera, Trash2, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ImageUploadWithScanner({
  onUpload,
  label,
  currentImage,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
}) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    if (file.size > maxSize) {
      toast.error(`حجم الملف يجب أن يكون أقل من ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
      onUpload(file);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setIsScanning(true);
      videoRef.current.srcObject = stream;
    } catch {
      toast.error("فشل في الوصول إلى الكاميرا");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!canvas || !video) return;

    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `scan-${Date.now()}.png`, {
          type: "image/png",
        });
        handleFileSelect(file);
        stopScanning();
        toast.success("تم التقاط الصورة بنجاح");
      }
    });
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIsScanning(false);
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {previewUrl && (
        <div className="relative bg-gray-100 rounded-lg overflow-hidden h-48">
          <img
            src={previewUrl}
            alt="معاينة"
            className="w-full h-full object-contain"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              title="معاينة"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={clearImage}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            <button
              onClick={capturePhoto}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              التقط الصورة
            </button>
            <button
              onClick={stopScanning}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {!isScanning && (
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            رفع صورة
          </button>
          <button
            onClick={startScanning}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            مسح ضوئي
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-2xl">
            <img src={previewUrl} alt="معاينة كاملة" className="w-full" />
            <button
              onClick={() => setShowPreview(false)}
              className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
