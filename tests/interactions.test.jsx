import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { ReadingTools } from "../components/reading-tools";
import { ArtworkProvider, ArtButton } from "../components/artwork-viewer";
import { Gallery } from "../components/gallery";
import { SiteHeader } from "../components/site-header";

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
]) {
  globalThis[key] = key === "window" ? dom.window : dom.window[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.localStorage = dom.window.localStorage;
globalThis.requestAnimationFrame = (callback) => {
  callback();
  return 0;
};
globalThis.ResizeObserver = dom.window.ResizeObserver = class {
  observe() {}
  disconnect() {}
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
  return {
    container,
    hydrationErrors,
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
  assert.match(renderToString(<ReadingTools />), /aria-pressed="false"/);
  const view = await mount(<ReadingTools />, true);
  try {
    assert.deepEqual(view.hydrationErrors, []);
    const button = view.container.querySelector("button");
    assert.equal(button.getAttribute("aria-pressed"), "true");
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
      view.container.querySelector("button").getAttribute("aria-pressed"),
      "true",
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

test("gallery and viewer keep independent selections, reset zoom, recover images, and restore focus", async () => {
  const view = await mount(
    <ArtworkProvider>
      <ArtButton artIndex={0} id="hero-test">
        Hero artwork
      </ArtButton>
      <Gallery />
    </ArtworkProvider>,
  );
  const q = (selector) => view.container.querySelector(selector);
  try {
    await click(view.container.querySelectorAll(".artist-choice")[1]);
    assert.equal(q("#gallery-artist").textContent, "장순덕");
    const opener = q("#gallery-detail-open");
    opener.focus();
    await click(opener);
    assert.ok(q("#art-dialog").open);
    assert.match(q("#art-title").textContent, /장순덕/);
    assert.match(q("#art-image").src, /jang-soondeok-detail.webp$/);
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
    assert.equal(q("#art-zoom").getAttribute("aria-pressed"), "false");
    assert.equal(q("#art-canvas").scrollTop, 0);
    assert.match(
      q("#art-announcement").textContent,
      /김승한 · 은상, 3번째 작품/,
    );
    assert.equal(q("#gallery-artist").textContent, "장순덕");
    await act(() => q("#art-image").dispatchEvent(new Event("error")));
    assert.equal(q("#art-image").hidden, true);
    assert.match(q(".image-error").textContent, /공식 작품 페이지/);
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

test("mobile menu opens modally and an anchor closes it and focuses its destination", async () => {
  const view = await mount(
    <>
      <SiteHeader />
      <section id="competition" tabIndex={-1}>
        공모전
      </section>
    </>,
  );
  try {
    await click(view.container.querySelector("#menu-open"));
    const menu = view.container.querySelector("#menu-dialog");
    assert.equal(menu.open, true);
    await click(menu.querySelector('a[href="#competition"]'));
    assert.equal(menu.open, false);
    assert.equal(document.activeElement.id, "competition");
  } finally {
    await view.dispose();
  }
});
