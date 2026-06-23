"use client";

import { useState } from "react";
import { Lock, Sparkles, X } from "lucide-react";

type PremiumGateProps = {
  isPremium: boolean;
  featureName: string;
  description: string;
  children: React.ReactNode;
};

function PremiumModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border border-[#E8DFC8] bg-[#FDFBF7] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C4A882] via-[#D4B896] to-[#A88B67]" />

        <div className="p-7 text-center">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#F0EBE0] text-[#9A9184]"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#F0E4D0] to-[#E8D4B8] shadow-inner">
            <span className="text-3xl">✨</span>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Sparkles className="h-3 w-3 text-[#C4A882]" />
            <span className="text-xs font-semibold text-[#C4A882] uppercase tracking-widest">
              Premium
            </span>
          </div>

          <h3 className="heading-serif text-xl text-[#3F3A33] mb-2">
            Coming soon
          </h3>
          <p className="text-sm text-[#6F685E] leading-relaxed mb-6">
            Premium subscriptions are on their way! We&apos;ll notify you when they
            launch so you can unlock all the good stuff.
          </p>

          <button
            onClick={onClose}
            className="w-full rounded-full bg-gradient-to-r from-[#C4A882] to-[#A88B67] py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function PremiumGate({
  isPremium,
  featureName,
  description,
  children,
}: PremiumGateProps) {
  const [showModal, setShowModal] = useState(false);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Clean premium lock card — no blurred children */}
      <div className="flex items-start gap-4 px-4 py-4">
        {/* Icon */}
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8D8BC] to-[#D4C0A0]">
          <Lock className="h-4 w-4 text-[#A88B67]" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-medium text-[#3F3A33]">{featureName}</p>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-[#C4A882]/20 to-[#A88B67]/20 border border-[#C4A882]/40 px-1.5 py-0.5">
              <Sparkles className="h-2.5 w-2.5 text-[#B09070]" />
              <span className="text-[10px] font-semibold text-[#A88B67] uppercase tracking-wide leading-none">
                Premium
              </span>
            </span>
          </div>
          <p className="text-xs text-[#9A9184] leading-relaxed">{description}</p>
        </div>

        {/* Unlock button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex-shrink-0 flex items-center gap-1 rounded-full border border-[#C4A882]/50 bg-[#F8F2E8] px-3 py-1.5 text-xs font-semibold text-[#A88B67] transition-all hover:bg-[#F0E4D0] active:scale-95"
        >
          Unlock
        </button>
      </div>

      {showModal && <PremiumModal onClose={() => setShowModal(false)} />}
    </>
  );
}
