import { c as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_BmSrm4w3.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_XexBz5M9.mjs';
import { a as getCollection } from '../chunks/_astro_content_Dbjsp2FK.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allProjects = await getCollection("projects");
  const projects = allProjects.filter((project) => project.data.published !== false);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Projects | Featured Work" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32"> <h1 class="text-4xl font-bold mb-16">Work</h1> <div class="grid grid-cols-1 md:grid-cols-3 gap-12 stagger-children"> ${projects.map((project) => renderTemplate`<a${addAttribute(`/projects/${project.slug}`, "href")} class="group block"> <div class="rounded-xl overflow-hidden mb-4"> <img${addAttribute(project.data.image, "src")}${addAttribute(project.data.title, "alt")} class="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"> </div> <h2 class="text-xl font-semibold mb-2 group-hover:text-primary transition-colors"> ${project.data.title} </h2> <p class="text-muted-foreground line-clamp-2"> ${project.data.description} </p> </a>`)} </div> </div> ` })}`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/projects/index.astro", void 0);

const $$file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/projects/index.astro";
const $$url = "/projects";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
