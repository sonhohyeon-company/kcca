import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  formatPhone,
  normalizePhone,
  profileFromProvider,
  safeNext,
  validateProfile,
  type ProfileValues,
} from "../lib/profile";
import { signToken, verifyToken } from "../lib/session";

test("mobile numbers become digits, including Kakao's +82 form", () => {
  for (const [input, digits] of [
    ["010-1234-5678", "01012345678"],
    ["010 1234 5678", "01012345678"],
    ["+82 10-1234-5678", "01012345678"],
    ["+821012345678", "01012345678"],
    ["01112345678", "01112345678"],
    ["0161234567", "0161234567"],
  ]) {
    assert.equal(normalizePhone(input), digits, input);
  }
  for (const input of ["", "02-123-4567", "031-878-0503", "0101234", "전화"]) {
    assert.equal(normalizePhone(input), "", input);
  }
  assert.equal(formatPhone("01012345678"), "010-1234-5678");
  assert.equal(formatPhone("0161234567"), "016-123-4567");
  assert.equal(formatPhone(""), "");
});

const valid: ProfileValues = {
  name: "홍길동",
  phone: "010-1234-5678",
  email: "hong@example.com",
  terms: true,
  privacy: true,
};

test("name, mobile and email are required; signup also needs both consents", () => {
  assert.deepEqual(validateProfile(valid, true), {});
  assert.deepEqual(
    Object.keys(validateProfile({ ...valid, name: "", phone: "", email: "" })),
    ["name", "phone", "email"],
  );
  assert.ok(validateProfile({ ...valid, phone: "02-123-4567" }).phone);
  assert.ok(validateProfile({ ...valid, email: "hong@" }).email);
  assert.deepEqual(
    Object.keys(
      validateProfile({ ...valid, terms: false, privacy: false }, true),
    ),
    ["terms", "privacy"],
  );
  // Editing a profile does not ask for the consents again.
  assert.deepEqual(
    validateProfile({ ...valid, terms: false, privacy: false }),
    {},
  );
});

test("only same-site paths are used as the return address", () => {
  assert.equal(safeNext("/application-form"), "/application-form");
  assert.equal(
    safeNext("/notice-association?page=2"),
    "/notice-association?page=2",
  );
  for (const bad of [
    undefined,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/a b",
    `/${"x".repeat(500)}`,
  ]) {
    assert.equal(safeNext(bad), "/", String(bad));
  }
});

test("provider profiles are normalized to id, email, name and mobile", () => {
  assert.deepEqual(
    profileFromProvider("kakao", {
      id: 12345,
      kakao_account: {
        email: "k@example.com",
        phone_number: "+82 10-1234-5678",
        profile: { nickname: "길동" },
      },
    }),
    {
      provider: "kakao",
      providerId: "12345",
      email: "k@example.com",
      name: "길동", // nickname until the app is verified for the name item
      phone: "01012345678",
    },
  );
  assert.deepEqual(
    profileFromProvider("naver", {
      resultcode: "00",
      response: {
        id: "abc",
        email: "n@example.com",
        name: "홍길동",
        mobile: "010-2345-6789",
      },
    }),
    {
      provider: "naver",
      providerId: "abc",
      email: "n@example.com",
      name: "홍길동",
      phone: "01023456789",
    },
  );
  assert.deepEqual(
    profileFromProvider("google", {
      sub: "999",
      email: "g@example.com",
      name: "Gil Hong",
    }),
    {
      provider: "google",
      providerId: "999",
      email: "g@example.com",
      name: "Gil Hong",
      phone: "",
    },
  );
  assert.equal(profileFromProvider("google", {}).providerId, "");
});

test("signed tokens carry their payload, expire and reject tampering", () => {
  const now = Date.UTC(2026, 9, 1);
  const token = signToken("secret", { m: 7 }, 60, now);
  assert.deepEqual(verifyToken("secret", token, now + 59_000), {
    m: 7,
    exp: now / 1000 + 60,
  });
  assert.equal(verifyToken("secret", token, now + 60_000), null);
  assert.equal(verifyToken("other", token, now), null);
  const [body, signature] = token.split(".");
  assert.equal(verifyToken("secret", `${body}x.${signature}`, now), null);
  assert.equal(verifyToken("secret", `${body}.${signature}.x`, now), null);
  assert.equal(verifyToken("secret", undefined, now), null);
  assert.equal(verifyToken("secret", "garbage", now), null);
});

test("members are created, found, updated, listed and deleted", async () => {
  process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), "kcca-test-"));
  const stubs: Record<string, string> = {
    "server-only": "",
    "next/server": "exports.connection = async () => {};",
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
  const db = await import("../lib/db");
  const id = db.createMember({
    provider: "kakao",
    providerId: "12345",
    email: "k@example.com",
    name: "길동",
    phone: "01012345678",
  });
  assert.equal((await db.findMember("kakao", "12345"))?.id, id);
  assert.equal(await db.findMember("naver", "12345"), null);
  db.updateMember(id, {
    email: "k@example.com",
    name: "홍길동",
    phone: "01012345678",
  });
  assert.equal((await db.getMember(id))?.name, "홍길동");
  // The same account cannot be registered twice.
  assert.throws(() =>
    db.createMember({
      provider: "kakao",
      providerId: "12345",
      email: "",
      name: "x",
      phone: "",
    }),
  );
  assert.equal((await db.listMembers({ q: "5678" })).total, 1);
  assert.equal((await db.listMembers({ q: "50%" })).total, 0);
  assert.equal(await db.countMembers(), 1);
  db.deleteMember(id);
  assert.equal(await db.getMember(id), null);
});
