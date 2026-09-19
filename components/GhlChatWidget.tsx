"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { CONSENT_EVENT, readCookieConsent } from "@/lib/cookie-consent";

export default function GhlChatWidget() {
  const pathname = usePathname();
  const isContactPage = pathname === "/contact" || pathname?.startsWith("/contact");
  const [consented, setConsented] = useState(false);
  const loaded = useRef(false);
  useEffect(() => {
    const sync = () => {
      const allowed = readCookieConsent()?.supportChat === true;
      setConsented(allowed);
      if (!allowed && loaded.current) window.location.reload();
    };
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const handleWidgetVisibility = () => {
      const elements = document.querySelectorAll(
        "chat-widget, #chat-widget-container, iframe[src*='leadconnectorhq'], iframe[src*='msgsndr'], div[class*='chat-widget'], [data-widget-id='6a99fd823dadf9f23d855820']"
      );

      elements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.setProperty("display", isContactPage && consented ? "" : "none", "important");
          el.style.setProperty("visibility", isContactPage && consented ? "visible" : "hidden", "important");
          el.style.setProperty("pointer-events", isContactPage && consented ? "auto" : "none", "important");
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
  }, [isContactPage, pathname, consented]);

  return (
    <>
      {(!isContactPage || !consented) && (
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

      {isContactPage && consented && (
        <Script
          id="ghl-chat-widget-loader"
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="6a99fd823dadf9f23d855820"
          data-source="WEB_USER"
          strategy="afterInteractive"
          onReady={() => { loaded.current = true; }}
        />
      )}
    </>
  );
}
