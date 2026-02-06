"use client";

import { usePathname } from "next/navigation";
import { WhatsAppFloatButton } from "./whatsapp-float-button";
import { InstagramFloatButton } from "./instagram-float-button";

export function ConditionalSocialButtons() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return null;
  }

  return (
    <>
      <WhatsAppFloatButton />
      <InstagramFloatButton />
    </>
  );
}
