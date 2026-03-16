"use client";

import React from 'react';

type AppAlertDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: 'alert' | 'confirm';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

const AppAlertDialog = ({
  isOpen,
  title,
  message,
  variant = 'alert',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: AppAlertDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          {variant === 'confirm' && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppAlertDialog;
