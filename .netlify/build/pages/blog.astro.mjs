import { c as createComponent, a as createAstro, m as maybeRenderHead, d as addAttribute, b as renderTemplate, r as renderComponent } from '../chunks/astro/server_BmSrm4w3.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_XexBz5M9.mjs';
import 'clsx';
import { a as getCollection } from '../chunks/_astro_content_Dbjsp2FK.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$BlogCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BlogCard;
  const { title, excerpt, image, slug, date } = Astro2.props;
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(`/blog/${slug}`, "href")} class="group block"> <div class="rounded-xl overflow-hidden mb-4"> <img${addAttribute(image, "src")}${addAttribute(title, "alt")} class="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"> </div> <h2 class="text-xl font-semibold mb-2 group-hover:text-primary transition-colors"> ${title} </h2> <p class="text-muted-foreground line-clamp-2"> ${excerpt} </p> <p class="text-sm text-muted-foreground mt-2">${formattedDate}</p> </a>`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/BlogCard.astro", void 0);

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const posts = await getCollection("blog");
  const sortedPosts = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Blog | Insights and Articles" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32"> <h1 class="text-4xl font-bold mb-16">Insights</h1> <div class="grid grid-cols-1 md:grid-cols-3 gap-12 stagger-children"> ${sortedPosts.map((post) => renderTemplate`${renderComponent($$result2, "BlogCard", $$BlogCard, { "title": post.data.title, "excerpt": post.data.description, "date": post.data.pubDate, "image": post.data.image, "slug": post.slug })}`)} </div> </div> ` })}`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/blog/index.astro", void 0);

const $$file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/blog/index.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
