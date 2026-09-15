"use client";

import Image from "next/image";
import { useState } from "react";
import { artworks, artworkAlt, artworkURL } from "@/lib/artworks";
import { ArtButton } from "./artwork-viewer";
import { Icon } from "./icon";

export function Gallery() {
  const [selected, setSelected] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const art = artworks[selected];

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
        <a
          className="text-link"
          href="https://kcca-society.kr/notice-gallery-2025"
          target="_blank"
          rel="noopener"
        >
          2025 수상작 전체 보기
          <Icon name="arrow-up-right" className="arrow" />
          <span className="sr-only"> (새 창)</span>
        </a>
      </div>
      <div className="gallery-room">
        <div className="gallery-stage">
          <ArtButton
            id="gallery-art-open"
            artIndex={selected}
            aria-label={`${art.name} 은상 수상작 확대 감상`}
          >
            <Image
              id="gallery-image"
              src={art.src}
              alt={artworkAlt(art)}
              width={art.width}
              height={art.height}
            />
          </ArtButton>
        </div>
        <div className="gallery-side">
          <p className="gallery-year">2025 대한민국 청목캘리그라피 공모전</p>
          <div className="gallery-artist">
            <h3 id="gallery-artist">{art.name}</h3>
            <span className="award-label">은상</span>
          </div>
          <p className="gallery-description" id="gallery-description">
            {art.description}
          </p>
          <ArtButton
            className="btn secondary"
            artIndex={selected}
            id="gallery-detail-open"
          >
            작품 확대 감상
            <Icon name="expand" />
          </ArtButton>
          <a
            className="text-link"
            id="gallery-source"
            href={artworkURL(art)}
            target="_blank"
            rel="noopener"
          >
            공식 작품 페이지
            <Icon name="arrow-up-right" />
            <span className="sr-only"> (새 창)</span>
          </a>
          <div
            className="gallery-picker"
            role="group"
            aria-label="감상할 작가 선택"
          >
            {artworks.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="artist-choice"
                aria-pressed={selected === index}
                onClick={() => {
                  setSelected(index);
                  setAnnouncement(`${item.name}의 은상 수상작을 선택했습니다.`);
                }}
              >
                <Image
                  src={item.src}
                  alt=""
                  width={item.width}
                  height={item.height}
                />
                <span>{item.name}</span>
                <span className="choice-state">
                  {selected === index ? "감상 중" : "작품 선택"}
                </span>
              </button>
            ))}
          </div>
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
