import { n as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_D7IckMtV.mjs';
import { $ as $$ClickableImage, a as $$ContactButton } from './ContactButton_CE2B8DGL.mjs';
import 'clsx';

const frontmatter = {
  "title": "Enterprise Design System",
  "description": "Created a comprehensive design system for a South African financial institution, enabling consistent user experiences.",
  "image": "/images/card 01 - design.jpg",
  "tags": ["Design Systems", "UI Design", "Documentation", "Financial Services"],
  "published": true
};
function getHeadings() {
  return [{
    "depth": 2,
    "slug": "project-overview",
    "text": "Project Overview"
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
    "slug": "process--approach",
    "text": "Process & Approach"
  }, {
    "depth": 3,
    "slug": "foundation-building",
    "text": "Foundation Building"
  }, {
    "depth": 3,
    "slug": "component-development",
    "text": "Component Development"
  }, {
    "depth": 3,
    "slug": "platform-adaptation",
    "text": "Platform Adaptation"
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
    h2: "h2",
    h3: "h3",
    li: "li",
    p: "p",
    ul: "ul",
    ...props.components
  };
  return createVNode("div", {
    class: "prose prose-lg max-w-none",
    children: [createVNode(_components.h2, {
      id: "project-overview",
      children: "Project Overview"
    }), createVNode(_components.p, {
      children: "A South African financial institution needed a comprehensive design system to ensure consistency across their digital products while enabling rapid development and scaling. As Senior UI Designer, I architected and implemented a system that balanced brand consistency with platform-specific needs."
    }), createVNode("div", {
      class: "flex items-center p-4 mb-6 text-sm rounded-lg bg-blue-50 text-blue-800 border border-blue-300",
      children: [createVNode("svg", {
        class: "flex-shrink-0 inline w-4 h-4 mr-3",
        "aria-hidden": "true",
        xmlns: "http://www.w3.org/2000/svg",
        fill: "currentColor",
        viewBox: "0 0 20 20",
        children: createVNode("path", {
          d: "M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
        })
      }), createVNode("span", {
        children: "This is an NDA-protected project. The processes described are real, but visuals are representative."
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
          children: "Multiple Products"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Different digital products with unique requirements needed a unified design language while maintaining flexibility for specific needs."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Platform Diversity"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Web, mobile, and secure platforms each required specific adaptations while maintaining brand consistency and user experience."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Scale & Speed"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Rapid development needs required efficient, scalable design solutions without compromising quality or consistency."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Team Distribution"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Teams across different departments and functions needed a unified design system to ensure consistency and collaboration."
        })]
      })]
    }), createVNode(_components.h2, {
      id: "role--responsibilities",
      children: "Role & Responsibilities"
    }), createVNode("ul", {
      children: [createVNode("li", {
        children: "Led design system architecture and implementation"
      }), createVNode("li", {
        children: "Created and maintained component libraries"
      }), createVNode("li", {
        children: "Developed comprehensive documentation"
      }), createVNode("li", {
        children: "Supported development teams"
      }), createVNode("li", {
        children: "Collaborated with devepoers to ensure alignment"
      }), createVNode("li", {
        children: "Established design standards and guidelines"
      })]
    }), createVNode(_components.h2, {
      id: "process--approach",
      children: "Process & Approach"
    }), createVNode(_components.h3, {
      id: "foundation-building",
      children: "Foundation Building"
    }), createVNode(_components.p, {
      children: "The foundation of our design system was built on proven methodologies and best practices:"
    }), createVNode("ul", {
      children: [createVNode("li", {
        children: "Atomic Design Methodology: Implemented a scalable architecture using atoms, molecules, and organisms"
      }), createVNode("li", {
        children: "Design Tokens: Created a comprehensive set of tokens for colors, typography and spacing"
      }), createVNode("li", {
        children: "Base Components: Developed core components that serve as building blocks for more complex patterns"
      }), createVNode("li", {
        children: "Documentation Standards: Established clear naming conventions and documentation requirements"
      })]
    }), createVNode($$ClickableImage, {
      src: "/images/card 03 - base components.jpg",
      alt: "Design Process Phases",
      caption: "Key phases of the design process"
    }), createVNode(_components.h3, {
      id: "component-development",
      children: "Component Development"
    }), createVNode(_components.p, {
      children: "Our component development process focused on creating a versatile and maintainable library:"
    }), createVNode("ul", {
      children: [createVNode("li", {
        children: "Reusable Components - Built an extensive library of components"
      }), createVNode("li", {
        children: "Responsive Design - Created flexible layouts that adapt seamlessly to different screen sizes"
      }), createVNode("li", {
        children: "Scalability - Built a system that can be easily extended or modified"
      })]
    }), createVNode($$ClickableImage, {
      src: "/images/card 02 - structure.jpg",
      alt: "Design Process Phases",
      caption: "Key phases of the design process"
    }), createVNode(_components.h3, {
      id: "platform-adaptation",
      children: "Platform Adaptation"
    }), createVNode(_components.p, {
      children: "We carefully adapted the system for different platforms while maintaining consistency:"
    }), createVNode("ul", {
      children: [createVNode("li", {
        children: "Mobile & Flutter - Adapted designs to better suit the Flutter framework"
      }), createVNode("li", {
        children: "Notification Framework - Deveoped a Notification Framework to guide cross-functional teams"
      }), createVNode("li", {
        children: "Flexibility - Core aspects of the system were designed for different platforms"
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
          children: "Unified Design"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Achieved consistent brand experience across all digital platforms, resulting in improved brand recognition and trust."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Development Speed"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Faster implementation of new features through standardized components and clear documentation."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Quality Improvement"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Reduction in design time through pre-built components and clear documentation."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Team Efficiency"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Significantly improved collaboration and reduced decision-making time across distributed teams."
        })]
      })]
    }), createVNode(_components.h2, {
      id: "key-learnings",
      children: "Key Learnings"
    }), createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Early developer collaboration is crucial for successful implementation"
      }), "\n", createVNode(_components.li, {
        children: "Systematic documentation is as important as the design itself"
      }), "\n", createVNode(_components.li, {
        children: "Regular feedback loops ensure system relevance and adoption"
      }), "\n", createVNode(_components.li, {
        children: "Balance between flexibility and consistency is key"
      }), "\n", createVNode(_components.li, {
        children: "Insights into development frameworks are invaluable"
      }), "\n", createVNode(_components.li, {
        children: "Leverage leading design systems and trends as a foundation for system design"
      }), "\n"]
    }), createVNode("div", {
      class: "not-prose mt-8",
      children: createVNode($$ContactButton, {})
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
const url = "src/content/projects/enterprise-design-system.mdx";
const file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/enterprise-design-system.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/enterprise-design-system.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
