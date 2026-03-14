"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dice5, Sparkles, Target, X } from "lucide-react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";

import { useTranslation } from "@/modules/i18n/use-translation";

type BoxAddModeDialogProps = {
  isOpen: boolean;
  boxName: string;
  onClose: () => void;
  onCustomize: () => void;
  onAutoMode: () => void;
};

export function BoxAddModeDialog({
  isOpen,
  boxName,
  onClose,
  onCustomize,
  onAutoMode,
}: BoxAddModeDialogProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-[var(--gd-color-leaf)]/20 bg-gradient-to-br from-[#f9fff4] via-[#fffdf4] to-[#eef9ff] shadow-[0_30px_70px_rgba(16,56,31,0.32)]"
          onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute -left-12 -top-10 h-40 w-40 rounded-full bg-[var(--gd-color-citrus)]/20 blur-2xl" />
          <div className="pointer-events-none absolute -right-10 top-1/3 h-36 w-36 rounded-full bg-[var(--gd-color-leaf)]/20 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3 border-b border-[var(--gd-color-leaf)]/15 bg-gradient-to-r from-[var(--gd-color-citrus)]/20 via-white/75 to-[var(--gd-color-sprout)]/25 px-6 py-5">
            <div>
              <p className="inline-flex items-center rounded-full bg-gradient-to-r from-[var(--gd-color-orange)] to-[var(--gd-color-leaf)] bg-clip-text text-[11px] font-extrabold uppercase tracking-[0.2em] text-transparent">
                {t("boxes.add_mode_badge")}
              </p>
              <h3 className="mt-2 text-2xl font-black leading-tight text-[var(--gd-color-forest)] md:text-[1.9rem]">
                {t("boxes.add_mode_title")} <span className="align-middle">✨</span>
              </h3>
              <p className="mt-2 inline-flex items-center rounded-full border border-[var(--gd-color-leaf)]/30 bg-white/80 px-3 py-1 text-sm font-semibold text-[var(--gd-color-forest)] shadow-sm">
                🎁 {boxName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.back")}
              className="rounded-full p-2 text-gray-500 transition hover:bg-white/90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative grid gap-4 px-5 py-5 md:grid-cols-2 md:gap-5 md:px-6 md:py-6">
            <motion.button
              type="button"
              onClick={onCustomize}
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="group relative flex h-full flex-col items-start gap-3 overflow-hidden rounded-2xl border border-[var(--gd-color-leaf)]/30 bg-gradient-to-br from-[#e8ffd9] via-[#f5ffe9] to-white p-4 text-left shadow-[0_8px_18px_rgba(34,120,58,0.12)] transition-all hover:shadow-[0_14px_28px_rgba(34,120,58,0.22)]"
            >
              <div className="pointer-events-none absolute -right-5 -top-6 h-24 w-24 rounded-full bg-[var(--gd-color-leaf)]/20 blur-xl" />
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/90 p-3 text-[var(--gd-color-leaf)] shadow-md">
                  <Target className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-base font-black text-[var(--gd-color-forest)]">
                    {t("boxes.add_mode_customize")}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[var(--gd-color-forest)]/75">
                    {t("boxes.add_mode_customize_subtitle")}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {t("boxes.add_mode_customize_desc")}
                  </p>
                </div>
              </div>
              <span className="mt-auto inline-flex items-center rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-[var(--gd-color-leaf)] shadow-sm">
                🎯 {t("boxes.add_mode_customize_chip")}
              </span>
            </motion.button>

            <motion.button
              type="button"
              onClick={onAutoMode}
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="group relative flex h-full flex-col items-start gap-3 overflow-hidden rounded-2xl border border-[var(--gd-color-citrus)]/35 bg-gradient-to-br from-[#fff7d9] via-[#fffcea] to-white p-4 text-left shadow-[0_8px_18px_rgba(230,154,44,0.12)] transition-all hover:shadow-[0_14px_28px_rgba(230,154,44,0.24)]"
            >
              <div className="pointer-events-none absolute -right-6 -top-5 h-24 w-24 rounded-full bg-[var(--gd-color-citrus)]/25 blur-xl" />
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/90 p-3 text-[var(--gd-color-orange)] shadow-md">
                  <Dice5 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-base font-black text-[var(--gd-color-forest)]">
                    {t("boxes.add_mode_auto")}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[var(--gd-color-orange)]">
                    {t("boxes.add_mode_auto_subtitle")}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">{t("boxes.add_mode_auto_desc")}</p>
                </div>
              </div>
              <span className="mt-auto inline-flex items-center rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-[var(--gd-color-orange)] shadow-sm">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {t("boxes.add_mode_auto_chip")}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
