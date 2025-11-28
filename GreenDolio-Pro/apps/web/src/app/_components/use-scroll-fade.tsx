"use client";

import { useState, useEffect, useRef } from "react";

export function useScrollFade<T extends HTMLElement = HTMLDivElement>(
  options?: {
    threshold?: number;
    rootMargin?: string;
    delay?: number;
  }
) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(element);
          }
        });
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: options?.rootMargin ?? "50px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options?.threshold, options?.rootMargin]);

  return {
    ref,
    isVisible,
    className: isVisible
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-8",
    style: {
      transitionDuration: "700ms",
      transitionTimingFunction: "ease-out",
    },
  };
}

export function useScrollFadeStagger<T extends HTMLElement = HTMLDivElement>(
  count: number,
  options?: {
    threshold?: number;
    rootMargin?: string;
    delay?: number;
  }
) {
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const refs = useRef<(T | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    refs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleIndices((prev) => new Set([...prev, index]));
              observer.unobserve(ref);
            }
          });
        },
        {
          threshold: options?.threshold ?? 0.1,
          rootMargin: options?.rootMargin ?? "50px",
        }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [count, options?.threshold, options?.rootMargin]);

  const getItemProps = (index: number) => {
    const isVisible = visibleIndices.has(index);
    const delay = options?.delay ?? 100;

    return {
      ref: (el: T | null) => {
        refs.current[index] = el;
      },
      className: isVisible
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-8",
      style: {
        transitionDelay: isVisible ? `${index * delay}ms` : "0ms",
        transitionDuration: "700ms",
        transitionTimingFunction: "ease-out",
      },
    };
  };

  return { getItemProps };
}

