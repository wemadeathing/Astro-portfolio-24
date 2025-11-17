import { n as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_BmSrm4w3.mjs';
import { a as $$ClickableImage, $ as $$ContactButton } from './ContactButton_B_YmR0B4.mjs';
import 'clsx';

const frontmatter = {
  "title": "Nexevo - AI Training Website",
  "description": "Built a modern AI training website for my business teaching practical AI skills, practicing what I preach by using AI tools to build efficiently.",
  "image": "/images/work/nexevo-website.jpeg",
  "tags": ["AI Training", "Business", "Booking System", "Content Management"],
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
    "slug": "workshop-services",
    "text": "Workshop Services"
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
      children: "Design and built an Astro website for my AI training business where I help people learn practical AI skills. Built the entire website using Cursor and Claude Code. The focus is on practical modern design and technical implementation using Astro and React islands."
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
          children: "Astro + React Islands"
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
          children: "Database:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Neon.tech"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Content:"
        }), createVNode("span", {
          class: "ml-2",
          children: "MDX"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Email:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Resend"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Development:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Cursor + Claude Code"
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
          children: "Market Education"
        }), createVNode("p", {
          class: "relative z-10",
          children: "People need practical AI skills, not just theoretical knowledge about what AI can do."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Personal Brand"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Establishing credibility in the AI training space while building my own expertise publicly."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Workshop Booking System"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Built a workshop booking system where users can book and receive a confirmation email."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Managing Workshop Bookings"
        }), createVNode("p", {
          class: "relative z-10",
          children: "By prompting Claude I am able to manage the Neon database with ease."
        })]
      })]
    }), createVNode(_components.h2, {
      id: "role--responsibilities",
      children: "Role & Responsibilities"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "Full-stack development and design"
      }), createVNode("li", {
        children: "Business strategy and positioning"
      }), createVNode("li", {
        children: "Brand design and development"
      }), createVNode("li", {
        children: "Email marketing and automation setup"
      })]
    }), createVNode(_components.h2, {
      id: "key-features",
      children: "Key Features"
    }), createVNode(_components.h3, {
      id: "workshop-services",
      children: "Workshop Services"
    }), createVNode(_components.p, {
      children: "Modern responsive design and booking system:"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "User Experience - Clean, focused interface that prioritizes navigation over flashy features"
      }), createVNode("li", {
        children: "Practical Focus - Content emphasizes real-world application rather than theoretical AI concepts"
      }), createVNode("li", {
        children: "Modern Architecture - Astro with React islands for optimal performance and developer experience"
      }), createVNode("li", {
        children: "Database Management - Neon DB for managing workshops and registrations"
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
          children: "Active Business"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Successfully launched with ongoing participant enrollment and positive feedback on practical approach."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Technical Demonstration"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Platform itself demonstrates the quality possible when using AI tools effectively for development."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Content Flexibility"
        }), createVNode("p", {
          class: "relative z-10",
          children: "MDX-based content system allows rapid updates and interactive workshop information."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Professional Growth"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Established credibility in AI education while expanding full-stack development skills."
        })]
      })]
    }), createVNode($$ClickableImage, {
      src: "/images/work/nexevo-website-1.png",
      alt: "Nexevo Website Course Page",
      caption: "Course page view"
    }), createVNode($$ClickableImage, {
      src: "/images/work/nexevo-website-3.png",
      alt: "Nexevo Website Dashboard",
      caption: "Workshop registration page"
    }), createVNode(_components.h2, {
      id: "key-learnings",
      children: "Key Learnings"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "Building your own business provides deep insights into user needs"
      }), createVNode("li", {
        children: "AI tools can significantly accelerate development without sacrificing quality"
      }), createVNode("li", {
        children: "MDX is excellent for educational content that requires interactive examples"
      }), createVNode("li", {
        children: "Modern development tools enable solo entrepreneurs to build rapidly"
      }), createVNode("li", {
        children: "Teaching while learning accelerates your own skill development"
      })]
    }), createVNode(_components.p, {
      children: [createVNode(_components.strong, {
        children: "Timeline:"
      }), " 1 month", createVNode(_components.br, {}), "\n", createVNode(_components.strong, {
        children: "Status:"
      }), " Active business with ongoing participant enrollment"]
    }), createVNode("div", {
      class: "not-prose mt-8",
      children: createVNode($$ContactButton, {
        href: "https://www.nexevo.io/",
        text: "Visit Nexevo",
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
const url = "src/content/projects/ai-training-business-website.mdx";
const file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/ai-training-business-website.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/ai-training-business-website.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
