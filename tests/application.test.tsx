import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  readApplication,
  retentionCutoff,
  validateApplication,
  type ApplicationValues,
} from "../app/(site)/application-form/validate";

const valid: ApplicationValues = {
  name: "홍길동",
  phone: "010-1234-5678",
  email: "hong@example.com",
  message: "청목정체 2급 응시 희망합니다.",
  consent: true,
};
const errorsFor = (changes: Partial<ApplicationValues>) =>
  validateApplication({ ...valid, ...changes });

test("a complete application has no errors; email and message are optional", () => {
  assert.deepEqual(validateApplication(valid), {});
  assert.deepEqual(errorsFor({ email: "", message: "" }), {});
  assert.deepEqual(errorsFor({ phone: "031 878 0503" }), {});
});

test("name and phone are required", () => {
  assert.deepEqual(Object.keys(errorsFor({ name: "" })), ["name"]);
  assert.deepEqual(Object.keys(errorsFor({ name: "", phone: "" })), [
    "name",
    "phone",
  ]);
});

test("phone must be 9 to 13 digits with only hyphens or spaces", () => {
  for (const phone of [
    "010-123",
    "010-1234-5678-9999",
    "010.1234.5678",
    "전화주세요",
    "+82-10-1234-5678",
  ]) {
    assert.ok(errorsFor({ phone }).phone, phone);
  }
  for (const phone of ["01012345678", "02-123-4567", "031-878-0503"]) {
    assert.equal(errorsFor({ phone }).phone, undefined, phone);
  }
});

test("email is checked only when given", () => {
  for (const email of [
    "hong",
    "hong@",
    "hong@example",
    "hong @example.com",
    "a@b..com",
  ]) {
    assert.ok(errorsFor({ email }).email, email);
  }
  assert.equal(
    errorsFor({ email: "Hong.Gil-dong+kcca@mail.example.co.kr" }).email,
    undefined,
  );
});

test("long name and message are rejected", () => {
  assert.equal(errorsFor({ name: "가".repeat(50) }).name, undefined);
  assert.ok(errorsFor({ name: "가".repeat(51) }).name);
  assert.equal(errorsFor({ message: "가".repeat(2000) }).message, undefined);
  assert.match(
    errorsFor({ message: "가".repeat(2001) }).message ?? "",
    /2,000자.*2,001자/,
  );
});

test("consent is required", () => {
  assert.deepEqual(Object.keys(errorsFor({ consent: false })), ["consent"]);
});

test("form data is trimmed, CRLF counts as one character and the checkbox is read", () => {
  const form = new FormData();
  form.set("name", "  홍길동 ");
  form.set("phone", "010-1234-5678");
  form.set("message", `${"가".repeat(999)}\r\n${"가".repeat(1000)}`);
  const values = readApplication(form);
  assert.equal(values.name, "홍길동");
  assert.equal(values.email, "");
  assert.equal(values.consent, false);
  assert.equal(values.message.length, 2000);
  form.set("consent", "on");
  assert.equal(readApplication(form).consent, true);
});

test("applications are kept for 365 days", () => {
  const now = Date.UTC(2026, 8, 29, 3);
  assert.equal(retentionCutoff(now), "2025-09-29T03:00:00.000Z");
});

test("rejected attachments do not count toward the 5-per-hour limit", async () => {
  // Run the real action outside Next: stub server-only and the request headers, use a fresh DATA_DIR.
  process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), "kcca-test-"));
  const stubs: Record<string, string> = {
    "server-only": "",
    "next/headers":
      "exports.headers = async () => new Headers({ 'x-forwarded-for': '10.0.0.1' });",
  };
  registerHooks({
    resolve: (specifier, context, next) =>
      Object.hasOwn(stubs, specifier)
        ? { url: `stub:${specifier}`, shortCircuit: true }
        : next(specifier, context),
    load: (url, context, next) =>
      url.startsWith("stub:")
        ? {
            format: "commonjs",
            source: stubs[url.slice(5)],
            shortCircuit: true,
          }
        : next(url, context),
  });
  const { submitApplication } =
    await import("../app/(site)/application-form/actions");
  const submit = (file?: File) => {
    const form = new FormData();
    form.set("name", valid.name);
    form.set("phone", valid.phone);
    form.set("consent", "on");
    if (file) form.set("file", file);
    return submitApplication({ status: "idle" }, form);
  };
  for (let i = 0; i < 6; i++) {
    const state = await submit(new File(["메모"], "memo.txt"));
    assert.match(state.errors?.file ?? "", /PDF/);
  }
  assert.equal((await submit()).status, "success");
});
