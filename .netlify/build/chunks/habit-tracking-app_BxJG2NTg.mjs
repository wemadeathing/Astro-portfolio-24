import { n as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_BmSrm4w3.mjs';
import { a as $$ClickableImage, $ as $$ContactButton } from './ContactButton_B_YmR0B4.mjs';
import 'clsx';

const frontmatter = {
  "title": "Ripple - Personal Productivity Tracker",
  "description": "Built a time tracking and habit building app for my own coding projects, designed around how I actually work rather than theoretical productivity systems.",
  "image": "/images/work/Ripple.jpeg",
  "tags": ["Productivity", "Personal Tool", "React", "Time Tracking"],
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
    "slug": "productivity-tools",
    "text": "Productivity Tools"
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
      children: "I needed a better way to track my coding projects and build better habits, but existing time trackers didn’t fit how I work on creative projects. I started building this in Bolt for rapid prototyping, then moved it into Cursor when I wanted more control. It’s designed around how I actually work, not some theoretical productivity system, and I use it daily to track my own development work."
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
          children: "React"
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
          children: "Backend:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Supabase"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Auth:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Supabase Auth"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Prototyping:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Bolt.new"
        })]
      }), createVNode("div", {
        class: "inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm",
        children: [createVNode("span", {
          class: "font-medium",
          children: "Development:"
        }), createVNode("span", {
          class: "ml-2",
          children: "Cursor"
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
          children: "Personal Need"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Existing time trackers didn’t fit how I work on creative and development projects with varying intensity."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Learning Goal"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Wanted to practice building with modern React patterns and real-time data synchronization."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Habit Building"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Needed something that would help me understand my work patterns and build better development habits."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Rapid Development"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Wanted to build and iterate quickly to test the concept before committing to extensive development."
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
        children: "User experience design based on personal workflows"
      }), createVNode("li", {
        children: "Real-time data architecture with Supabase"
      }), createVNode("li", {
        children: "Analytics and insights implementation"
      }), createVNode("li", {
        children: "Mobile-responsive interface design"
      }), createVNode("li", {
        children: "Personal user testing and iteration"
      })]
    }), createVNode(_components.h2, {
      id: "key-features",
      children: "Key Features"
    }), createVNode(_components.h3, {
      id: "productivity-tools",
      children: "Productivity Tools"
    }), createVNode(_components.p, {
      children: "A clean, intuitive app that adapts to how I actually work on projects:"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "Focus Sessions - Intuitive time tracking that doesn’t force rigid time blocks but adapts to natural work flows"
      }), createVNode("li", {
        children: "Project Analytics - Visual insights into productivity patterns across different types of coding and design work"
      }), createVNode("li", {
        children: "Habit Tracking - Simple habit building tools that track consistency without being overwhelming"
      }), createVNode("li", {
        children: "Activity Overview - Daily and weekly views that show actual work patterns rather than idealized schedules"
      }), createVNode("li", {
        children: "Real-time Sync - All data syncs instantly across devices using Supabase real-time capabilities"
      }), createVNode("li", {
        children: "Clean Interface - Minimal design that stays out of the way during focused work sessions"
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
          children: "Daily Usage"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Using it daily for all coding projects - it’s become an essential part of my development workflow."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Rapid Development"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Built the entire app in one week using Bolt for prototyping then Cursor for refinement."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Work Insights"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Gained valuable insights into my actual productivity patterns and peak coding hours."
        })]
      }), createVNode("div", {
        class: "relative overflow-hidden rounded-xl bg-card p-6 border border-primary/40",
        children: [createVNode("div", {
          class: "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        }), createVNode("h3", {
          class: "text-lg font-semibold mb-3 relative z-10",
          children: "Technical Learning"
        }), createVNode("p", {
          class: "relative z-10",
          children: "Improved skills with React state management and real-time data synchronization patterns."
        })]
      })]
    }), createVNode($$ClickableImage, {
      src: "/images/work/ripple-app-3.png",
      alt: "Ripple App Habit Tracker",
      caption: "Habit tracker interface"
    }), createVNode(_components.h2, {
      id: "key-learnings",
      children: "Key Learnings"
    }), createVNode("ul", {
      class: "list-none space-y-3 [&>li]:before:content-['•'] [&>li]:before:text-purple-600 [&>li]:before:mr-2 [&>li]:flex",
      children: [createVNode("li", {
        children: "Building tools for yourself ensures they solve real problems you actually face"
      }), createVNode("li", {
        children: "Rapid prototyping with Bolt then moving to Cursor is an effective development workflow"
      }), createVNode("li", {
        children: "Personal productivity apps work best when they adapt to natural work patterns"
      }), createVNode("li", {
        children: "Real-time sync is essential for tools you use across multiple devices"
      }), createVNode("li", {
        children: "Simple, clean interfaces are more effective than feature-heavy dashboards"
      }), createVNode("li", {
        children: "Using your own tools daily provides the best feedback for iteration"
      })]
    }), createVNode(_components.p, {
      children: [createVNode(_components.strong, {
        children: "Timeline:"
      }), " 1 week", createVNode(_components.br, {}), "\n", createVNode(_components.strong, {
        children: "Status:"
      }), " Personal daily use, not heavily promoted yet"]
    }), createVNode("div", {
      class: "not-prose mt-8",
      children: createVNode($$ContactButton, {
        href: "https://rippleapp.netlify.app/",
        text: "Visit Ripple App",
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
const url = "src/content/projects/habit-tracking-app.mdx";
const file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/habit-tracking-app.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/content/projects/habit-tracking-app.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
