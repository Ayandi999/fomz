"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../hooks/api/auth/useUser";

export function LandingClientLogic() {
  const { user } = useUser();
  const router = useRouter();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user && user.id) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Accessibility check for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Intersection Observer for elegant viewport fade-in transitions
  useEffect(() => {
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-16");
          }
        });
      },
      { threshold: 0.05 }
    );

    const targets = document.querySelectorAll(".animate-on-scroll");
    targets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isInViewport) {
        target.classList.add("opacity-0", "translate-y-16");
      } else {
        target.classList.add("opacity-100", "translate-y-0");
      }
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return null;
}
