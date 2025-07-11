import { c as createComponent, m as maybeRenderHead, e as renderScript, a as renderTemplate, r as renderComponent, b as addAttribute } from '../chunks/astro/server_D7IckMtV.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_ecC7OEXx.mjs';
import 'clsx';
import { a as getCollection } from '../chunks/_astro_content_DIuX6jCf.mjs';
export { renderers } from '../renderers.mjs';

const $$HeroAnimation = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<canvas id="heroAnimation" class="absolute inset-0 -z-10 opacity-80"></canvas> ${renderScript($$result, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/HeroAnimation.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/HeroAnimation.astro", void 0);

const portfolioGrid = new Proxy({"src":"/_astro/nasif-portfolio-grid.C_vgLY01.png","width":1680,"height":1340,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/images/nasif-portfolio-grid.png";
							}
							
							return target[name];
						}
					});

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const projects = await getCollection("projects");
  projects.filter((project) => project.data.featured);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Nasif Salaam | Product Designer \xB7 Digital Innovation" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="absolute inset-0 h-screen bg-gradient-hero after:absolute after:inset-0 after:bg-gradient-to-b after:from-transparent after:to-black after:opacity-90 -z-10"></div> ', ' <section class="relative min-h-[100vh] flex items-center pt-16 sm:pt-20"> <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="max-w-4xl"> <h1 class="text-4xl sm:text-6xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight sm:leading-tight md:leading-tight lg:leading-tight"> <span id="changing-role">Product Designer</span><br>\nwith 15+ Years of Design Expertise.\n</h1> <p class="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl leading-relaxed">\nI craft visually stunning, user-centered solutions that communicate ideas with clarity, whether collaborating in a team or working independently. With expertise across print, digital, and product design, I use modern tools to deliver impactful results.\n</p> <div class="flex gap-4"></div> </div> </div> </section> <div class="w-full"> <img', ` alt="Portfolio Grid" class="w-full object-cover"> </div> <section class="bg-background"> <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24"> <h2 class="text-4xl font-bold mb-4 text-foreground">Curious, Creative, and Always Learning</h2> <p class="text-lg text-muted-foreground mb-8 max-w-2xl">
I believe in making things better \u2013 for users, for teams, and for the future of how we work. My approach combines creative problem-solving with a passion for efficiency, always looking for smarter ways to build and improve.
</p> <p class="text-lg text-muted-foreground mb-8 max-w-2xl">
What drives me is the full journey of product creation. From initial concept through to final implementation, I love being hands-on in every phase. This curiosity led me to expand beyond design into development, and now into exploring how AI can enhance our creative process.
</p> <p class="text-lg text-muted-foreground mb-8 max-w-2xl">
I thrive in collaborative environments where ideas flow freely and everyone feels empowered to contribute. While I take the work seriously, I believe the best results come when teams feel comfortable enough to experiment, learn, and occasionally fail forward together.
</p> </div> </section><section class="bg-background"> <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24"> <h2 class="text-4xl font-bold mb-4 text-foreground">Currently Open to New Opportunities</h2> <p class="text-lg text-muted-foreground mb-8 max-w-2xl">
I'm excited to bring my product design and development experience to a team that values innovation and impact. Whether it's joining a great team or exploring collaborative ventures, I'm interested in meaningful conversations.
</p> <a href="/contact" class="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-white/90">
Let's Connect
</a> </div> </section> `, '<script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"><\/script>  ', " "])), maybeRenderHead(), renderComponent($$result2, "HeroAnimation", $$HeroAnimation, {}), addAttribute(portfolioGrid.src, "src"), renderComponent($$result2, "elevenlabs-convai", "elevenlabs-convai", { "agent-id": "VAtr4lyC76FjdLqbj3kt" }), renderScript($$result2, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/index.astro?astro&type=script&index=0&lang.ts")) })}`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/index.astro", void 0);

const $$file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
