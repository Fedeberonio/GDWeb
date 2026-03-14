"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SPLASH_DURATION_MS = 2000; // Reducido de 6s a 2s

export function LogoSplash() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const alreadyShown = window.sessionStorage.getItem("gd-splash-shown");
      if (alreadyShown) {
        setIsVisible(false);
        return;
      }
      window.sessionStorage.setItem("gd-splash-shown", "true");
    } catch {
      // If sessionStorage fails, fall back to showing the splash once per load.
    }

    setIsVisible(true);
    timer = setTimeout(() => setIsVisible(false), SPLASH_DURATION_MS);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="logo-splash" aria-hidden="true">
      <div className="logo-splash__logo">
        <Image
          src="/assets/images/hero/hero-welcome-banner.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
