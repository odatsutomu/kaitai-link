"use client";

// Re-export the shared PhotoMarkingOverlay with kaitai design tokens
import SharedPhotoMarkingOverlay from "@/components/photo-marking-overlay";
import { T } from "../lib/design-tokens";

type Props = {
  imageBlob: Blob;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
};

export default function PhotoMarkingOverlay({ imageBlob, onComplete, onCancel }: Props) {
  return (
    <SharedPhotoMarkingOverlay
      imageBlob={imageBlob}
      onComplete={onComplete}
      onCancel={onCancel}
      colors={{
        bg: T.bg,
        text: T.text,
        sub: T.sub,
        muted: T.muted,
        border: T.border,
        primary: T.primary,
      }}
    />
  );
}
