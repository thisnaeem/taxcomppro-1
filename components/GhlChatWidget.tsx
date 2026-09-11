"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

export default function GhlChatWidget() {
  const pathname = usePathname();
  const isContactPage = pathname === "/contact" || pathname?.startsWith("/contact");

  useEffect(() => {
    const handleWidgetVisibility = () => {
      const elements = document.querySelectorAll(
        "chat-widget, #chat-widget-container, iframe[src*='leadconnectorhq'], iframe[src*='msgsndr'], div[class*='chat-widget'], [data-widget-id='6a99fd823dadf9f23d855820']"
      );

      elements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.setProperty("display", isContactPage ? "" : "none", "important");
          el.style.setProperty("visibility", isContactPage ? "visible" : "hidden", "important");
          el.style.setProperty("pointer-events", isContactPage ? "auto" : "none", "important");
        }
      });
    };

    handleWidgetVisibility();
    const interval = setInterval(handleWidgetVisibility, 500);
    const timeout = setTimeout(() => clearInterval(interval), 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isContactPage, pathname]);

  return (
    <>
      {!isContactPage && (
        <style key="hide-ghl-widget">{`
          chat-widget,
          #chat-widget-container,
          iframe[src*="leadconnectorhq"],
          iframe[src*="msgsndr"],
          div[class*="chat-widget"],
          [data-widget-id="6a99fd823dadf9f23d855820"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `}</style>
      )}

      {isContactPage && (
        <Script
          id="ghl-chat-widget-loader"
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="6a99fd823dadf9f23d855820"
          data-source="WEB_USER"
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
