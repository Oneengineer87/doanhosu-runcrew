import { access, readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";

const releaseMode = process.argv.includes("--release");
const root = resolve(process.cwd(), "public");
const errors = [];
const warnings = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    if (entry.isFile()) files.push(path);
  }
  return files;
}

function report(kind, file, message) {
  const item = `${relative(root, file) || "public"}: ${message}`;
  (kind === "error" ? errors : warnings).push(item);
}

async function checkLocalReference(file, rawReference) {
  const reference = rawReference.trim();
  if (!reference || reference === "#") {
    report(releaseMode ? "error" : "warning", file, `비어 있는 링크(${JSON.stringify(reference)})가 있습니다.`);
    return;
  }
  if (/^(?:https?:|mailto:|tel:|data:|blob:|#)/i.test(reference) || reference.startsWith("//")) return;
  if (/^javascript:/i.test(reference)) {
    report("error", file, "javascript: 링크는 사용할 수 없습니다.");
    return;
  }

  let clean;
  try {
    clean = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  } catch {
    report("error", file, `주소 형식이 올바르지 않습니다: ${reference}`);
    return;
  }
  const target = clean.startsWith("/")
    ? resolve(root, `.${clean}`)
    : resolve(dirname(file), clean);
  const fromRoot = relative(root, target);
  if (fromRoot.startsWith("..") || resolve(root, fromRoot) !== target) {
    report("error", file, `공개 폴더 밖을 가리키는 경로가 있습니다: ${reference}`);
    return;
  }

  if (await exists(target)) {
    const targetStat = await stat(target);
    if (!targetStat.isDirectory() || await exists(resolve(target, "index.html"))) return;
  }
  report("error", file, `연결된 파일을 찾을 수 없습니다: ${reference}`);
}

if (!await exists(root)) {
  console.error("[실패] public 폴더가 없습니다.");
  process.exit(1);
}

for (const required of ["index.html", "404.html", "robots.txt", "site-status.json"]) {
  if (!await exists(resolve(root, required))) errors.push(`${required}: 필수 공개 파일이 없습니다.`);
}

let siteStatus = { deployReady: false };
try {
  siteStatus = JSON.parse(await readFile(resolve(root, "site-status.json"), "utf8"));
} catch (error) {
  errors.push(`site-status.json: JSON 형식이 올바르지 않습니다 (${error.message}).`);
}

if (releaseMode && siteStatus.deployReady !== true) {
  errors.push("site-status.json: 최종 승인 전이므로 deployReady가 false입니다.");
}

if (releaseMode) {
  if (!await exists(resolve(root, "sitemap.xml"))) errors.push("sitemap.xml: 최종 공개용 사이트맵이 없습니다.");
  const robots = await readFile(resolve(root, "robots.txt"), "utf8").catch(() => "");
  if (/^\s*Disallow:\s*\/\s*$/im.test(robots)) errors.push("robots.txt: 전체 검색 차단(Disallow: /)이 남아 있습니다.");
}

const files = await walk(root);
const forbidden = files.filter((file) => /(?:^|\/)(?:brief|preview)\.html$/i.test(file));
for (const file of forbidden) report("error", file, "운영진·비교용 페이지는 공개 폴더에 둘 수 없습니다.");

for (const file of files) {
  const extension = extname(file).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".avif"].includes(extension)) {
    const size = (await stat(file)).size;
    if (size > 1_500_000) report(releaseMode ? "error" : "warning", file, `이미지가 ${(size / 1_000_000).toFixed(1)}MB로 너무 큽니다.`);
  }
  if (![".html", ".css", ".js", ".mjs"].includes(extension)) continue;

  const text = await readFile(file, "utf8");
  if (extension === ".html") {
    if (!/<html[^>]+lang=["']ko["']/i.test(text)) report("error", file, "html lang=\"ko\"가 없습니다.");
    if (!/<meta[^>]+name=["']viewport["']/i.test(text)) report("error", file, "모바일 viewport 설정이 없습니다.");
    if (!/<title>[^<]+<\/title>/i.test(text)) report("error", file, "페이지 제목이 없습니다.");
    if (!/<meta[^>]+name=["']description["']/i.test(text)) report(releaseMode ? "error" : "warning", file, "검색·카카오 공유용 설명이 없습니다.");

    if (releaseMode && relative(root, file) === "index.html") {
      for (const property of ["og:title", "og:description", "og:image"]) {
        const escaped = property.replace(":", "\\:");
        if (!new RegExp(`<meta[^>]+property=["']${escaped}["']`, "i").test(text)) {
          report("error", file, `카카오톡 공유용 ${property} 설정이 없습니다.`);
        }
      }
      if (!/<link[^>]+rel=["'][^"']*icon/i.test(text)) report("error", file, "사이트 아이콘 설정이 없습니다.");
    }

    const ids = [...text.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
    const duplicatedIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (duplicatedIds.length) report("error", file, `중복 id가 있습니다: ${duplicatedIds.join(", ")}`);

    for (const match of text.matchAll(/\s(?:href|src)=["']([^"']*)["']/gi)) {
      await checkLocalReference(file, match[1]);
    }
    for (const match of text.matchAll(/\ssrcset=["']([^"']+)["']/gi)) {
      for (const candidate of match[1].split(",")) await checkLocalReference(file, candidate.trim().split(/\s+/, 1)[0]);
    }

    if (releaseMode && /(?:PALETTE TEST|MOBILE FIRST TEST|최종 아님|준비 중|placeholder)/i.test(text)) {
      report("error", file, "테스트·준비 문구가 최종 공개 파일에 남아 있습니다.");
    }
  }

  if (extension === ".css") {
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      await checkLocalReference(file, match[1]);
    }
  }
}

console.log(`[점검] 공개 파일 ${files.length}개 · 최종 배포 승인 ${siteStatus.deployReady === true ? "ON" : "OFF"}`);
for (const warning of warnings) console.warn(`[주의] ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`[오류] ${error}`);
  console.error(`[실패] ${errors.length}개 문제를 먼저 수정해야 합니다.`);
  process.exit(1);
}
console.log("[통과] 링크·필수 파일·공개 범위 검사가 정상입니다.");
