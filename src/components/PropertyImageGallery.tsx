import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Maximize2, X, Image as ImageIcon } from 'lucide-react';

interface PropertyImageGalleryProps {
  images: string[];
  title: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({ images, title }) => {
  const safeImages = images && images.length > 0 ? images : [FALLBACK_IMAGE];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % safeImages.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  const currentSrc = imageErrors[currentIndex] ? FALLBACK_IMAGE : safeImages[currentIndex] || FALLBACK_IMAGE;

  return (
    <div className="space-y-3">
      {/* Featured Main Image Box */}
      <div className="relative h-64 sm:h-80 md:h-[360px] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
        <img
          src={currentSrc}
          alt={`${title} - صورة ${currentIndex + 1}`}
          onError={() => setImageErrors((prev) => ({ ...prev, [currentIndex]: true }))}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 opacity-80 pointer-events-none" />

        {/* Top Controls & Counter */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-md">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>صورة {currentIndex + 1} من {safeImages.length}</span>
          </span>

          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-900 cursor-pointer shadow-md transition-all flex items-center gap-1 text-xs font-semibold"
            title="تكبير الصورة الشاشة كاملة"
          >
            <Maximize2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">شاشة كاملة</span>
          </button>
        </div>

        {/* Arrow Navigation Controls */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-slate-950 cursor-pointer transition-all opacity-90 sm:opacity-0 group-hover:opacity-100"
              title="الصورة التالية"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-slate-950 cursor-pointer transition-all opacity-90 sm:opacity-0 group-hover:opacity-100"
              title="الصورة السابقة"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-thin">
          {safeImages.map((img, idx) => {
            const isSelected = idx === currentIndex;
            const src = imageErrors[idx] ? FALLBACK_IMAGE : img;

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/40 opacity-100 scale-105 shadow-md'
                    : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                }`}
              >
                <img
                  src={src}
                  alt="مصغرة"
                  onError={() => setImageErrors((prev) => ({ ...prev, [idx]: true }))}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-5 left-5 z-10 p-3 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center">
            <img
              src={currentSrc}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />

            <div className="mt-4 flex items-center justify-between w-full max-w-md bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-slate-200 text-xs font-bold">
              <span>{title}</span>
              <span className="text-amber-400">{currentIndex + 1} / {safeImages.length}</span>
            </div>

            {safeImages.length > 1 && (
              <>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 cursor-pointer shadow-xl"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 cursor-pointer shadow-xl"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
