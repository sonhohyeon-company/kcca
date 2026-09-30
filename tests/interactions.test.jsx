import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { ReadingTools } from "../components/reading-tools";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { ArtworkProvider, ArtButton } from "../components/artwork-viewer";
import { Gallery } from "../components/gallery";
import { HomePopup } from "../components/home-popup";
import { SiteHeader } from "../components/site-header";
import { kstToday } from "../lib/format";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://example.test",
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLDialogElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "FocusEvent",
]) {
  globalThis[key] = key === "window" ? dom.window : dom.window[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.self = globalThis; // next/link reads `self`
globalThis.localStorage = dom.window.localStorage;
globalThis.sessionStorage = dom.window.sessionStorage;
globalThis.requestAnimationFrame = (callback) => {
  callback();
  return 0;
};
globalThis.ResizeObserver = dom.window.ResizeObserver = class {
  observe() {}
  disconnect() {}
};
// Preloaded images (the home popup poster); a test fires onload/onerror itself.
const preloads = [];
globalThis.Image = class {
  set src(value) {
    this.url = value;
    preloads.push(this);
  }
};
HTMLElement.prototype.scrollTo = function ({ top, left }) {
  this.scrollTop = top;
  this.scrollLeft = left;
};
// JSDOM has no native modal implementation. These shims exercise the React
// lifecycle; browser-owned focus trapping and Escape are not simulated here.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
  this.querySelector("button")?.focus();
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
};
async function mount(node, hydrate = false) {
  const { createRoot, hydrateRoot } = await import("react-dom/client");
  const container = document.createElement("div");
  document.body.append(container);
  let root;
  const hydrationErrors = [];
  if (hydrate) {
    container.innerHTML = renderToString(node);
    await act(() => {
      root = hydrateRoot(container, node, {
        onRecoverableError: (error) => hydrationErrors.push(error),
      });
    });
  } else {
    root = createRoot(container);
    await act(() => root.render(node));
  }
  // Links have no router here; stop JSDOM's unimplemented page navigation.
  container.addEventListener("click", (event) => {
    if (event.target.closest("a")) event.preventDefault();
  });
  return {
    container,
    hydrationErrors,
    async rerender(next) {
      await act(() => root.render(next));
    },
    async dispose() {
      await act(() => root.unmount());
      container.remove();
    },
  };
}

async function click(element) {
  assert.ok(element, "The control exists");
  await act(() => element.click());
}

test("server rendering does not read stored preferences; hydration restores them", async () => {
  localStorage.setItem("kcca-large-text", "true");
  assert.match(renderToString(<ReadingTools />), />글자 크게</);
  const view = await mount(<ReadingTools />, true);
  try {
    assert.deepEqual(view.hydrationErrors, []);
    const button = view.container.querySelector("button");
    // The label names the action; aria-pressed would read as a double negative.
    assert.equal(button.getAttribute("aria-pressed"), null);
    assert.equal(button.textContent, "글자 기본 크기");
    assert.equal(localStorage.getItem("kcca-large-text"), "true");
    assert.ok(document.documentElement.classList.contains("large-text"));
    await click(button);
    assert.equal(localStorage.getItem("kcca-large-text"), "false");
    assert.equal(button.textContent, "글자 크게");
  } finally {
    await view.dispose();
  }
});

test("reading controls work when local storage is denied", async () => {
  const storage = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("Storage denied");
    },
  });
  const view = await mount(<ReadingTools />);
  try {
    await click(view.container.querySelector("button"));
    assert.equal(
      view.container.querySelector("button").textContent,
      "글자 기본 크기",
    );
  } finally {
    await view.dispose();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      writable: true,
      value: storage,
    });
    document.documentElement.classList.remove("large-text");
  }
});

const artworks = ["김현희", "장순덕", "김승한"].map((name, index) => ({
  id: 10 + index,
  name,
  award: "은상",
  category: "2025 대한민국 청목캘리그라피 공모전",
  src: `/uploads/art-${index}.webp`,
  href: `/notice-gallery/${10 + index}`,
  alt: `${name}의 은상 수상작`,
}));

test("gallery and viewer keep independent selections, reset zoom, recover images, and restore focus", async () => {
  const view = await mount(
    <ArtworkProvider items={artworks}>
      <ArtButton artIndex={0} id="hero-test">
        Hero artwork
      </ArtButton>
      <Gallery items={artworks} />
    </ArtworkProvider>,
  );
  const q = (selector) => view.container.querySelector(selector);
  try {
    await click(view.container.querySelectorAll(".artist-choice")[1]);
    assert.equal(q("#gallery-artist").textContent, "장순덕");
    assert.equal(
      q("#gallery-source").getAttribute("href"),
      "/notice-gallery/11",
    );
    const opener = q("#gallery-detail-open");
    opener.focus();
    await click(opener);
    assert.ok(q("#art-dialog").open);
    assert.match(q("#art-title").textContent, /장순덕 · 은상/);
    assert.match(q("#art-image").src, /\/uploads\/art-1.webp$/);
    assert.equal(q("#art-source").getAttribute("href"), "/notice-gallery/11");
    await click(q("#art-zoom"));
    assert.equal(document.activeElement, q("#art-canvas"));
    const pan = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    await act(() => q("#art-canvas").dispatchEvent(pan));
    assert.equal(pan.defaultPrevented, false);
    assert.match(q("#art-title").textContent, /장순덕/);
    q("#art-canvas").scrollTop = 300;
    await click(q("#art-next"));
    assert.match(q("#art-title").textContent, /김승한/);
    assert.equal(q("#art-zoom").textContent, "확대 보기");
    assert.equal(q("#art-canvas").scrollTop, 0);
    assert.match(
      q("#art-announcement").textContent,
      /김승한 · 은상, 3번째 작품/,
    );
    assert.equal(q("#gallery-artist").textContent, "장순덕");
    await act(() => q("#art-image").dispatchEvent(new Event("error")));
    assert.equal(q("#art-image").hidden, true);
    assert.match(q(".image-error").textContent, /작품 자세히 보기/);
    await click(q("#art-next"));
    assert.match(q("#art-title").textContent, /김현희/);
    assert.equal(q(".image-error"), null);
    await act(() =>
      q("#art-dialog").dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
      ),
    );
    assert.match(q("#art-title").textContent, /김승한/);
    await click(q('[aria-label="작품 감상 닫기"]'));
    assert.equal(q("#art-dialog").open, false);
    assert.equal(document.activeElement, opener);
    await click(opener);
    assert.match(q("#art-title").textContent, /장순덕/);
    await click(q('[aria-label="작품 감상 닫기"]'));
    await click(q("#hero-test"));
    assert.match(q("#art-title").textContent, /김현희/);
  } finally {
    await view.dispose();
  }
});

test("an empty gallery renders nothing and needs no viewer", async () => {
  const view = await mount(
    <ArtworkProvider items={[]}>
      <Gallery items={[]} />
    </ArtworkProvider>,
  );
  try {
    assert.equal(view.container.innerHTML, "");
  } finally {
    await view.dispose();
  }
});

const header = (pathname) => (
  <PathnameContext.Provider value={pathname}>
    <SiteHeader />
  </PathnameContext.Provider>
);

test("header marks the current section and the grouped menu closes on navigation", async () => {
  const view = await mount(header("/association"));
  const q = (selector) => view.container.querySelector(selector);
  try {
    const current = [
      ...view.container.querySelectorAll(".desktop-nav [aria-current]"),
    ];
    assert.deepEqual(
      current.map((node) => [
        node.textContent,
        node.getAttribute("aria-current"),
      ]),
      [
        ["협회활동", "true"],
        ["협회활동", "page"],
      ],
    );
    assert.equal(current[0].tagName, "SUMMARY");

    const menu = q("#menu-dialog");
    await click(q("#menu-open"));
    assert.equal(menu.open, true);
    assert.deepEqual(
      [...menu.querySelectorAll(".menu-group h3")].map((h) => h.textContent),
      [
        "협회소개",
        "협회활동",
        "교육·자격검정",
        "전국공모전",
        "아카이브·갤러리",
      ],
    );
    assert.equal(
      menu.querySelector('a[href="/association"]').getAttribute("aria-current"),
      "page",
    );
    // Tapping a link closes the menu right away.
    await click(menu.querySelector('a[href="/about-history"]'));
    assert.equal(menu.open, false);

    // A route change (e.g. back button) closes it and moves aria-current.
    await click(q("#menu-open"));
    assert.equal(menu.open, true);
    await view.rerender(header("/certificate-guide-2"));
    assert.equal(menu.open, false);
    assert.equal(
      menu
        .querySelector('a[href="/certificate-guide"]')
        .getAttribute("aria-current"),
      "true",
    );
    assert.equal(
      menu.querySelector('a[href="/association"]').getAttribute("aria-current"),
      null,
    );
  } finally {
    await view.dispose();
  }
});

test("desktop dropdowns close on Escape, outside clicks, focus leaving and route changes", async () => {
  const view = await mount(header("/"));
  const groups = [...view.container.querySelectorAll(".nav-group")];
  try {
    await click(groups[0].querySelector("summary"));
    assert.equal(groups[0].open, true);
    await act(() =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    assert.equal(groups[0].open, false);
    assert.equal(document.activeElement, groups[0].querySelector("summary"));

    await click(groups[1].querySelector("summary"));
    await click(document.body);
    assert.equal(groups[1].open, false);

    await click(groups[2].querySelector("summary"));
    await view.rerender(header("/notice-contest"));
    assert.equal(groups[2].open, false);

    // Tabbing out closes it; a click on the page (no related target) is left
    // to the click listener, so a mouse click on a submenu link still lands.
    const summary = groups[3].querySelector("summary");
    const leave = (relatedTarget) =>
      act(() =>
        summary.dispatchEvent(
          new FocusEvent("focusout", { bubbles: true, relatedTarget }),
        ),
      );
    await click(summary);
    await leave(null);
    assert.equal(groups[3].open, true);
    await leave(groups[3].querySelector("a"));
    assert.equal(groups[3].open, true);
    await leave(view.container.querySelector(".header-action"));
    assert.equal(groups[3].open, false);
  } finally {
    await view.dispose();
  }
});

test("home popup: 닫기 hides it for the visit, 오늘 하루 보지 않기 for the day, a new image shows again", async () => {
  const popup = (image) => (
    <HomePopup image={image} alt="공모전 안내" link="/notice-contest" />
  );
  const close = (view, label) =>
    click(
      [...view.container.querySelectorAll("#home-popup button")].find(
        (b) => b.textContent === label,
      ),
    );
  assert.equal(renderToString(popup("/uploads/popup.webp")), "");
  // The poster preload finishes (load or error) and the popup opens.
  const settle = (event) =>
    act(() => {
      for (const image of preloads.splice(0)) image[event]();
    });
  const views = [];
  try {
    const first = await mount(popup("/uploads/popup.webp"), true);
    views.push(first);
    assert.deepEqual(first.hydrationErrors, []);
    // Not open until the poster is ready, so it does not grow and move 닫기.
    assert.equal(first.container.querySelector("#home-popup"), null);
    assert.deepEqual(
      preloads.map((image) => image.url),
      ["/uploads/popup.webp"],
    );
    await settle("onload");
    const dialog = first.container.querySelector("#home-popup");
    assert.equal(dialog.open, true);
    assert.equal(dialog.querySelector("img").alt, "공모전 안내");
    await close(first, "오늘 하루 보지 않기");
    assert.equal(
      localStorage.getItem("kcca-popup-hidden"),
      `${kstToday()}|/uploads/popup.webp`,
    );
    assert.equal(first.container.querySelector("#home-popup"), null);
    sessionStorage.clear(); // a new visit the same day
    const again = await mount(popup("/uploads/popup.webp"));
    views.push(again);
    assert.deepEqual(preloads, []);
    assert.equal(again.container.querySelector("#home-popup"), null);

    // The office replaces the popup: it shows again (even if the poster fails),
    // and 닫기 hides it for this visit.
    const replaced = await mount(popup("/uploads/new.webp"));
    views.push(replaced);
    await settle("onerror");
    assert.equal(replaced.container.querySelector("#home-popup").open, true);
    await close(replaced, "닫기");
    assert.equal(replaced.container.querySelector("#home-popup"), null);
    const back = await mount(popup("/uploads/new.webp"));
    views.push(back);
    assert.equal(back.container.querySelector("#home-popup"), null);
  } finally {
    for (const view of views) await view.dispose();
    localStorage.removeItem("kcca-popup-hidden");
    sessionStorage.clear();
  }
});
