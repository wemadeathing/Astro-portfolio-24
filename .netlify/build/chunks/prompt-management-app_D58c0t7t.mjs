import { n as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_D7IckMtV.mjs';
import { $ as $$ClickableImage, a as $$ContactButton } from './ContactButton_CE2B8DGL.mjs';
import 'clsx';

const frontmatter = {
  "title": "EverPrompt - AI Prompt Management",
  "description": "Design and built an AI prompt management platform with AI capabilities to solve my own prompt organization challenges.",
  "image": "/images/work/Everprompt - AI Prompt Management Made Simple.jpeg",
  "tags": ["AI Tools", "SaaS", "Learning Project"],
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
    "slug": "core-platform",
    "text": "Core Platform"
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
      children: "I was struggling to keep track of my AI prompts and wanted to get better at working in the AI space, so I decided to build something that could help both me and others. This became part of my broader effort to establish thought leadership in AI. I’ll admit the product-market fit isn’t perfect yet, but the real value has been in the learning and building process."
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
          children: "DaisyUI"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Backend:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Supabase + Strapi CMS"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "AI:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Claude API"
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
          children: "Personal Pain Point"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Losing valuable prompts in endless chat histories and having to recreate them constantly."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Learning Opportunity"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Wanted to understand AI integration and prompt management better while building in public."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Market Gap"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Existing solutions felt clunky or incomplete for power users who work with AI daily."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Technical Challenge"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Building a Chrome extension that seamlessly integrates with a web platform and AI capabilities."
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
        children: "Chrome extension development"
      }), createVNode("li", {
        children: "AI integration with Claude API"
      }), createVNode("li", {
        children: "Database design and backend architecture"
      }), createVNode("li", {
        children: "User interface and experience design"
      }), createVNode("li", {
        children: "Content management system setup"
      })]
    }), createVNode(_components.h2, {
      id: "key-features",
      children: "Key Features"
    }), createVNode(_components.h3, {
      id: "core-platform",
      children: "Core Platform"
    }), createVNode(_components.p, {
      children: "Built the entire platform using modern tools while learning new technologies:"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "Prompt Library - Organize and categorize AI prompts with auto-tagging and search functionality"
      }), createVNode("li", {
        children: "Chrome Extension - Seamlessly save prompts from any AI chat interface directly to your library"
      }), createVNode("li", {
        children: "AI-Powered Features - Built-in AI capabilities using Claude API for prompt optimization and suggestions"
      }), createVNode("li", {
        children: "Template Builder - Create reusable prompt templates with variable placeholders for different use cases"
      }), createVNode("li", {
        children: "Email Integration - Automated notifications and sharing capabilities using Resend"
      }), createVNode("li", {
        children: "Content Management - Easy content updates through Strapi CMS integration"
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
          children: "Personal Learning"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Mastered Astro framework, React islands architecture, and Chrome extension development in one project."
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
          children: "Successfully integrated multiple APIs (Claude, Supabase, Resend) into a cohesive platform."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "User Feedback"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Currently gathering feedback from early users to refine product-market fit and feature priorities."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "AI Leadership"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Established credibility in AI tooling space through building and sharing the development process."
        })]
      })]
    }), createVNode($$ClickableImage, {
      src: "/images/work/everprompt-app2.png",
      alt: "EverPrompt App Prompt Library",
      caption: "Prompt library view"
    }), createVNode($$ClickableImage, {
      src: "/images/work/everprompt-app3.png",
      alt: "EverPrompt App Chrome Extension",
      caption: "Chrome extension interface"
    }), createVNode(_components.h2, {
      id: "key-learnings",
      children: "Key Learnings"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "Building while learning accelerates skill development more than theoretical study"
      }), createVNode("li", {
        children: "Chrome extensions require careful consideration of permissions and user privacy"
      }), createVNode("li", {
        children: "AI integrations work best when they enhance rather than replace user workflows"
      }), createVNode("li", {
        children: "Product-market fit takes time - building is just the first step"
      }), createVNode("li", {
        children: "Modern development tools enable rapid prototyping without sacrificing quality"
      }), createVNode("li", {
        children: "Learning in public creates opportunities for feedback and community building"
      })]
    }), createVNode(_components.p, {
      children: [createVNode(_components.strong, {
        children: "Timeline:"
      }), " 1 month", createVNode(_components.br, {}), "\n", createVNode(_components.strong, {
        children: "Status:"
      }), " Live platform actively seeking user feedback and iteration"]
    }), createVNode("div", {
      class: "not-prose mt-8",
      children: createVNode($$ContactButton, {
        href: "https://www.everprompt.co.za",
        text: "Visit EverPrompt",
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
const url = "src/content/projects/prompt-management-app.mdx";
const file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/prompt-management-app.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/prompt-management-app.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
