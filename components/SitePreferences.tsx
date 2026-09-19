"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Shield01Icon, Settings01Icon, WifiOff01Icon, Wifi01Icon } from "hugeicons-react";
import { CONSENT_EVENT, CONSENT_KEY, readCookieConsent } from "@/lib/cookie-consent";
import "./site-preferences.css";

function subscribeConnection(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
const getConnection = () => navigator.onLine;
const getServerConnection = () => true;

export default function SitePreferences() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [customize, setCustomize] = useState(false);
  const [supportChat, setSupportChat] = useState(false);
  const [notice, setNotice] = useState<"offline" | "restored" | null>(null);
  const [storageError, setStorageError] = useState(false);
  const onlineNow = useSyncExternalStore(subscribeConnection, getConnection, getServerConnection);
  const connectionNotice = onlineNow ? notice : "offline";

  useEffect(() => {
    const saved = readCookieConsent();
    if (!saved) dialog.current?.showModal();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let wasOffline = !navigator.onLine;
    const offline = () => { clearTimeout(timer); wasOffline = true; setNotice("offline"); };
    const online = () => {
      if (!wasOffline) return;
      wasOffline = false;
      setNotice("restored");
      timer = setTimeout(() => setNotice(null), 5000);
    };
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, []);

  function save(allowChat: boolean) {
    const previous = readCookieConsent();
    const value = { version: 1, supportChat: allowChat, savedAt: Date.now() };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
      setStorageError(false);
    } catch {
      setStorageError(true);
      return;
    }
    setSupportChat(allowChat);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    dialog.current?.close();
    // Remove any already-running third-party widget when consent is withdrawn.
    if (previous?.supportChat && !allowChat) window.location.reload();
  }

  return <>
    <div className="tcp-connection-region" role="status" aria-live="polite" aria-atomic="true">
      {connectionNotice && <div className={`tcp-connection ${connectionNotice}`}>
        {connectionNotice === "offline" ? <WifiOff01Icon size={22} aria-hidden /> : <Wifi01Icon size={22} aria-hidden />}
        <div><strong>{connectionNotice === "offline" ? "You’re offline" : "You’re back online"}</strong>
          <p>{connectionNotice === "offline" ? "Check your internet connection. New content and actions may be unavailable." : "Your connection has been restored."}</p></div>
      </div>}
    </div>
    <button className="tcp-cookie-launcher" aria-label="Cookie preferences" title="Cookie preferences" onClick={() => {
      setCustomize(true); setStorageError(false);
      setSupportChat(readCookieConsent()?.supportChat ?? false);
      dialog.current?.showModal();
    }}><Settings01Icon size={17} aria-hidden /><span>Cookies</span></button>
    <dialog ref={dialog} className="tcp-cookie-dialog" aria-labelledby="tcp-cookie-title" aria-describedby="tcp-cookie-description">
      <div className="tcp-cookie-heading"><span className="tcp-cookie-symbol"><Shield01Icon size={27} aria-hidden /></span><span>YOUR PRIVACY MATTERS</span></div>
      <h2 id="tcp-cookie-title">A little control. A better experience.</h2>
      <p id="tcp-cookie-description">We use essential cookies and browser storage to keep you signed in and remember your preferences. Optional cookies enable our third-party support chat. You choose what to allow.</p>
      <div className="tcp-cookie-links"><Link href="/cookie-policy" onClick={() => dialog.current?.close()}>Cookie policy</Link><Link href="/privacy" onClick={() => dialog.current?.close()}>Privacy policy</Link></div>
      {customize && <div className="tcp-cookie-options">
        <div><section><strong>Essential</strong><p>Sign-in, security and your saved preferences.</p></section><span className="tcp-cookie-required">Always on</span></div>
        <label><section><strong>Support chat</strong><p>Allow LeadConnector to load its chat widget on the contact page. You can still use the contact form without it.</p></section><input type="checkbox" checked={supportChat} onChange={e => setSupportChat(e.target.checked)} aria-label="Allow optional support chat" /></label>
      </div>}
      {storageError && <p role="alert" className="tcp-cookie-error">Your browser couldn’t save this choice. Optional cookies remain off. You can close this dialog with Escape and continue browsing.</p>}
      <div className="tcp-cookie-actions">
        <button onClick={() => save(false)}>Essential only</button>
        {customize ? <button onClick={() => save(supportChat)}>Save preferences</button> : <button onClick={() => setCustomize(true)}>Customize</button>}
        <button className="tcp-cookie-accept" onClick={() => save(true)}>Accept all</button>
      </div>
      <p className="tcp-cookie-note">Change your choice anytime using the Cookies button.</p>
    </dialog>
  </>;
}
