"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SPLASH_DURATION_MS = 3200;

export function LogoSplash() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="logo-splash" aria-hidden="true">
      <div className="logo-splash__logo">
        <Image
          src="/images/logo/logo-principal-large.png"
          alt=""
          fill
          sizes="(max-width: 768px) 220px, 320px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
