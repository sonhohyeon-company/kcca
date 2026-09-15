"use client";

import { useEffect, useState } from "react";

const preferenceKey = "kcca-large-text";

export function ReadingTools() {
  const [large, setLarge] = useState(false);

  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem(preferenceKey) === "true";
    } catch {
      /* Storage is optional. */
    }
    document.documentElement.classList.toggle("large-text", saved);
    setLarge(saved);
  }, []);

  function toggleSize() {
    const next = !large;
    setLarge(next);
    document.documentElement.classList.toggle("large-text", next);
    try {
      localStorage.setItem(preferenceKey, String(next));
    } catch {
      /* Reading still works. */
    }
  }

  return (
    <div className="reading-tools wrap">
      <p>편하게 읽으세요</p>
      <button
        type="button"
        className="text-size"
        id="text-size"
        aria-pressed={large}
        onClick={toggleSize}
      >
        {large ? "글자 기본 크기" : "글자 크게"}
      </button>
    </div>
  );
}
