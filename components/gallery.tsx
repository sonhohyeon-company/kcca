"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { artworkLabel } from "@/lib/boards";
import { ArtButton, type Artwork } from "./artwork-viewer";
import { Icon } from "./icon";

export function Gallery({ items }: { items: Artwork[] }) {
  const [selected, setSelected] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const art = items[selected];
  if (!art) return null;

  return (
    <section
      className="section wrap"
      id="gallery"
      tabIndex={-1}
      aria-labelledby="gallery-title"
    >
      <div className="gallery-header">
        <div className="section-heading">
          <h2 id="gallery-title">공모전 수상작</h2>
          <p>
            한 획, 한 글자에 담긴 작가의 마음.
            <br />
            작품을 골라 천천히 감상해 보세요.
          </p>
        </div>
        <Link className="text-link" href="/notice-gallery">
          수상작 전체 보기
          <Icon name="arrow-right" className="arrow" />
        </Link>
      </div>
      <div className="gallery-room">
        <div className="gallery-stage">
          <ArtButton
            id="gallery-art-open"
            artIndex={selected}
            aria-label={`${artworkLabel(art)} 수상작 확대 감상`}
          >
            <Image
              id="gallery-image"
              src={art.src}
              alt={art.alt}
              fill
              sizes="(max-width: 600px) 90vw, (max-width: 850px) 45vw, 600px"
            />
          </ArtButton>
        </div>
        <div className="gallery-side">
          {art.category && <p className="gallery-year">{art.category}</p>}
          <div className="gallery-artist">
            <h3 id="gallery-artist">{art.name}</h3>
            {art.award && <span className="award-label">{art.award}</span>}
          </div>
          <ArtButton
            className="btn secondary"
            artIndex={selected}
            id="gallery-detail-open"
          >
            작품 확대 감상
            <Icon name="expand" />
          </ArtButton>
          <Link className="text-link" id="gallery-source" href={art.href}>
            작품 자세히 보기
            <Icon name="arrow-right" className="arrow" />
          </Link>
          {items.length > 1 && (
            <div
              className="gallery-picker"
              role="group"
              aria-label="감상할 작가 선택"
            >
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className="artist-choice"
                  aria-pressed={selected === index}
                  onClick={() => {
                    setSelected(index);
                    setAnnouncement(
                      `${artworkLabel(item)} 수상작을 선택했습니다.`,
                    );
                  }}
                >
                  <span className="choice-thumb">
                    <Image src={item.src} alt="" fill sizes="120px" />
                  </span>
                  <span>{item.name}</span>
                  <span className="choice-state">
                    {selected === index ? "감상 중" : "작품 선택"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="gallery-note">
        ‘작품 확대 감상’을 누르면 붓글씨를 더 크게 볼 수 있습니다.
      </p>
      <p
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        id="gallery-announcement"
      >
        {announcement}
      </p>
    </section>
  );
}
