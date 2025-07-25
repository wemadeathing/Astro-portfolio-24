import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D7IckMtV.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_ecC7OEXx.mjs';
export { renderers } from '../renderers.mjs';

const $$ThankYou = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Thank You | Message Sent" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container max-w-5xl mx-auto px-4 pt-32"> <div class="max-w-2xl mx-auto text-center"> <div class="mb-8 flex justify-center"> <div class="rounded-full bg-primary/10 p-4"> <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path> <polyline points="22 4 12 14.01 9 11.01"></polyline> </svg> </div> </div> <h1 class="text-4xl font-bold mb-6 text-foreground">Thank You!</h1> <p class="text-xl text-muted-foreground mb-12">
Your message has been sent successfully. I'll get back to you as soon as possible.
</p> <a href="/" class="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80">
Back to Home
</a> </div> </div> ` })}`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/thank-you.astro", void 0);

const $$file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/thank-you.astro";
const $$url = "/thank-you";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ThankYou,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
