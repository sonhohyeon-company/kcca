export const site = {
  name: "한국청목캘리그라피예술협회",
  legalName: "(사)한국청목캘리그라피예술협회",
  representative: "김상돈",
  businessNumber: "861-82-00740",
  phone: "031-878-0503",
  tel: "tel:0318780503",
  email: "kccasociety@gmail.com",
  postcode: "11618",
  address: "경기도 의정부시 서부로 545 창업관 651호",
  youtube: "https://www.youtube.com/channel/UCDd-RgrF8juUjx51niKJxuA",
} as const;

// Read at request time (callers are dynamic), so one image serves preview and production.
export const siteUrl = () => process.env.SITE_URL ?? "http://localhost:3000";
export const indexingAllowed = () => process.env.ALLOW_INDEXING === "true";
