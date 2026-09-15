// 시안 2 글꼴을 페이지에 쓰인 글자만 담아 내려받는다(구글 폰트 API의 text= 매개변수).
// 시안 2의 문구를 바꾸면 다시 실행한다: node scripts/subset-fonts.mjs
import { readFileSync, writeFileSync } from "node:fs";

const sources = [
  "components/v2/header.tsx",
  "components/v2/sections.tsx",
  "components/artwork-viewer.tsx",
  "components/reading-tools.tsx",
  "components/design-switch.tsx",
  "lib/artworks.ts",
];
const families = {
  hahmlet: "Hahmlet:wght@500",
  plex: "IBM+Plex+Sans+KR:wght@400;500;700",
};
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

const chars = new Set(
  "0123456789 .,:;!?()·/-–—%+&@'\"…→↗×ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
);
for (const file of sources) {
  for (const ch of readFileSync(file, "utf8")) {
    if (/[가-힣ㄱ-ㆎ一-鿿]/.test(ch)) chars.add(ch);
  }
}
const text = [...chars].sort().join("");
console.log(`${chars.size} characters`);

let css = "/* scripts/subset-fonts.mjs가 만든 파일. 직접 고치지 않는다. */\n";
for (const [key, family] of Object.entries(families)) {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}&display=swap`;
  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok) throw new Error(`${family}: ${response.status}`);
  for (const block of (await response.text()).split("@font-face").slice(1)) {
    const weight = block.match(/font-weight:\s*(\d+)/)[1];
    const fileUrl = block.match(/src:\s*url\(([^)]+)\)/)[1];
    const name = `v2-${key}-${weight}.woff2`;
    const bytes = Buffer.from(await (await fetch(fileUrl)).arrayBuffer());
    writeFileSync(`public/assets/${name}`, bytes);
    console.log(name, bytes.length, "bytes");
    const familyName = block.match(/font-family:\s*'([^']+)'/)[1];
    css += `@font-face {\n  font-family: "${familyName}";\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url(/assets/${name}) format("woff2");\n}\n`;
  }
}
writeFileSync("app/v2/fonts.css", css);
console.log("wrote app/v2/fonts.css");
