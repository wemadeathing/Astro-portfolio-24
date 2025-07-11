import { c as createComponent, m as maybeRenderHead, e as renderScript, b as addAttribute, a as renderTemplate, d as createAstro, r as renderComponent, i as renderSlot, j as renderHead } from './astro/server_D7IckMtV.mjs';
import 'kleur/colors';
/* empty css                         */
import 'clsx';

const $$Navbar = createComponent(($$result, $$props, $$slots) => {
  const navItems = [
    { href: "/projects", label: "Work" },
    { href: "/about", label: "About" },
    { href: "/blog", label: "Insights" },
    { href: "/contact", label: "Contact" }
  ];
  return renderTemplate`${maybeRenderHead()}<header class="fixed w-full z-50"> <div class="absolute inset-0  backdrop-blur-xl"></div> <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"> <nav class="flex items-center justify-between h-16"> <a href="/" class="text-2xl font-semibold text-white">
Nasif Salaam
</a> <!-- Desktop Menu --> <ul class="hidden md:flex items-center gap-8"> ${navItems.map((item) => renderTemplate`<li> <a${addAttribute(item.href, "href")} class="text-sm font-bold text-muted-foreground transition-colors duration-200 hover:text-primary"> ${item.label} </a> </li>`)} </ul> <!-- Mobile Menu Button --> <button id="menuButton" class="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors duration-200" aria-label="Toggle menu"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <line x1="4" x2="20" y1="12" y2="12"></line> <line x1="4" x2="20" y1="6" y2="6"></line> <line x1="4" x2="20" y1="18" y2="18"></line> </svg> </button> <!-- Mobile Menu --> <div id="mobileMenu" class="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 md:hidden opacity-0 pointer-events-none transition-opacity duration-300"> <div class="flex justify-between items-center p-4"> <span class="text-xl font-semibold text-gradient">Menu</span> <button id="closeButton" class="p-2 hover:bg-secondary rounded-lg transition-colors duration-200" aria-label="Close menu"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M18 6 6 18"></path> <path d="m6 6 12 12"></path> </svg> </button> </div> <ul class="p-4 space-y-4"> ${navItems.map((item) => renderTemplate`<li> <a${addAttribute(item.href, "href")} class="block text-lg font-medium text-muted-foreground hover:text-primary transition-colors duration-200 py-2"> ${item.label} </a> </li>`)} </ul> </div> </nav> </div> </header> ${renderScript($$result, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/Navbar.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/Navbar.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="border-t border-secondary mt-32"> <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8"> <div class="flex flex-col md:flex-row justify-between items-center gap-8"> <div class="text-center md:text-left"> <h3 class="text-xl font-semibold mb-2 text-gradient">Let's build something amazing together</h3> <p class="text-muted-foreground">Available for freelance projects and full-time opportunities</p> </div> <div class="flex gap-6"> <a href="https://github.com/wemadeathing" class="text-muted-foreground hover:text-primary transition-colors">GitHub</a> <a href="https://www.linkedin.com/in/nasifsalaam/" class="text-muted-foreground hover:text-primary transition-colors">LinkedIn</a> <a href="https://www.behance.net/nsalaam" class="text-muted-foreground hover:text-primary transition-colors">Behance</a> </div> </div> </div> </footer>`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/Footer.astro", void 0);

const $$Astro$1 = createAstro();
const $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ClientRouter;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/node_modules/astro/components/ClientRouter.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title,
    description = "Nasif Salaam - Portfolio and Insights. Professional design, development, and AI integration services.",
    image = "/images/og-image.jpg",
    canonicalURL = Astro2.url.href
  } = Astro2.props;
  const siteUrl = "https://www.nasifsalaam.com";
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><!-- Primary Meta Tags --><title>', '</title><meta name="title"', '><meta name="description"', '><meta name="google-site-verification" content="0AkXWv8ep3tS3TRVwSrSE670DTYpn--SyBuwlz1P9H8"><!-- Favicon --><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"><link rel="manifest" href="/site.webmanifest"><!-- Canonical URL --><link rel="canonical"', '><!-- Open Graph / Facebook --><meta property="og:type" content="website"><meta property="og:url"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><!-- Twitter --><meta property="twitter:card" content="summary_large_image"><meta property="twitter:url"', '><meta property="twitter:title"', '><meta property="twitter:description"', '><meta property="twitter:image"', '><!-- Additional Meta Tags --><meta name="generator"', '><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"><!-- Structured Data - Personal Portfolio --><script type="application/ld+json">\n      {\n        "@context": "https://schema.org",\n        "@type": "Person",\n        "name": "Nasif Salaam", \n        "url": "https://www.nasifsalaam.com",\n        "sameAs": [\n          "https://linkedin.com/in/nasifsalaam",\n          "https://twitter.com/nasifsalaam",\n          "https://github.com/nasifsalaam"\n        ],\n        "jobTitle": "Designer & Developer",\n        "description": "Portfolio and Insights. Professional design, development, and AI integration services."\n      }\n    <\/script>', `<!-- Google tag (gtag.js) --><script async src="https://www.googletagmanager.com/gtag/js?id=G-FMSF6Y2DYL"><\/script><script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-FMSF6Y2DYL');
    <\/script>`, '</head> <body class="min-h-screen bg-background font-sans antialiased"> ', ' <main class="page-content"> ', " </main> ", " ", "</body></html>"])), title, addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(canonicalURL, "href"), addAttribute(canonicalURL, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(new URL(image, siteUrl), "content"), addAttribute(canonicalURL, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(new URL(image, siteUrl), "content"), addAttribute(Astro2.generator, "content"), renderComponent($$result, "ViewTransitions", $$ClientRouter, { "fallback": "none" }), renderHead(), renderComponent($$result, "Navbar", $$Navbar, {}), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, {}), renderScript($$result, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"));
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
