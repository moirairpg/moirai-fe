import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';

type EntityBannerProps = {
  imageUrl: string | null;
  name: string;
  mode: 'create' | 'edit' | 'view';
  canGenerate: boolean;
  uiImagePositionX?: number;
  uiImagePositionY?: number;
  onUiImagePositionChange?: (x: number, y: number) => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onGenerate: () => void | Promise<void>;
};

export function EntityBanner({
  imageUrl,
  name,
  mode,
  canGenerate,
  uiImagePositionX = 0.5,
  uiImagePositionY = 0.5,
  onUiImagePositionChange,
  onUpload,
  onRemove,
  onGenerate,
}: EntityBannerProps) {
  const { t } = useTranslation('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const isEditable = mode === 'create' || mode === 'edit';

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await onGenerate();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditable || !imageUrl || !onUiImagePositionChange || isGenerating) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: uiImagePositionX, py: uiImagePositionY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStart.current || !containerRef.current || !onUiImagePositionChange) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStart.current.x) / width;
    const dy = (e.clientY - dragStart.current.y) / height;
    const nx = Math.min(1, Math.max(0, dragStart.current.px - dx));
    const ny = Math.min(1, Math.max(0, dragStart.current.py - dy));
    onUiImagePositionChange(nx, ny);
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`group relative h-56 w-full overflow-hidden rounded-md bg-zinc-900${isEditable && imageUrl ? ' cursor-grab active:cursor-grabbing' : ''}${dragging ? ' select-none' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: `${uiImagePositionX * 100}% ${uiImagePositionY * 100}%` }}
          />
        )}

        {!isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
          {isEditable && imageUrl && (
            <span className="mb-1 text-xs text-white/70">{t('imageBanner.dragHint')}</span>
          )}

          {imageUrl && (
            <button
              type="button"
              className="text-sm font-medium text-white hover:underline"
              onClick={() => setLightboxOpen(true)}>
              {t('imageBanner.viewImage')}
            </button>
          )}

          {isEditable && (
            <>
              <button
                type="button"
                className="text-sm font-medium text-white hover:underline"
                onClick={() => inputRef.current?.click()}>
                {t('imageBanner.uploadImage')}
              </button>

              {imageUrl && (
                <button
                  type="button"
                  className="text-sm font-medium text-white hover:underline"
                  onClick={onRemove}>
                  {t('imageBanner.removeImage')}
                </button>
              )}

              {canGenerate && (
                <button
                  type="button"
                  className="text-sm font-medium text-white hover:underline"
                  onClick={handleGenerate}>
                  {t('imageBanner.generateImage')}
                </button>
              )}
            </>
          )}
        </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="text-sm font-medium text-white">{t('imageBanner.generating')}</span>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent px-6 py-4">
          <span className="text-3xl font-bold text-white">{name || '\u00A0'}</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      {lightboxOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxOpen(false)}>
          <button
            type="button"
            className="absolute right-4 top-4 text-white hover:text-white/70"
            onClick={() => setLightboxOpen(false)}>
            <X className="h-6 w-6" />
          </button>
          <img
            src={imageUrl}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
