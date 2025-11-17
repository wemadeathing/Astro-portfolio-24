import { n as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_BmSrm4w3.mjs';
import { a as $$ClickableImage, $ as $$ContactButton } from './ContactButton_B_YmR0B4.mjs';
import 'clsx';

const frontmatter = {
  "title": "Ecos Consulting - Environmental Solutions Website",
  "description": "Built a professional B2B website for an environmental consulting firm using Astro for better performance and SEO than traditional WordPress solutions.",
  "image": "/images/work/ECOS Consulting _ Safety_ Health _ Environment.jpeg",
  "tags": ["Client Work", "B2B", "Environmental", "Astro"],
  "published": true
};
function getHeadings() {
  return [{
    "depth": 2,
    "slug": "project-overview",
    "text": "Project Overview"
  }, {
    "depth": 2,
    "slug": "tools--technologies",
    "text": "Tools & Technologies"
  }, {
    "depth": 2,
    "slug": "the-challenge",
    "text": "The Challenge"
  }, {
    "depth": 2,
    "slug": "role--responsibilities",
    "text": "Role & Responsibilities"
  }, {
    "depth": 2,
    "slug": "key-features",
    "text": "Key Features"
  }, {
    "depth": 3,
    "slug": "professional-b2b-website",
    "text": "Professional B2B Website"
  }, {
    "depth": 2,
    "slug": "results--impact",
    "text": "Results & Impact"
  }, {
    "depth": 2,
    "slug": "key-learnings",
    "text": "Key Learnings"
  }];
}
function _createMdxContent(props) {
  const _components = {
    br: "br",
    h2: "h2",
    h3: "h3",
    p: "p",
    strong: "strong",
    ...props.components
  };
  return createVNode("div", {
    class: "prose prose-lg max-w-none",
    children: [createVNode(_components.h2, {
      id: "project-overview",
      children: "Project Overview"
    }), createVNode(_components.p, {
      children: "A client project where I built their entire web presence from scratch. I could have used WordPress, but chose Astro to give them better performance, SEO, and more customization options while also expanding my own skills with the framework. The client needed to establish credibility in the environmental consulting space with a professional, trustworthy presence that would perform well in search results."
    }), createVNode(_components.h2, {
      id: "tools--technologies",
      children: "Tools & Technologies"
    }), createVNode("div", {
      class: "flex flex-wrap gap-4 my-6",
      children: [createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Framework:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Astro"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Styling:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Tailwind CSS"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "CMS:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Keystatic"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Development:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Windsurf"
        })]
      })]
    }), createVNode(_components.h2, {
      id: "the-challenge",
      children: "The Challenge"
    }), createVNode("div", {
      class: "grid grid-cols-1 sm:grid-cols-2 gap-6 my-8",
      children: [createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Client Credibility"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Environmental consulting requires high trust - needed a professional website that establishes expertise and reliability."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Performance Requirements"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Needed fast loading times and excellent SEO performance for industry-specific search terms."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Content Management"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Client needed easy content updates for team information, projects, and industry insights."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Technical Advancement"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Wanted to deliver modern tech while learning Astro framework for future projects."
        })]
      })]
    }), createVNode(_components.h2, {
      id: "role--responsibilities",
      children: "Role & Responsibilities"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "Full website design and development"
      }), createVNode("li", {
        children: "Content architecture and information design"
      }), createVNode("li", {
        children: "SEO optimization and performance tuning"
      }), createVNode("li", {
        children: "CMS setup and client training"
      }), createVNode("li", {
        children: "Responsive design across all devices"
      }), createVNode("li", {
        children: "Project management and client communication"
      })]
    }), createVNode(_components.h2, {
      id: "key-features",
      children: "Key Features"
    }), createVNode(_components.h3, {
      id: "professional-b2b-website",
      children: "Professional B2B Website"
    }), createVNode(_components.p, {
      children: "A modern, trustworthy website built with performance and maintainability in mind:"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "Clean Professional Design - Establishes trust and credibility in the environmental consulting industry"
      }), createVNode("li", {
        children: "Performance Optimized - Built with Astro for exceptional loading speeds and Core Web Vitals scores"
      }), createVNode("li", {
        children: "SEO Foundation - Structured for excellent search engine performance with industry-specific optimization"
      }), createVNode("li", {
        children: "Content Management - Keystatic CMS allows easy updates to team, projects, and service information"
      }), createVNode("li", {
        children: "Responsive Experience - Optimized for all devices with particular attention to mobile professionals"
      }), createVNode("li", {
        children: "Service Showcases - Clear presentation of environmental and safety solutions across industries"
      })]
    }), createVNode(_components.h2, {
      id: "results--impact",
      children: "Results & Impact"
    }), createVNode("div", {
      class: "grid grid-cols-1 sm:grid-cols-2 gap-6 my-8",
      children: [createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Client Satisfaction"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Delivered a professional web presence that exceeds their expectations and industry standards."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Performance Excellence"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Astro delivered superior loading speeds and SEO performance compared to typical WordPress sites."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Technical Growth"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Used Astro framework and Keystatic CMS, expanding toolkit for future client projects."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Easy Maintenance"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Client can easily update content through Keystatic without needing developer assistance."
        })]
      })]
    }), createVNode($$ClickableImage, {
      src: "/images/work/ecos-consulting-website-1.png",
      alt: "Ecos Consulting Website Services",
      caption: "Services page view"
    }), createVNode(_components.h2, {
      id: "key-learnings",
      children: "Key Learnings"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "Astro is excellent for client projects requiring performance and SEO optimization"
      }), createVNode("li", {
        children: "Modern frameworks can deliver better results than traditional CMS solutions"
      }), createVNode("li", {
        children: "Client education about content management is crucial for long-term success"
      }), createVNode("li", {
        children: "Professional B2B sites require different considerations than consumer applications"
      }), createVNode("li", {
        children: "Learning new technologies while delivering client work accelerates skill development"
      }), createVNode("li", {
        children: "Performance gains from modern tooling create real business value for clients"
      })]
    }), createVNode(_components.p, {
      children: [createVNode(_components.strong, {
        children: "Timeline:"
      }), " 1 month", createVNode(_components.br, {}), "\n", createVNode(_components.strong, {
        children: "Status:"
      }), " Live and performing well for client"]
    }), createVNode("div", {
      class: "not-prose mt-8",
      children: createVNode($$ContactButton, {
        href: "https://www.ecos-consulting.co.za/",
        text: "Visit Ecos Consulting",
        external: true
      })
    })]
  });
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? createVNode(MDXLayout, {
    ...props,
    children: createVNode(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}
const url = "src/content/projects/consulting-website.mdx";
const file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/consulting-website.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/consulting-website.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
