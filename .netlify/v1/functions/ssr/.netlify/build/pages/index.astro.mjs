import { c as createComponent, a as createAstro, m as maybeRenderHead, d as addAttribute, b as renderTemplate, r as renderComponent, e as renderScript } from '../chunks/astro/server_BmSrm4w3.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_XexBz5M9.mjs';
import 'clsx';
/* empty css                                 */
import { a as getCollection } from '../chunks/_astro_content_Dbjsp2FK.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro$1 = createAstro();
const $$Button = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Button;
  const {
    href = "/contact",
    text = "Button",
    variant = "primary",
    external = false,
    class: className = ""
  } = Astro2.props;
  const getButtonClasses = (variant2) => {
    const baseClasses = "inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium transition-colors";
    if (variant2 === "primary") {
      return `${baseClasses} bg-white text-black hover:bg-white/90`;
    } else {
      return `${baseClasses} border border-white/20 text-white hover:bg-white/10`;
    }
  };
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(href, "href")}${addAttribute(`${getButtonClasses(variant)} ${className}`, "class")}${addAttribute(external ? "_blank" : void 0, "target")}${addAttribute(external ? "noopener noreferrer" : void 0, "rel")} data-astro-cid-vnzlvqnm> ${text} </a> `;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/Button.astro", void 0);

const $$Astro = createAstro();
const $$LogoCarousel = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$LogoCarousel;
  const {
    logos = [
      "/images/logos/Claude_Logo_0 1.png",
      "/images/logos/Cursor_Logo_0 1.png",
      "/images/logos/Figma_Symbol_0 1.png",
      "/images/logos/Group 512819.png",
      "/images/logos/Lovable_Logo_1 1.png",
      "/images/logos/Perplexity Logo Off-White 1.png",
      "/images/logos/Replit_idxDSDvFDM_0 1.png",
      "/images/logos/StackBlitz_idLCk4jSTb_1 1.png",
      "/images/logos/supabase-logo-DCC676FFE2-seeklogo.com 1.png",
      "/images/logos/V0_Logo_0 1.png"
    ],
    speed = 30,
    pauseOnHover = true
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="relative w-full overflow-hidden" data-astro-cid-lqivs3vl> <!-- Fade overlay on the left --> <div class="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" data-astro-cid-lqivs3vl></div> <!-- Fade overlay on the right --> <div class="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" data-astro-cid-lqivs3vl></div> <!-- Carousel container --> <div class="flex animate-scroll"${addAttribute(`--speed: ${speed}s;`, "style")} data-astro-cid-lqivs3vl> <!-- First set of logos --> <div class="flex items-center gap-12 px-8 flex-shrink-0" data-astro-cid-lqivs3vl> ${logos.map((logo, index) => {
    const isV0Logo = logo.includes("V0_Logo");
    return renderTemplate`<div${addAttribute(`first-${index}`, "key")} class="flex items-center justify-center h-20 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300" data-astro-cid-lqivs3vl> <img${addAttribute(logo, "src")}${addAttribute(`Logo ${index + 1}`, "alt")}${addAttribute(`object-contain filter grayscale hover:grayscale-0 transition-all duration-300 ${isV0Logo ? "max-h-10 max-w-16" : "max-h-16 max-w-32"}`, "class")} loading="lazy" data-astro-cid-lqivs3vl> </div>`;
  })} </div> <!-- Duplicate set for seamless loop --> <div class="flex items-center gap-12 px-8 flex-shrink-0" data-astro-cid-lqivs3vl> ${logos.map((logo, index) => {
    const isV0Logo = logo.includes("V0_Logo");
    return renderTemplate`<div${addAttribute(`second-${index}`, "key")} class="flex items-center justify-center h-20 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300" data-astro-cid-lqivs3vl> <img${addAttribute(logo, "src")}${addAttribute(`Logo ${index + 1}`, "alt")}${addAttribute(`object-contain filter grayscale hover:grayscale-0 transition-all duration-300 ${isV0Logo ? "max-h-10 max-w-16" : "max-h-16 max-w-32"}`, "class")} loading="lazy" data-astro-cid-lqivs3vl> </div>`;
  })} </div> </div> </div> `;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/LogoCarousel.astro", void 0);

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

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const projects = await getCollection("projects");
  projects.filter((project) => project.data.featured);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Nasif Salaam | Technical Product Designer \xB7 Digital Innovation" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="absolute inset-0 h-screen bg-gradient-hero after:absolute after:inset-0 after:bg-gradient-to-b after:from-transparent after:to-black after:opacity-90 -z-10"></div> <section class="relative min-h-[100vh] flex items-center pt-16 sm:pt-20"> <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="max-w-4xl"> <h1 class="text-4xl sm:text-6xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight sm:leading-tight md:leading-tight lg:leading-tight"> <span id="changing-role">Product Designer</span><br>
who bridges Design & Development.
</h1> <p class="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl leading-relaxed">
With 15+ years of experience, I design solutions that developers can actually build. I understand technical constraints, speak the language of engineering teams, and turn ideas into production-ready experiences.
</p> <div class="flex gap-4 pt-4"> ${renderComponent($$result2, "Button", $$Button, { "href": "/contact", "text": "Let's Connect", "variant": "primary" })} ${renderComponent($$result2, "Button", $$Button, { "href": "/projects", "text": "View My Work", "variant": "secondary" })} </div> </div> </div> </section> <div class="w-full"> <img${addAttribute(portfolioGrid.src, "src")} alt="Portfolio Grid" class="w-full object-cover"> </div> <section class="bg-background"> <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24"> <h2 class="text-4xl font-bold mb-4 text-foreground">Designer, Problem Solver & Learner</h2> <p class="text-lg text-muted-foreground mb-8 max-w-2xl">
I didn't start out technical. Early in my career, design was about making things look great. But over 15 years, I've learned it's about solving problems within real constraints: business goals, technical realities, and user needs.
</p> <p class="text-lg text-muted-foreground mb-8 max-w-2xl">
Today, I work across the full spectrum. I design systems, build apps and functional prototypes with modern frameworks, and collaborate with engineering teams to ensure what we design actually ships. I leverage AI tools to accelerate execution, but my value comes from understanding how things work. Databases, APIs, authentication, and the decisions developers face daily.
</p> <p class="text-lg text-muted-foreground mb-8 max-w-2xl">
Recently, I earned my ISO 42001 certification to help businesses implement AI responsibly. Because continuous learning isn't just about tools. It's about staying relevant and adding value in a rapidly changing landscape.
</p> </div> </section> <section class="bg-background"> <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"> <div class="text-center mb-8"> <h2 class="text-2xl font-semibold text-muted-foreground mb-4">Some of the tools I work with</h2> </div> ${renderComponent($$result2, "LogoCarousel", $$LogoCarousel, { "speed": 20 })} </div> </section> <section class="bg-background"> <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24 text-center"> <h2 class="text-4xl font-bold mb-4 text-foreground">Let’s Solve Something Together</h2> <p class="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
If you’re a recruiter, manager, or collaborator seeking someone who can bridge design, business goals, and technical realities, let’s connect and explore how we can work together.
</p> ${renderComponent($$result2, "Button", $$Button, { "href": "/contact", "text": "Let\u2019s Connect", "variant": "primary" })} </div> </section> ${renderScript($$result2, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/index.astro?astro&type=script&index=0&lang.ts")} ` })}`;
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
