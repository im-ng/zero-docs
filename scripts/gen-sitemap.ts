import { SitemapStream, streamToPromise } from "sitemap";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIST = join(process.cwd(), "docs", ".vitepress", "dist");
const HOST = "https://zerofmk.in";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = walk(DIST).filter((f) => !f.endsWith("404.html"));
const urls = files.map((f) => {
  let rel = f.slice(DIST.length).replace(/\\/g, "/");
  if (rel === "/index.html") return HOST + "/";
  if (rel.endsWith("/index.html"))
    return HOST + rel.slice(0, -"index.html".length);
  if (rel.endsWith(".html")) return HOST + rel.slice(0, -".html".length);
  return HOST + rel;
});

const stream = new SitemapStream({ hostname: HOST });
for (const u of urls) {
  stream.write({
    url: u,
    changefreq: "weekly",
    priority: u === HOST + "/" ? 1 : 0.7,
  });
}
stream.end();

streamToPromise(stream).then((data) => {
  writeFileSync(join(DIST, "sitemap.xml"), data.toString());
  console.log(`sitemap: wrote ${urls.length} urls`);
});
