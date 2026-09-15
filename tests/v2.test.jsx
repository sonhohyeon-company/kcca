import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { DesignSwitch } from "../components/design-switch";
import { Header } from "../components/v2/header";
import DesignTwoPage from "../app/v2/page";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://example.test/v2/",
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLDialogElement",
  "Event",
]) {
  globalThis[key] = key === "window" ? dom.window : dom.window[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.localStorage = dom.window.localStorage;
globalThis.requestAnimationFrame = (callback) => {
  callback();
  return 0;
};
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
};

test("design switch links to the other design only", () => {
  const onTwo = renderToString(<DesignSwitch current="v2" />);
  assert.match(onTwo, /href="\/"[^>]*>시안 1</);
  assert.match(onTwo, /aria-current="page"[^>]*>시안 2</);
  assert.match(renderToString(<DesignSwitch current="v1" />), /href="\/v2\/"/);
});

test("design two renders the competition first and keeps official links", () => {
  const html = renderToString(<DesignTwoPage />);
  const order = ["#competition", "#winners", "#certificate", "#news"].map(
    (id) => html.indexOf(`id="${id.slice(1)}"`),
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
  );
  assert.ok(order.every((index) => index > 0));
  assert.match(html, /href="tel:0318780503"/);
  assert.match(html, /kcca-society\.kr\/notice-contest/);
  assert.match(html, /kcca-society\.kr\/certificate-guide/);
});

test("design two menu closes on navigation and focuses the section", async () => {
  const { createRoot } = await import("react-dom/client");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(() =>
    root.render(
      <>
        <Header />
        <section id="certificate" tabIndex={-1}>
          자격증
        </section>
      </>,
    ),
  );
  try {
    await act(() => container.querySelector("#v2-menu-open").click());
    const menu = container.querySelector("#v2-menu");
    assert.equal(menu.open, true);
    await act(() => menu.querySelector('a[href="#certificate"]').click());
    assert.equal(menu.open, false);
    assert.equal(document.activeElement.id, "certificate");
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
});
