import { a as getCollection } from '../chunks/_astro_content_Dbjsp2FK.mjs';
export { renderers } from '../renderers.mjs';

const GET = async ({ site }) => {
  const siteUrl = site || "https://www.nasifsalaam.com";
  const blogPosts = await getCollection("blog");
  const projects = await getCollection("projects");
  const staticPages = [
    {
      url: "/",
      lastmod: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      changefreq: "monthly",
      priority: "1.0"
    },
    {
      url: "/projects",
      lastmod: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      changefreq: "monthly",
      priority: "0.8"
    },
    {
      url: "/about",
      lastmod: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      changefreq: "monthly",
      priority: "0.7"
    },
    {
      url: "/contact",
      lastmod: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      changefreq: "monthly",
      priority: "0.7"
    },
    {
      url: "/blog",
      lastmod: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      changefreq: "weekly",
      priority: "0.8"
    }
  ];
  const blogPages = blogPosts.map((post) => ({
    url: `/blog/${post.slug}`,
    lastmod: post.data.pubDate.toISOString().split("T")[0],
    changefreq: "monthly",
    priority: "0.6"
  }));
  const projectPages = projects.filter((project) => project.data.published).map((project) => ({
    url: `/projects/${project.slug}`,
    lastmod: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    changefreq: "monthly",
    priority: "0.6"
  }));
  const allPages = [...staticPages, ...blogPages, ...projectPages];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
