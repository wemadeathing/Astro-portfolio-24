import '@astrojs/internal-helpers/path';
import 'kleur/colors';
import { N as NOOP_MIDDLEWARE_HEADER, k as decodeKey } from './chunks/astro/server_D7IckMtV.mjs';
import 'clsx';
import 'cookie';
import 'es-module-lexer';
import 'html-escaper';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/","cacheDir":"file:///Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/node_modules/.astro/","outDir":"file:///Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/dist/","srcDir":"file:///Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/","publicDir":"file:///Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/public/","buildClientDir":"file:///Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/dist/","buildServerDir":"file:///Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/.netlify/build/","adapterName":"@astrojs/netlify","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.CilZudxB.css"}],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/send-email","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/send-email\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"send-email","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/send-email.ts","pathname":"/api/send-email","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.CilZudxB.css"}],"routeData":{"route":"/blog","isIndex":true,"type":"page","pattern":"^\\/blog\\/?$","segments":[[{"content":"blog","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/blog/index.astro","pathname":"/blog","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.CilZudxB.css"}],"routeData":{"route":"/contact","isIndex":false,"type":"page","pattern":"^\\/contact\\/?$","segments":[[{"content":"contact","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/contact.astro","pathname":"/contact","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.CilZudxB.css"}],"routeData":{"route":"/projects","isIndex":true,"type":"page","pattern":"^\\/projects\\/?$","segments":[[{"content":"projects","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/projects/index.astro","pathname":"/projects","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.CilZudxB.css"}],"routeData":{"route":"/thank-you","isIndex":false,"type":"page","pattern":"^\\/thank-you\\/?$","segments":[[{"content":"thank-you","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/thank-you.astro","pathname":"/thank-you","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.CilZudxB.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/blog/[slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/blog/[slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/blog/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/blog/index@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/index@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/projects/[slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/projects/[slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/projects/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/projects/index@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/about.astro",{"propagation":"none","containsHead":true}],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/contact.astro",{"propagation":"none","containsHead":true}],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/thank-you.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/about@_@astro":"pages/about.astro.mjs","\u0000@astro-page:src/pages/api/send-email@_@ts":"pages/api/send-email.astro.mjs","\u0000@astro-page:src/pages/blog/[slug]@_@astro":"pages/blog/_slug_.astro.mjs","\u0000@astro-page:src/pages/blog/index@_@astro":"pages/blog.astro.mjs","\u0000@astro-page:src/pages/contact@_@astro":"pages/contact.astro.mjs","\u0000@astro-page:src/pages/projects/[slug]@_@astro":"pages/projects/_slug_.astro.mjs","\u0000@astro-page:src/pages/projects/index@_@astro":"pages/projects.astro.mjs","\u0000@astro-page:src/pages/thank-you@_@astro":"pages/thank-you.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_BmDc6epB.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/node_modules/astro/node_modules/unstorage/drivers/fs-lite.mjs":"chunks/fs-lite_COtHaKzy.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_CatfLGDG.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/.astro/content-assets.mjs":"chunks/content-assets_DleWbedO.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/.astro/content-modules.mjs":"chunks/content-modules_CtRTQABA.mjs","\u0000astro:data-layer-content":"chunks/_astro_data-layer-content_p0a__SSb.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/blog/journey-from-design-to-development-ai-shift.mdx?astroPropagatedAssets":"chunks/journey-from-design-to-development-ai-shift_2BqR0XNb.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/blog/visual-development-nocode-tools-transforming-design.mdx?astroPropagatedAssets":"chunks/visual-development-nocode-tools-transforming-design_CniPdk62.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/digital-banking-transformation.mdx?astroPropagatedAssets":"chunks/digital-banking-transformation_JRt2a1F9.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/ai-powered-bike-app.mdx?astroPropagatedAssets":"chunks/ai-powered-bike-app_DhhM0M83.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/ai-training-business-website.mdx?astroPropagatedAssets":"chunks/ai-training-business-website_kItOicyi.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/enterprise-design-system.mdx?astroPropagatedAssets":"chunks/enterprise-design-system_BTGef1Dx.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/consulting-website.mdx?astroPropagatedAssets":"chunks/consulting-website_BeqSiUL0.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/prompt-management-app.mdx?astroPropagatedAssets":"chunks/prompt-management-app_3Gz7OXbj.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/habit-tracking-app.mdx?astroPropagatedAssets":"chunks/habit-tracking-app_Bxi4tBDk.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/blog/journey-from-design-to-development-ai-shift.mdx":"chunks/journey-from-design-to-development-ai-shift_Bt6NCAvi.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/blog/visual-development-nocode-tools-transforming-design.mdx":"chunks/visual-development-nocode-tools-transforming-design_DE6qZfPs.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/digital-banking-transformation.mdx":"chunks/digital-banking-transformation_DQ8TtrBE.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/ai-powered-bike-app.mdx":"chunks/ai-powered-bike-app_C1EmvY8V.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/ai-training-business-website.mdx":"chunks/ai-training-business-website_BecuY8DQ.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/enterprise-design-system.mdx":"chunks/enterprise-design-system_oJz9H2uj.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/consulting-website.mdx":"chunks/consulting-website_Kt29I8gX.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/prompt-management-app.mdx":"chunks/prompt-management-app_D58c0t7t.mjs","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/habit-tracking-app.mdx":"chunks/habit-tracking-app_B_dfJPTG.mjs","@astrojs/react/client.js":"_astro/client.bnNPSdWK.js","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/projects/[slug].astro?astro&type=script&index=0&lang.ts":"_astro/_slug_.astro_astro_type_script_index_0_lang.DFagaDrQ.js","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/index.astro?astro&type=script&index=0&lang.ts":"_astro/index.astro_astro_type_script_index_0_lang.C6piNS7W.js","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts":"_astro/Layout.astro_astro_type_script_index_0_lang.DE2FTwof.js","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/HeroAnimation.astro?astro&type=script&index=0&lang.ts":"_astro/HeroAnimation.astro_astro_type_script_index_0_lang.D0u8Z_yY.js","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/Navbar.astro?astro&type=script&index=0&lang.ts":"_astro/Navbar.astro_astro_type_script_index_0_lang.DLj6Lyp0.js","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts":"_astro/ClientRouter.astro_astro_type_script_index_0_lang.CtSceO8m.js","/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/ClickableImage.astro?astro&type=script&index=0&lang.ts":"_astro/ClickableImage.astro_astro_type_script_index_0_lang.DHVLnqFT.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/projects/[slug].astro?astro&type=script&index=0&lang.ts","document.addEventListener(\"DOMContentLoaded\",function(){const c=document.querySelectorAll(\".toc-link\"),l=document.querySelectorAll(\".prose h2, .prose h3\");c.forEach(e=>{e.addEventListener(\"click\",function(t){t.preventDefault();const o=this.getAttribute(\"href\")?.slice(1),s=document.getElementById(o);s&&(this.style.opacity=\"0.7\",s.scrollIntoView({behavior:\"smooth\",block:\"start\"}),setTimeout(()=>{this.style.opacity=\"1\"},600))})});function i(){let e=null;if(l.forEach(t=>{const o=t.getBoundingClientRect();o.top<=100&&o.bottom>=0&&(e=t)}),c.forEach(t=>t.classList.remove(\"active\")),e){const t=document.querySelector(`a[href=\"#${e.id}\"]`);t&&t.classList.add(\"active\")}}let n=!1;window.addEventListener(\"scroll\",function(){n||(requestAnimationFrame(function(){i(),n=!1}),n=!0)}),i()});"],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/index.astro?astro&type=script&index=0&lang.ts","const a=[\"Product Designer \",\"Design Engineer \",\"Brand Designer \"];let r=0;const s=document.getElementById(\"changing-role\"),u=90,g=20,m=50,p=10,f=3e3;let o=!1,c=\"\",t=0;function d(e,n){return Math.floor(e+Math.random()*n-n/2)}function l(){const e=a[r];if(o)c=e.substring(0,t-1),t--,t===0&&(o=!1,r=(r+1)%a.length);else if(c=e.substring(0,t+1),t++,t===e.length){o=!0,setTimeout(l,f);return}if(s){s.textContent=c;const i=document.createElement(\"span\");i.className=\"cursor\",i.textContent=\"|\",s.appendChild(i)}const n=o?d(m,p):d(u,g);setTimeout(l,n)}document.addEventListener(\"DOMContentLoaded\",()=>{if(s){const e=document.createElement(\"style\");e.textContent=`\n        @keyframes blink {\n          0%, 100% { opacity: 1; }\n          50% { opacity: 0; }\n        }\n        .cursor {\n          animation: blink 0.8s infinite;\n          font-weight: bold;\n          color: #8b5cf6; /* Purple color - adjust to match your site's purple */\n        }\n      `,document.head.appendChild(e),setTimeout(l,500)}});"],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts","document.addEventListener(\"click\",e=>{const t=e.target;if(t.tagName===\"A\"&&t.getAttribute(\"href\")?.startsWith(\"#\")){e.preventDefault();const n=t.getAttribute(\"href\")?.slice(1),i=document.getElementById(n);i&&i.scrollIntoView({behavior:\"smooth\"})}});"],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/HeroAnimation.astro?astro&type=script&index=0&lang.ts","class c{x;y;size;speedX;speedY;constructor(t,i){this.x=t,this.y=i,this.size=Math.random()*2+.5,this.speedX=Math.random()*2-1,this.speedY=Math.random()*2-1}update(){this.x+=this.speedX,this.y+=this.speedY,this.size>.2&&(this.size-=.01)}draw(t){t.fillStyle=\"hsl(265, 89%, 78%)\",t.beginPath(),t.arc(this.x,this.y,this.size,0,Math.PI*2),t.fill()}}class o{canvas;ctx;particles;numberOfParticles;connectDistance;constructor(t){this.canvas=t,this.ctx=t.getContext(\"2d\"),this.particles=[],this.numberOfParticles=100,this.connectDistance=100,this.init(),window.addEventListener(\"resize\",()=>this.resize()),this.resize(),this.animate()}init(){for(let t=0;t<this.numberOfParticles;t++){const i=Math.random()*this.canvas.width,s=Math.random()*this.canvas.height;this.particles.push(new c(i,s))}}resize(){this.canvas.width=window.innerWidth,this.canvas.height=window.innerHeight}animate(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.particles.forEach((t,i)=>{t.update(),t.draw(this.ctx),(t.x<0||t.x>this.canvas.width)&&(t.x=Math.random()*this.canvas.width),(t.y<0||t.y>this.canvas.height)&&(t.y=Math.random()*this.canvas.height);for(let s=i+1;s<this.particles.length;s++){const h=t.x-this.particles[s].x,n=t.y-this.particles[s].y,a=Math.sqrt(h*h+n*n);a<this.connectDistance&&(this.ctx.beginPath(),this.ctx.strokeStyle=`hsla(265, 89%, 78%, ${1-a/this.connectDistance})`,this.ctx.lineWidth=.5,this.ctx.moveTo(t.x,t.y),this.ctx.lineTo(this.particles[s].x,this.particles[s].y),this.ctx.stroke())}}),requestAnimationFrame(()=>this.animate())}}document.addEventListener(\"DOMContentLoaded\",()=>{const e=document.getElementById(\"heroAnimation\");e&&new o(e)});"],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/Navbar.astro?astro&type=script&index=0&lang.ts","const o=document.getElementById(\"menuButton\"),l=document.getElementById(\"closeButton\"),t=document.getElementById(\"mobileMenu\"),n=e=>{t&&(t.style.opacity=e?\"1\":\"0\",t.style.pointerEvents=e?\"auto\":\"none\",document.body.style.overflow=e?\"hidden\":\"\")};o?.addEventListener(\"click\",()=>n(!0));l?.addEventListener(\"click\",()=>n(!1));t?.querySelectorAll(\"a\").forEach(e=>{e.addEventListener(\"click\",()=>n(!1))});"],["/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/components/ClickableImage.astro?astro&type=script&index=0&lang.ts","const t=document.getElementById(\"imageModal\"),a=t?.querySelector(\"img\");function o(){document.querySelectorAll(\"[data-image-src]\").forEach(e=>{e.addEventListener(\"click\",i=>{i.preventDefault();const l=e.getAttribute(\"data-image-src\"),n=e.getAttribute(\"data-image-alt\");l&&t&&a&&(a.src=l,a.alt=n||\"\",t.style.display=\"flex\",document.body.style.overflow=\"hidden\")})})}t?.addEventListener(\"click\",e=>{e.target===t&&d()});document.addEventListener(\"keydown\",e=>{e.key===\"Escape\"&&d()});function d(){t&&(t.style.display=\"none\",document.body.style.overflow=\"\")}o();document.addEventListener(\"astro:after-swap\",o);window.closeModal=d;"]],"assets":["/_astro/NS-profile-2.CSyv7mqe.png","/_astro/instrument-sans-latin-ext-400-normal.C8KGgusn.woff2","/_astro/instrument-sans-latin-400-normal.CzmC6WRw.woff2","/_astro/instrument-sans-latin-ext-400-normal.BNHvxlaQ.woff","/_astro/instrument-sans-latin-400-normal.D0WkGUGD.woff","/_astro/nasif-portfolio-grid.C_vgLY01.png","/_astro/about.CilZudxB.css","/Robots.txt","/Sitemap.xml","/Web Manifest.json","/_astro/ClientRouter.astro_astro_type_script_index_0_lang.CtSceO8m.js","/_astro/client.bnNPSdWK.js","/images/bike-tune-db.png","/images/bike-tune-emulator.jpg","/images/bike-tune-feature.jpg","/images/bike-tune-figma.jpg","/images/bike-tune-flutter.png","/images/bike-tune-test.png","/images/card 01 - design.jpg","/images/card 02 - structure.jpg","/images/card 03 - base components.jpg","/images/digital-transformation-app-1.jpg","/images/digital-transformation-app-2.jpg","/images/digital-transformation-ux.jpg","/images/placeholder.png","/images/work/ECOS Consulting _ Safety_ Health _ Environment.jpeg","/images/work/Everprompt - AI Prompt Management Made Simple.jpeg","/images/work/Learn AI Without the Overwhelm _ Get Comfortable with AI _ Nexevo.jpeg","/images/work/Ripple.jpeg","/images/work/ecos-consulting-website-1.png","/images/work/ecos-consulting-website-2.png","/images/work/everprompt-app1.png","/images/work/everprompt-app2.png","/images/work/everprompt-app3.png","/images/work/nexevo-website-1.png","/images/work/nexevo-website-2.png","/images/work/nexevo-website-3.png","/images/work/ripple-app-1.png","/images/work/ripple-app-2.png","/images/work/ripple-app-3.png"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"HALMtJyywhZPFey0R4x8Ious0LbRKt0hGMAhZXfPQS8=","sessionConfig":{"driver":"fs-lite","options":{"base":"/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/node_modules/.astro/sessions"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/fs-lite_COtHaKzy.mjs');

export { manifest };
