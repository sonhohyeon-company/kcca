"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { closeOnBackdrop } from "@/lib/dialog";
import { kstToday } from "@/lib/format";
import { Icon } from "./icon";

// Both remember the image, so a replaced popup shows again.
const hiddenKey = "kcca-popup-hidden"; // localStorage: `${day}|${image}` (오늘 하루 보지 않기)
const closedKey = "kcca-popup-closed"; // sessionStorage: closed once this visit

/** Notice popup on the home page. The server decides whether it is active; the
 * visitor's choices live in this browser only. */
export function HomePopup({
  image,
  alt,
  link,
}: {
  image: string;
  alt: string;
  link: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Nothing renders on the server or during hydration; the popup opens after mount.
  const [show, setShow] = useState(false);

  useEffect(() => {
    let hidden = false;
    try {
      hidden =
        localStorage.getItem(hiddenKey) === `${kstToday()}|${image}` ||
        sessionStorage.getItem(closedKey) === image;
    } catch {
      /* Storage is optional. */
    }
    if (hidden) return;
    // Open once the poster is ready, so the dialog does not grow and move 닫기
    // under the visitor's finger.
    const poster = new Image();
    poster.onload = poster.onerror = () => setShow(true);
    poster.src = image;
  }, [image]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (show && dialog && !dialog.open) dialog.showModal();
  }, [show]);

  function hideToday() {
    try {
      localStorage.setItem(hiddenKey, `${kstToday()}|${image}`);
    } catch {
      /* Closing still works. */
    }
    dialogRef.current?.close();
  }

  if (!show) return null;
  const picture = <img src={image} alt={alt} />;
  return (
    <dialog
      ref={dialogRef}
      className="popup-dialog"
      id="home-popup"
      aria-label="협회 알림"
      onClick={closeOnBackdrop}
      onClose={() => {
        try {
          sessionStorage.setItem(closedKey, image);
        } catch {
          /* Closing still works. */
        }
        setShow(false);
      }}
    >
      <div className="popup-image">
        {!link ? (
          picture
        ) : /^https?:/i.test(link) ? (
          <a href={link} target="_blank" rel="noopener">
            {picture}
            <span className="sr-only"> (새 창)</span>
          </a>
        ) : (
          <Link href={link}>{picture}</Link>
        )}
      </div>
      <div className="popup-actions">
        <button type="button" onClick={hideToday}>
          오늘 하루 보지 않기
        </button>
        <button
          type="button"
          className="dialog-close"
          aria-label="알림 닫기"
          onClick={() => dialogRef.current?.close()}
        >
          <span>닫기</span>
          <Icon name="close" />
        </button>
      </div>
    </dialog>
  );
}
