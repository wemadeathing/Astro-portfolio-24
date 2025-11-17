import { c as createComponent, a as createAstro, m as maybeRenderHead, d as addAttribute, e as renderScript, b as renderTemplate } from './astro/server_BmSrm4w3.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                                                     */

const $$Astro$1 = createAstro();
const $$ClickableImage = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ClickableImage;
  const { src, alt, caption } = Astro2.props;
  const imageSrc = src.startsWith("/") ? src : `/${src}`;
  return renderTemplate`${maybeRenderHead()}<figure class="my-8 group"> <div class="rounded-xl overflow-hidden cursor-zoom-in"${addAttribute(imageSrc, "data-image-src")}${addAttribute(alt, "data-image-alt")}> <img${addAttribute(imageSrc, "src")}${addAttribute(alt, "alt")} class="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"> </div> ${caption && renderTemplate`<figcaption class="text-sm text-muted-foreground text-center mt-4 italic"> ${caption} </figcaption>`} </figure> <!-- Modal --> <div id="imageModal" class="fixed inset-0 bg-black/90 z-50 hidden items-center justify-center"> <div class="relative max-w-7xl mx-auto px-4"> <img src="" alt="" class="max-h-[90vh] w-auto object-contain"> <button class="absolute top-4 right-4 text-white hover:text-primary p-2" onclick="closeModal()"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M18 6 6 18"></path> <path d="m6 6 12 12"></path> </svg> </button> </div> </div> ${renderScript($$result, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/ClickableImage.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/ClickableImage.astro", void 0);

const $$Astro = createAstro();
const $$ContactButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ContactButton;
  const {
    href = "/contact",
    text = "Let's Connect",
    external = false
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(href, "href")} class="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium transition-colors hover:bg-white/90" style="color: #000 !important; text-decoration: none !important;"${addAttribute(external ? "_blank" : void 0, "target")}${addAttribute(external ? "noopener noreferrer" : void 0, "rel")} data-astro-cid-zwc7ulwr> ${text} </a> `;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/ContactButton.astro", void 0);

export { $$ContactButton as $, $$ClickableImage as a };
