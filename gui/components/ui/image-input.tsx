"use client";

import React, { useState, useRef } from "react";
import {
  LuImagePlus,
  LuImage,
  LuLoader,
  LuRefreshCw,
  LuTrash2,
  LuStar,
  LuX,
  LuCamera,
  LuUpload,
} from "react-icons/lu";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "react-hot-toast";
import { resolveMediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type ImageInputSize = "sm" | "md" | "lg";
export type ImageInputVariant = "button" | "card" | "avatar";

export interface ImageInputProps {
  /** Current image URL (controlled) */
  value?: string;
  /**
   * Called with the selected File. Must return the stored image URL.
   * Upload logic lives in the caller so this component stays generic.
   */
  onUpload: (file: File) => Promise<string>;
  /** Fires with the new URL after upload */
  onChange?: (url: string) => void;
  /** When given, a remove button is shown (card and avatar variants) */
  onRemove?: () => void | Promise<void>;
  /** Avatar variant: shown when there's no image (e.g. the user's initial) */
  fallback?: React.ReactNode;
  /** Thumbnail / avatar / card size */
  size?: ImageInputSize;
  /** Display layout */
  variant?: ImageInputVariant;
  /** Disables all interaction */
  disabled?: boolean;
  /** Optional field label rendered above the control */
  label?: string;
  /** Maximum allowed file size in MB (default: 10) */
  maxSizeMb?: number;
  className?: string;
}

export interface GalleryImage {
  id?: number;
  imageUrl: string;
  previewUrl?: string;
  isPrimary: boolean;
  displayOrder: number;
  altText?: string;
}

export interface MultiImageInputProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  onUpload: (file: File) => Promise<string>;
  minImages?: number;
  maxImages?: number;
  /** Maximum allowed size per file in MB (default: 10) */
  maxSizeMb?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
  gridCols?: string;
  aspectRatio?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Size maps
// ─────────────────────────────────────────────────────────────────────────────
const thumbSize: Record<ImageInputSize, string> = {
  sm: "size-9",
  md: "size-12",
  lg: "size-16",
};

const avatarSize: Record<ImageInputSize, string> = {
  sm: "size-16",
  md: "size-24",
  lg: "size-32",
};

const avatarBadgeSize: Record<ImageInputSize, string> = {
  sm: "size-6",
  md: "size-7",
  lg: "size-8",
};

const cardSquareSize: Record<ImageInputSize, string> = {
  sm: "size-[88px]",
  md: "size-[108px]",
  lg: "size-[128px]",
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
function validateImage(file: File, maxSizeMb: number): string | null {
  if (!file.type.startsWith("image/")) return `"${file.name}" is not an image file.`;
  if (file.size > maxSizeMb * 1024 * 1024) return `"${file.name}" is larger than ${maxSizeMb} MB.`;
  return null;
}

/** Drag-and-drop handlers for any element; ignores drops while `disabled`. */
function useFileDrop(onFiles: (files: File[]) => void, disabled: boolean) {
  const [isDragging, setIsDragging] = useState(false);

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length > 0) onFiles(files);
    },
  };

  return { isDragging, dropProps };
}

function UploadingOverlay({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]",
        className
      )}
    >
      <LuLoader className="size-5 animate-spin text-brand" />
    </span>
  );
}

/** Small round button floating over an image (remove, set cover, …). */
function FloatingIconButton({
  onClick,
  title,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={title} side="top">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={title}
        className={cn(
          "flex size-6 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          danger ? "hover:text-red-600" : "hover:text-brand"
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

// Hidden until hover / keyboard focus; always visible on touch screens
const revealOnHover =
  "opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100";

// ─────────────────────────────────────────────────────────────────────────────
// Single ImageInput
// ─────────────────────────────────────────────────────────────────────────────
export function ImageInput({
  value = "",
  onUpload,
  onChange,
  onRemove,
  size = "md",
  variant = "card",
  disabled = false,
  label,
  maxSizeMb = 10,
  className,
  fallback,
}: ImageInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isBusy = disabled || isUploading;
  // Show the local file instantly while uploading, then the stored URL
  const displaySrc = isUploading && localPreview ? localPreview : value ? resolveMediaUrl(value) : "";

  const uploadFile = async (file: File) => {
    const error = validateImage(file, maxSizeMb);
    if (error) {
      toast.error(error);
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setIsUploading(true);

    try {
      const url = await toast.promise(onUpload(file), {
        loading: "Uploading image…",
        success: "Image uploaded",
        error: (err) => err?.message || "Upload failed",
      });
      onChange?.(url);
    } catch {
      // toast.promise already surfaces the error
    } finally {
      setIsUploading(false);
      setLocalPreview(null);
      URL.revokeObjectURL(preview);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const { isDragging, dropProps } = useFileDrop((files) => uploadFile(files[0]), isBusy);

  const openPicker = () => {
    if (!isBusy) inputRef.current?.click();
  };

  const hiddenInput = (
    <input
      type="file"
      ref={inputRef}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
      }}
      accept="image/*"
      className="hidden"
    />
  );

  // Variant: button — thumbnail + compact outline button
  if (variant === "button") {
    return (
      <div className={cn("inline-flex items-center gap-3", className)} {...dropProps}>
        {label && <Label className="shrink-0">{label}</Label>}

        <span
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200",
            thumbSize[size],
            isDragging && "ring-2 ring-brand"
          )}
        >
          {displaySrc ? (
            <img src={displaySrc} alt="Preview" className="size-full object-cover" />
          ) : (
            <LuImage className="size-4 text-zinc-400" />
          )}
        </span>

        <button
          type="button"
          onClick={openPicker}
          disabled={isBusy}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isUploading ? (
            <LuLoader className="size-3.5 animate-spin text-brand" />
          ) : (
            <LuUpload className="size-3.5" />
          )}
          {isUploading ? "Uploading…" : displaySrc ? "Change" : "Upload"}
        </button>

        {hiddenInput}
      </div>
    );
  }

  // Variant: avatar — circle with a small camera badge
  if (variant === "avatar") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        {label && <Label className="text-center text-xs">{label}</Label>}

        <button
          type="button"
          onClick={openPicker}
          disabled={isBusy}
          aria-label={displaySrc ? "Change photo" : "Upload photo"}
          className={cn(
            "group relative shrink-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
            avatarSize[size]
          )}
          {...dropProps}
        >
          <span
            className={cn(
              "relative flex size-full items-center justify-center overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200 transition-shadow group-hover:ring-zinc-300",
              isDragging && "ring-2 ring-brand"
            )}
          >
            {displaySrc ? (
              <img src={displaySrc} alt="Avatar" className="size-full object-cover" />
            ) : (
              fallback ?? <LuImage className="size-1/3 text-zinc-400" />
            )}
            {isUploading && <UploadingOverlay className="rounded-full" />}
          </span>

          <span
            className={cn(
              "absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-white bg-zinc-900 text-white shadow-sm transition-transform group-hover:scale-105",
              avatarBadgeSize[size]
            )}
          >
            <LuCamera className="size-3.5" />
          </span>
        </button>

        {onRemove && displaySrc && !isUploading && (
          <button
            type="button"
            onClick={() => void onRemove()}
            disabled={disabled}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-red-500 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LuTrash2 className="size-3" /> Remove photo
          </button>
        )}

        {hiddenInput}
      </div>
    );
  }

  // Variant: card (default) — square drop zone / preview
  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      {label && <Label className="text-xs font-medium text-zinc-700">{label}</Label>}

      <div className={cn("group relative", cardSquareSize[size])}>
        <button
          type="button"
          onClick={openPicker}
          disabled={isBusy}
          aria-label={displaySrc ? "Replace image" : "Upload image"}
          className={cn(
            "relative size-full overflow-hidden rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2",
            displaySrc
              ? "bg-zinc-100 ring-1 ring-zinc-200"
              : "border border-dashed border-zinc-300 bg-zinc-50/60 hover:border-brand/60 hover:bg-brand/[0.03]",
            isDragging && "border-brand bg-brand/5 ring-4 ring-brand/10",
            disabled && "cursor-not-allowed opacity-50"
          )}
          {...dropProps}
        >
          {displaySrc ? (
            <>
              <img src={displaySrc} alt="Preview" className="absolute inset-0 size-full object-cover" />
              {!isUploading && (
                <span className="absolute inset-x-1.5 bottom-1.5 flex translate-y-1 items-center justify-center gap-1 rounded-lg bg-white/90 py-1 text-[11px] font-medium text-zinc-700 opacity-0 shadow-sm backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <LuRefreshCw className="size-3" />
                  Replace
                </span>
              )}
            </>
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-1.5 text-zinc-400 transition-colors group-hover:text-brand">
              <LuImagePlus className="size-5" />
              <span className="text-[11px] font-medium">{isDragging ? "Drop image" : "Upload"}</span>
            </span>
          )}
          {isUploading && <UploadingOverlay />}
        </button>

        {displaySrc && onRemove && !isUploading && (
          <div className={cn("absolute right-1.5 top-1.5", revealOnHover)}>
            <FloatingIconButton onClick={onRemove} title="Remove image" disabled={disabled} danger>
              <LuX className="size-3.5" />
            </FloatingIconButton>
          </div>
        )}
      </div>

      {hiddenInput}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MultiImageInput — gallery with a cover image (auto-converted to WebP server-side)
// ─────────────────────────────────────────────────────────────────────────────
export function MultiImageInput({
  value = [],
  onChange,
  onUpload,
  minImages = 2,
  maxImages = 5,
  maxSizeMb = 10,
  disabled = false,
  label,
  className,
  gridCols = "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
  aspectRatio = "aspect-square",
}: MultiImageInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = disabled || isUploading;
  const isValidCount = value.length >= minImages && value.length <= maxImages;

  const uploadFiles = async (fileList: File[]) => {
    if (value.length + fileList.length > maxImages) {
      toast.error(`You can add ${maxImages - value.length} more photo(s) (max ${maxImages}).`);
      return;
    }

    for (const file of fileList) {
      const error = validateImage(file, maxSizeMb);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setIsUploading(true);

    // Instant local previews so the user sees their images right away
    const stagedImages: GalleryImage[] = fileList.map((file, idx) => ({
      imageUrl: "",
      previewUrl: URL.createObjectURL(file),
      isPrimary: value.length === 0 && idx === 0,
      displayOrder: value.length + idx,
      altText: file.name.replace(/\.[^/.]+$/, ""),
    }));

    const updatedWithPreviews = [...value, ...stagedImages];
    onChange(updatedWithPreviews);

    try {
      const urls = await toast.promise(Promise.all(fileList.map((file) => onUpload(file))), {
        loading: `Uploading ${fileList.length} photo(s)…`,
        success: `${fileList.length} photo(s) uploaded`,
        error: (err) => err?.message || "Failed to upload one or more photos.",
      });

      onChange(
        updatedWithPreviews.map((img) => {
          const stagedIndex = stagedImages.findIndex((staged) => staged.previewUrl === img.previewUrl);
          return stagedIndex !== -1 && urls[stagedIndex] ? { ...img, imageUrl: urls[stagedIndex] } : img;
        })
      );
    } catch {
      // Revert if failed
      stagedImages.forEach((img) => img.previewUrl && URL.revokeObjectURL(img.previewUrl));
      onChange(value);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const { isDragging, dropProps } = useFileDrop(uploadFiles, isBusy || value.length >= maxImages);

  const handleRemove = (indexToRemove: number) => {
    const removed = value[indexToRemove];
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);

    const next = value.filter((_, idx) => idx !== indexToRemove);
    if (next.length > 0 && !next.some((img) => img.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    onChange(value.map((img, idx) => ({ ...img, isPrimary: idx === indexToPrimary })));
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {label || "Product Gallery"} <span className="text-red-500">*</span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Add {minImages}–{maxImages} photos. The cover photo is shown first.
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-[11px] font-medium tabular-nums",
            isValidCount ? "text-zinc-500" : "text-amber-600"
          )}
        >
          {value.length}/{maxImages}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) uploadFiles(files);
        }}
        disabled={isBusy}
      />

      {/* Grid */}
      <div className={cn("grid gap-2.5", gridCols)} {...dropProps}>
        {value.map((img, idx) => {
          const displaySrc = img.previewUrl || resolveMediaUrl(img.imageUrl);
          const isPending = !img.imageUrl;

          return (
            <div
              key={idx}
              className={cn(
                "group relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900",
                aspectRatio,
                img.isPrimary ? "ring-2 ring-brand ring-offset-2" : "ring-1 ring-zinc-200 dark:ring-zinc-800"
              )}
            >
              {displaySrc ? (
                <img
                  src={displaySrc}
                  alt={img.altText || `Product image ${idx + 1}`}
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-zinc-400">
                  <LuImage className="size-5" />
                </span>
              )}

              {isPending && isUploading && <UploadingOverlay />}

              {img.isPrimary && (
                <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 shadow-sm backdrop-blur">
                  <LuStar className="size-2.5 fill-brand text-brand" />
                  Cover
                </span>
              )}

              {!isPending && (
                <div className={cn("absolute right-1.5 top-1.5 flex gap-1", revealOnHover)}>
                  {!img.isPrimary && (
                    <FloatingIconButton onClick={() => handleSetPrimary(idx)} title="Set as cover" disabled={isBusy}>
                      <LuStar className="size-3" />
                    </FloatingIconButton>
                  )}
                  <FloatingIconButton onClick={() => handleRemove(idx)} title="Remove" disabled={isBusy} danger>
                    <LuTrash2 className="size-3" />
                  </FloatingIconButton>
                </div>
              )}
            </div>
          );
        })}

        {/* Add tile */}
        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 text-zinc-400 transition-colors cursor-pointer select-none hover:border-brand/60 hover:bg-brand/[0.03] hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              aspectRatio,
              isDragging && "border-brand bg-brand/5 text-brand",
              isBusy && "cursor-not-allowed opacity-50"
            )}
          >
            {isUploading ? (
              <LuLoader className="size-5 animate-spin" />
            ) : (
              <LuImagePlus className="size-5" />
            )}
            <span className="text-[11px] font-medium">
              {isUploading ? "Uploading…" : isDragging ? "Drop to add" : "Add photo"}
            </span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-zinc-400">
        JPG, PNG or WebP · up to {maxSizeMb} MB each · drag & drop supported
      </p>
    </div>
  );
}
