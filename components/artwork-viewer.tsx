"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  artworks,
  artworkAlt,
  artworkURL,
  wrapArtworkIndex,
} from "@/lib/artworks";
import { closeOnBackdrop } from "@/lib/dialog";
import { Icon } from "./icon";

const ArtworkContext = createContext<((index: number) => void) | null>(null);

export function useArtworkViewer() {
  const open = useContext(ArtworkContext);
  if (!open) throw new Error("Artwork controls require ArtworkProvider.");
  return open;
}

export function ArtButton({
  artIndex,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { artIndex: number }) {
  const open = useArtworkViewer();
  return (
    <button {...props} type="button" onClick={() => open(artIndex)}>
      {children}
    </button>
  );
}

export function ArtworkProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const [isOpen, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const art = artworks[active];

  const openArtwork = useCallback((index: number) => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setActive(wrapArtworkIndex(index));
    setZoomed(false);
    setImageFailed(false);
    setOpen(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    canvas.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (zoomed) canvas.focus({ preventScroll: true });
  }, [active, zoomed, isOpen]);

  function changeArtwork(delta: number) {
    setActive((index) => wrapArtworkIndex(index + delta));
    setZoomed(false);
    setImageFailed(false);
  }

  function handleClose() {
    setOpen(false);
    setZoomed(false);
    // Preserve the exact initiating control, including gallery and hero buttons.
    openerRef.current?.focus({ preventScroll: true });
  }

  function handleKeys(event: KeyboardEvent<HTMLDialogElement>) {
    if (zoomed && document.activeElement === canvasRef.current) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      changeArtwork(event.key === "ArrowRight" ? 1 : -1);
    }
  }

  return (
    <ArtworkContext.Provider value={openArtwork}>
      {children}
      <dialog
        ref={dialogRef}
        className="art-dialog"
        id="art-dialog"
        aria-labelledby="art-title"
        onClose={handleClose}
        onClick={closeOnBackdrop}
        onKeyDown={handleKeys}
      >
        <div className="art-view">
          <div className="dialog-header">
            <h2 id="art-title">{art.name} · 은상</h2>
            <div className="viewer-tools">
              <span className="viewer-hint" id="viewer-hint">
                {zoomed
                  ? "스크롤하거나 방향키로 작품을 살펴보세요"
                  : "전체 작품을 보고 있습니다"}
              </span>
              <button
                type="button"
                className="zoom-button"
                id="art-zoom"
                aria-pressed={zoomed}
                aria-controls="art-canvas"
                onClick={() => setZoomed(!zoomed)}
              >
                {zoomed ? "전체 보기" : "확대 보기"}
              </button>
              <button
                type="button"
                className="dialog-close"
                aria-label="작품 감상 닫기"
                onClick={() => dialogRef.current?.close()}
              >
                <span>닫기</span>
                <Icon name="close" />
              </button>
            </div>
          </div>
          <div
            ref={canvasRef}
            className={`art-image-wrap${zoomed ? " is-zoomed" : ""}`}
            id="art-canvas"
            tabIndex={0}
            role="region"
            aria-label="작품 이미지. 확대 상태에서는 방향키로 이동할 수 있습니다."
          >
            {isOpen && (
              <img
                key={art.detail}
                id="art-image"
                src={art.detail}
                alt={artworkAlt(art)}
                hidden={imageFailed}
                onError={() => setImageFailed(true)}
                onLoad={() => setImageFailed(false)}
              />
            )}
            {imageFailed && (
              <p className="image-error" role="status">
                작품을 불러오지 못했습니다. 아래 공식 작품 페이지에서 확인해
                주세요.
              </p>
            )}
          </div>
          <div className="art-controls">
            <div>
              <p>2025 대한민국 청목캘리그라피 공모전</p>
              <a
                className="art-source"
                id="art-source"
                href={artworkURL(art)}
                target="_blank"
                rel="noopener"
              >
                공식 작품 페이지
                <Icon name="arrow-up-right" />
                <span className="sr-only"> (새 창)</span>
              </a>
            </div>
            <div className="art-control-buttons">
              <button
                type="button"
                className="round-button"
                id="art-prev"
                aria-label="이전 작품"
                onClick={() => changeArtwork(-1)}
              >
                <span>이전</span>
                <Icon name="arrow-left" />
              </button>
              <span className="art-counter" id="art-counter">
                {active + 1} / {artworks.length}
              </span>
              <button
                type="button"
                className="round-button"
                id="art-next"
                aria-label="다음 작품"
                onClick={() => changeArtwork(1)}
              >
                <span>다음</span>
                <Icon name="arrow-right" />
              </button>
            </div>
          </div>
          <p
            className="sr-only"
            id="art-announcement"
            aria-live="polite"
            aria-atomic="true"
          >
            {isOpen
              ? `${art.name} · 은상, ${active + 1}번째 작품. 전체 ${artworks.length}점.`
              : ""}
          </p>
        </div>
      </dialog>
    </ArtworkContext.Provider>
  );
}
