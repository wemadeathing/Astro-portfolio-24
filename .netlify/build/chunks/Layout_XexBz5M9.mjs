import { c as createComponent, m as maybeRenderHead, e as renderScript, d as addAttribute, b as renderTemplate, a as createAstro, r as renderComponent, i as renderSlot, j as renderHead } from './astro/server_BmSrm4w3.mjs';
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

const $$Astro$2 = createAstro();
const $$WhatsAppWidget = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$WhatsAppWidget;
  const {
    phoneNumber = "+1234567890",
    // Replace with your actual WhatsApp number
    message = "Hi! I'd like to discuss a project with you.",
    position = "bottom-right"
  } = Astro2.props;
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6"
  };
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(`fixed ${positionClasses[position]} z-50`, "class")} data-astro-cid-ffviful5> <a${addAttribute(whatsappUrl, "href")} target="_blank" rel="noopener noreferrer" class="group flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" aria-label="Chat on WhatsApp" data-astro-cid-ffviful5> <!-- WhatsApp Icon --> <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-astro-cid-ffviful5> <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" data-astro-cid-ffviful5></path> </svg> </a> </div> `;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/WhatsAppWidget.astro", void 0);

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
    image = "/images/NS-profile-2.png",
    canonicalURL = Astro2.url.href
  } = Astro2.props;
  const siteUrl = "https://www.nasifsalaam.com";
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><!-- Primary Meta Tags --><title>', '</title><meta name="title"', '><meta name="description"', '><meta name="keywords" content="Nasif Salaam, Product Designer, UI/UX Designer, Web Developer, AI Integration, Portfolio, Design Services, Development Services"><meta name="author" content="Nasif Salaam"><meta name="google-site-verification" content="0AkXWv8ep3tS3TRVwSrSE670DTYpn--SyBuwlz1P9H8"><!-- Favicon --><link rel="icon" type="image/png" href="/favicon.ico"><link rel="manifest" href="/Web Manifest.json"><!-- Canonical URL --><link rel="canonical"', '><!-- Open Graph / Facebook --><meta property="og:type" content="website"><meta property="og:url"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><!-- Twitter --><meta property="twitter:card" content="summary_large_image"><meta property="twitter:url"', '><meta property="twitter:title"', '><meta property="twitter:description"', '><meta property="twitter:image"', '><!-- Additional Meta Tags --><meta name="generator"', '><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"><!-- Structured Data - Personal Portfolio --><script type="application/ld+json">\n      {\n        "@context": "https://schema.org",\n        "@type": "Person",\n        "name": "Nasif Salaam", \n        "url": "https://www.nasifsalaam.com",\n        "sameAs": [\n          "https://linkedin.com/in/nasifsalaam",\n          "https://twitter.com/nasifsalaam",\n          "https://github.com/nasifsalaam"\n        ],\n        "jobTitle": "Designer & Developer",\n        "description": "Portfolio and Insights. Professional design, development, and AI integration services."\n      }\n    <\/script>', `<!-- Google tag (gtag.js) --><script async src="https://www.googletagmanager.com/gtag/js?id=G-FMSF6Y2DYL"><\/script><script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-FMSF6Y2DYL');
    <\/script>`, '</head> <body class="min-h-screen bg-background font-sans antialiased"> ', ' <main class="page-content"> ', " </main> ", " <!-- WhatsApp Widget - appears on all pages --> ", " ", "</body></html>"])), title, addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(canonicalURL, "href"), addAttribute(canonicalURL, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(new URL(image, siteUrl), "content"), addAttribute(canonicalURL, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(new URL(image, siteUrl), "content"), addAttribute(Astro2.generator, "content"), renderComponent($$result, "ViewTransitions", $$ClientRouter, { "fallback": "none" }), renderHead(), renderComponent($$result, "Navbar", $$Navbar, {}), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, {}), renderComponent($$result, "WhatsAppWidget", $$WhatsAppWidget, { "phoneNumber": "0814623628", "message": "Hi! I'd like to discuss a project with you.", "position": "bottom-right" }), renderScript($$result, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"));
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
