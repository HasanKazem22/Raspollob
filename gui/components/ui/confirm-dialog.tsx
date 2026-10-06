"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Explanation shown in the body, e.g. what will be deleted */
  message: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  isLoading?: boolean;
}

/** Confirmation for destructive actions (delete, remove…) with a red confirm button. */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  message,
  onConfirm,
  confirmText = "Delete",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      onSave={onConfirm}
      saveText={confirmText}
      saveVariant="danger"
      isLoading={isLoading}
      size="sm"
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{message}</p>
    </Modal>
  );
}
