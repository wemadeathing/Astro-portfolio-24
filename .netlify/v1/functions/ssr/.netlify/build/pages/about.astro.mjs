import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from '../chunks/astro/server_D7IckMtV.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_ecC7OEXx.mjs';
import '@astrojs/internal-helpers/path';
import '@astrojs/internal-helpers/remote';
import { $ as $$Image } from '../chunks/_astro_assets_Dy6Jke2q.mjs';
export { renderers } from '../renderers.mjs';

const profileImage = new Proxy({"src":"/_astro/NS-profile-2.CSyv7mqe.png","width":400,"height":400,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/images/NS-profile-2.png";
							}
							
							return target[name];
						}
					});

const $$About = createComponent(($$result, $$props, $$slots) => {
  const expertise = [
    {
      title: "Digital Product Design",
      description: "Creating intuitive digital products that solve real user problems. I focus on the full product lifecycle, from research and design through to implementation and iteration.",
      icon: "M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm3.5 1a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 6.75l-2.5-3-3 4-1.5-2-3.5 4.5h14l-3.5-3.5z"
    },
    {
      title: "AI Integration",
      description: "Leveraging AI tools to enhance creativity and streamline workflows. I help teams adopt and implement AI solutions that boost productivity while maintaining design quality.",
      icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z"
    },
    {
      title: "Visual Development",
      description: "Turning designs into functional digital products using modern development tools and platforms. I bridge the gap between design and implementation.",
      icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
    },
    {
      title: "Innovation & Growth",
      description: "Bringing a proactive approach to problem-solving, combining creative thinking with technical possibilities. I thrive on learning new tools and sharing knowledge.",
      icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
    }
  ];
  const skills = {
    design: [
      "Brand Design",
      "Graphic Design",
      "Visual Communication",
      "Typography"
    ],
    uiux: [
      "Prototyping & Wireframing",
      "User Research",
      "Interface Design",
      "Design Systems"
    ],
    visualDev: [
      "FlutterFlow",
      "Webflow",
      "Framer",
      "Wordpress"
    ],
    aiIntegration: [
      "Prompt Engineering",
      "Workflow Optimization",
      "AI Implementation",
      "AI assisted development"
    ],
    tools: [
      "Figma",
      "Adobe Suite",
      "Miro",
      "Cursor"
    ]
  };
  const experience = [
    {
      role: "Lead Designer",
      company: "Immersion Group",
      period: "2022 - Present",
      description: "Leading design innovation and AI implementation initiatives. Specializing in creating design solutions and empowering teams with AI-enhanced workflows."
    },
    {
      role: "Digital Designer",
      company: "Machete Creative",
      period: "2019 - 2021",
      description: "Created comprehensive digital solutions including UI designs, websites, and digital assets. Conducted user research and implemented design strategies for optimal user experience."
    },
    {
      role: "Visual Designer",
      company: "Freelance",
      period: "2014 - 2018",
      description: "Collaborated with diverse clients on branding, digital design, and web development projects. Managed end-to-end design processes from concept to implementation."
    },
    {
      role: "Senior Graphic Designer",
      company: "Musica & Clicks",
      period: "2009 - 2012",
      description: "Designed promotional campaigns and internal marketing material, including posters, banners, and catalogues. Managed a team of designers and copywriter while overseeing in-store point of sale materials."
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "About Me | Visual Designer & AI Enablement Specialist" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32"> <section class="mb-16 flex flex-col md:flex-row gap-12 items-start"> <div class="md:w-1/4"> ${renderComponent($$result2, "Image", $$Image, { "src": profileImage, "alt": "Nasif Salaam", "class": "rounded-2xl w-full max-w-[200px] shadow-lg border border-secondary" })} </div> <div class="md:w-3/4"> <h1 class="text-4xl font-bold mb-6 text-foreground">About Me</h1> <p class="text-xl text-muted-foreground mb-8">
I started my journey in visual design, developing a strong foundation in craft and user experience. As digital products became more complex, I evolved with the industry - expanding into product design, development, and AI-enabled solutions.
</p> <p class="text-xl text-muted-foreground mb-8">
Today, as a Product Designer, I combine design thinking with technical capabilities to help teams create meaningful digital products. I bridge the gap between vision and implementation, using modern tools and AI to enhance our ability to solve complex challenges. Whether I'm designing user interfaces, building design systems, or improving team workflows, I focus on creating solutions that make a real difference for users.
</p> <p class="text-xl text-muted-foreground">
What drives me is the opportunity to help teams innovate while maintaining focus on user needs. Through collaboration and knowledge sharing, I help create environments where design thinking and technical execution work together to produce exceptional products. This commitment to continuous learning and teaching others has become central to my approach to product design.
</p> </div> </section> <div class="w-full h-[2px] mb-16 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0"></div> <section class="mb-32"> <h2 class="text-2xl font-bold mb-8 text-foreground">Areas of Expertise</h2> <div class="grid md:grid-cols-2 gap-8"> ${expertise.map((item) => renderTemplate`<div class="p-6 rounded-xl bg-secondary/50 backdrop-blur-sm border border-secondary"> <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4"> <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <path${addAttribute(item.icon, "d")}></path> </svg> </div> <h3 class="text-xl font-semibold mb-3 text-foreground">${item.title}</h3> <p class="text-muted-foreground">${item.description}</p> </div>`)} </div> </section> <section class="mb-32"> <h2 class="text-2xl font-bold mb-8 text-foreground">Skills & Tools</h2> <div class="grid grid-cols-2 md:grid-cols-5 gap-8"> <div> <h3 class="text-lg font-semibold mb-4 text-foreground">Visual Design</h3> <ul class="space-y-2"> ${skills.design.map((skill) => renderTemplate`<li class="text-muted-foreground">${skill}</li>`)} </ul> </div> <div> <h3 class="text-lg font-semibold mb-4 text-foreground">Product Design</h3> <ul class="space-y-2"> ${skills.uiux.map((skill) => renderTemplate`<li class="text-muted-foreground">${skill}</li>`)} </ul> </div> <div> <h3 class="text-lg font-semibold mb-4 text-foreground">Visual Dev</h3> <ul class="space-y-2"> ${skills.visualDev.map((skill) => renderTemplate`<li class="text-muted-foreground">${skill}</li>`)} </ul> </div> <div> <h3 class="text-lg font-semibold mb-4 text-foreground">AI Integration</h3> <ul class="space-y-2"> ${skills.aiIntegration.map((skill) => renderTemplate`<li class="text-muted-foreground">${skill}</li>`)} </ul> </div> <div> <h3 class="text-lg font-semibold mb-4 text-foreground">Tools</h3> <ul class="space-y-2"> ${skills.tools.map((skill) => renderTemplate`<li class="text-muted-foreground">${skill}</li>`)} </ul> </div> </div> </section> <section class="mb-32"> <h2 class="text-2xl font-bold mb-6 text-foreground">Professional Journey</h2> <div class="space-y-8"> ${experience.map((item) => renderTemplate`<div class="border-l-2 border-primary/20 pl-6 relative"> <div class="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-2"></div> <h3 class="text-xl font-semibold text-foreground">${item.role}</h3> <p class="text-muted-foreground">${item.company} • ${item.period}</p> <p class="mt-2 text-muted-foreground">${item.description}</p> </div>`)} </div> </section> </div> ` })}`;
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/about.astro", void 0);

const $$file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$About,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
