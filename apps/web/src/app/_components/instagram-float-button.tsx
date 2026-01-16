"use client";

import { useEffect, useState } from "react";

const INSTAGRAM_URL = "https://instagram.com/green_dolio";
const INSTAGRAM_GRADIENT =
  "linear-gradient(135deg, #f58529 0%, #dd2a7b 45%, #8134af 70%, #515bd4 100%)";

export function InstagramFloatButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 650);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-4 md:left-6 z-50 flex items-center gap-2 md:gap-3 rounded-full px-4 py-3 md:px-5 md:py-4 text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
      aria-label="Abrir Instagram de Green Dolio"
      style={{
        background: INSTAGRAM_GRADIENT,
        animation: "fadeInUp 0.5s ease-out",
      }}
    >
      <svg
        className="h-7 w-7 md:h-8 md:w-8 text-white flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm10.75 2.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      </svg>

      <span className="hidden lg:block text-white font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Instagram
      </span>

      <span
        className="absolute inset-0 rounded-full opacity-20 animate-ping pointer-events-none"
        style={{ background: INSTAGRAM_GRADIENT }}
      />
    </a>
  );
}
