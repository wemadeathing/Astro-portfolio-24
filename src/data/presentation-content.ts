// Presentation Content Data Structure

export const presentationData = {
  // Foundation Section
  foundation: {
    whoIAm: {
      name: "Nasif Salaam",
      title: "Product Designer who builds",
      descriptors: [
        "15+ years experience",
        "Designer who codes",
        "AI-accelerated workflows",
        "Execution-focused"
      ],
      image: "/images/NS-profile-2.png"
    },
    superpower: {
      statement: "I bridge design & development",
      description: "Understanding technical constraints and speaking the language of engineering teams while shipping production-ready solutions.",
      cards: [
        {
          title: "Design",
          description: "Clarify the problem, map the flows, and create high-signal UI that respects constraints.",
          image: "/images/abstract/Frame 120823.png",
          icon: "design"
        },
        {
          title: "Build",
          description: "Prototype with real data and real edges so decisions are made on reality, not assumptions.",
          image: "/images/abstract/Frame 120824.png",
          icon: "build"
        },
        {
          title: "Ship",
          description: "Deliver production-ready work and help teams keep momentum through clean handoffs and systems.",
          image: "/images/abstract/Frame 120825.png",
          icon: "ship"
        }
      ]
    },
    capabilities: [
      {
        title: "AI-Accelerated Development",
        description: "Ship functional products with AI integration using modern frameworks",
        icon: "code"
      },
      {
        title: "Design Systems",
        description: "Build scalable component libraries and design tokens for consistency",
        icon: "layers"
      },
      {
        title: "Product Design",
        description: "End-to-end product design from research to launch",
        icon: "zap"
      },
      {
        title: "Rapid Prototyping",
        description: "Build functional prototypes with real databases and APIs quickly",
        icon: "rocket"
      },
      {
        title: "Team Leadership",
        description: "Led teams of 3-7 designers with focus on upskilling and initiative",
        icon: "users"
      },
      {
        title: "Technical Fluency",
        description: "Understand databases, APIs, and developer constraints deeply",
        icon: "database"
      }
    ],
    methodology: {
      title: "How I Solve Problems",
      approach: "Execution-Focused Design Process",
      stages: [
        {
          name: "Understand",
          description: "Research constraints early - what's technically possible, what the business needs, and what users actually want",
          icon: "search"
        },
        {
          name: "Define",
          description: "Define clear scope based on reality, not wishful thinking. What can we actually build?",
          icon: "target"
        },
        {
          name: "Design",
          description: "Design solutions that work within technical constraints. Beautiful AND buildable.",
          icon: "pen-tool"
        },
        {
          name: "Build",
          description: "Build functional prototypes with AI tools OR collaborate closely with dev teams to ship designs accurately",
          icon: "hammer"
        },
        {
          name: "Ship",
          description: "Launch, learn, and iterate. Design continues after deployment.",
          icon: "send"
        }
      ]
    }
  },

  // Case Studies
  caseStudies: {
    bankingSuite: {
      title: "Banking Suite",
      subtitle: "Cross-platform banking experience",
      context: {
        client: "Major South African Bank",
        role: "Lead UI Designer",
        duration: "2022-2024",
        challenge:
          "Modernize core banking journeys across public web, secure platforms, and mobile while working within enterprise constraints, legacy integration, and strict compliance."
      },
      scope: [
        "Cross-platform UI patterns for key banking flows",
        "End-to-end journeys (onboarding, account management, dashboards)",
        "Consistency across multiple systems and user types"
      ],
      approach: {
        steps: [
          {
            phase: "Discovery",
            description:
              "Evaluated existing brand and UI across platforms to identify inconsistencies and opportunities for improvement.",
            deliverables: ["Desktop research", "Competitor analysis", "Brand + UI audits"]
          },
          {
            phase: "Design",
            description:
              "Led creative direction, updating brand identity and designing high-fidelity UI across mobile, web, and dashboard.",
            deliverables: ["Concept designs", "Illustrations + icons", "Hi-fi prototypes"],
            images: [
              "/images/presentation/banking-suite/banking-suite-delivery-1.png",
              "/images/presentation/banking-suite/banking-suite-design-1.png",
              "/images/presentation/banking-suite/banking-suite-refine-1.png"
            ]
          },
          {
            phase: "Delivery",
            description:
              "Collaborated with UX designers and engineers through agile sprints to ship designs within technical constraints.",
            deliverables: ["Dev handoff", "Design QA", "Iteration cycles"],
            images: [
              "/images/presentation/banking-suite/banking-suite-design-1.png",
              "/images/presentation/banking-suite/banking-suite-delivery-1.png",
              "/images/presentation/banking-suite/banking-suite-solution-1.png"
            ]
          },
          {
            phase: "Refine",
            description:
              "Partnered with QA to identify and resolve UI bugs through systematic audits and polish passes.",
            deliverables: ["Bug fixes", "Polish pass", "Consistency audits"]
          }
        ]
      },
      solution: {
        features: [
          "Clear, modern UI patterns across web, secure platforms, and mobile",
          "Streamlined onboarding and verification flows",
          "Account and transaction experiences with strong hierarchy and trust cues",
          "Reusable workflow patterns for complex forms and approvals",
          "Design decisions grounded in technical constraints and implementation reality"
        ],
        tech: ["Figma", "Cross-platform UX", "Enterprise Constraints", "Flow Design", "Dev Collaboration"]
      },
      overview: [
        "Shipped cross-platform banking experiences across public web, secure platforms, and delivered mobile designs with modern UI patterns. The focus was clarity and trust: stronger hierarchy, repeatable workflow patterns, and streamlined journeys for everyday tasks.",
        "Delivery stayed grounded in implementation reality through tight collaboration with engineering, design QA, and iteration on edge cases where legacy systems typically create friction."
      ],
      impact: {
        metrics: [
          {
            value: "3",
            label: "Platforms",
            description: "Public, Secure, Mobile"
          },
          {
            value: "Fewer",
            label: "Inconsistencies",
            description: "Standardized patterns"
          },
          {
            value: "Clearer",
            label: "Journeys",
            description: "Reduced friction"
          },
          {
            value: "Aligned",
            label: "Delivery",
            description: "Design + engineering"
          }
        ]
      },
      images: [
        "/images/presentation/banking-suite/banking-suite-discovery-1.png",
        "/images/presentation/banking-suite/banking-suite-design-1.png",
        "/images/presentation/banking-suite/banking-suite-delivery-1.png",
        "/images/presentation/banking-suite/banking-suite-refine-1.png",
        "/images/presentation/banking-suite/banking-suite-solution-1.png"
      ],
      solutionImage: "/images/presentation/banking-suite/banking-suite-solution-1.png"
    },

    designSystem: {
      title: "Design System",
      subtitle: "Enterprise component library",
      context: {
        client: "Major South African Bank",
        role: "Senior UI Designer (Design System Lead)",
        duration: "2022-2024",
        challenge:
          "Create a scalable design system that keeps multiple products consistent while enabling teams to ship faster across web and mobile."
      },
      scope: [
        "Reusable components and tokens for long-term consistency",
        "Guidelines and documentation for adoption across teams",
        "Platform adaptations across web and mobile frameworks"
      ],
      approach: {
        steps: [
          {
            phase: "Research",
            description: "Defined the token layer and system architecture to support scale and theming.",
            deliverables: ["Design tokens", "Naming conventions", "System architecture"],
            images: ["/images/presentation/banking-suite-competitor.png"]
          },
          {
            phase: "Components",
            description: "Built a reusable component library with patterns for complex workflows and scale.",
            deliverables: ["Component library", "Atomic Structure", "States and variants"],
            images: ["/images/presentation/components.png"]
          },
          {
            phase: "Documentation",
            description: "Created usage guidance so teams could implement consistently without heavy oversight.",
            deliverables: ["Usage guidelines", "Examples", "Handoff notes"],
            images: ["/images/presentation/documentation.png"]
          },
          {
            phase: "Adoption",
            description: "Aligned with engineering on implementation and kept refining with regular feedback.",
            deliverables: ["Dev alignment", "Design QA", "Continuous feedback"],
            images: ["/images/presentation/design-system-components.png"]
          }
        ]
      },
      solution: {
        features: [
          "Atomic design system with 50+ reusable components",
          "Design tokens for colors, typography, and spacing",
          "Platform-specific adaptations (React for web, Flutter for mobile)",
          "Comprehensive documentation and usage guidelines",
          "Cross-functional collaboration framework"
        ],
        tech: ["Figma", "Customer CMS", "Flutter", "Atomic Design", "Design Tokens"]
      },
      overview: [
        "Built a production design system that could scale across multiple products without slowing teams down. Tokens, component standards, and clear usage guidance reduced drift and made implementation more predictable.",
        "The system was designed for real constraints: UI patterns, platform differences, and multiple teams shipping in parallel. Kept aligned through dev collaboration, QA, and key stakeholders."
      ],
      impact: {
        metrics: [
          {
            value: "50+",
            label: "Components",
            description: "Reusable building blocks"
          },
          {
            value: "3",
            label: "Surfaces",
            description: "Public, Secure, Mobile"
          },
          {
            value: "Faster",
            label: "Delivery",
            description: "Less rework and drift"
          },
          {
            value: "Consistent",
            label: "Experience",
            description: "Across products"
          }
        ]
      },
      images: [
        "/images/presentation/design-system-components.png",
        "/images/card 01 - design.jpg",
        "/images/card 02 - structure.jpg",
        "/images/card 03 - base components.jpg",
        "/images/fintech-components.png",
        "/images/fintech-ui-design.png"
      ]
    },

    designCommunity: {
      title: "Rapid Innovation Projects",
      subtitle: "Self-Initiated Team Innovation",
      context: {
        client: "Immersion Group (Internal Innovation)",
        role: "Project Lead & Technical Builder",
        duration: "2024",
        challenge:
          "Transform downtime into strategic value by upskilling 6-7 designers while building functional MVPs for real client problems."
      },
      scope: [
        "Run a real product process with a rotating team in a consulting environment",
        "Build a functional MVP with authentication, database, and AI integration",
        "Test with designers and iterate based on evidence"
      ],
      approach: {
        steps: [
          {
            phase: "Research",
            description: "Distributed research across team based on strengths",
            deliverables: ["Competitor analysis", "User interviews", "Information architecture"],
            images: ["/images/ri-ideation.png", "/images/ri-information-architecture.png"]
          },
          {
            phase: "Design",
            description: "Adapted Google Design Sprint methodology to consulting context",
            deliverables: ["Wireframes", "UI designs", "User flows"],
            images: ["/images/ri-wireframes.png", "/images/ri-ui-design.png"]
          },
          {
            phase: "Build",
            description: "Built functional MVPs using FlutterFlow, Supabase, and AI integration",
            deliverables: ["Working prototypes", "Database schema", "API integrations"],
            images: ["/images/ri-flutterflow.png", "/images/ri-feature.png"]
          },
          {
            phase: "Test",
            description: "User tested with real users, discovered key insights",
            deliverables: ["Testing insights", "Product pivots", "Feature validation"],
            images: ["/images/ri-testing.png", "/images/ri-feature-new.png"]
          }
        ]
      },
      solution: {
        features: [
          "Onboarding assessment for skill gap identification",
          "Designer matching system with complementary skills",
          "Social feed for sharing design work",
          "Chat functionality for designer-to-designer communication",
          "AI assistant trained on design thinking methodology"
        ],
        tech: ["FlutterFlow", "Supabase", "Buildship", "OpenAI API", "Google Design Sprint"]
      },
      overview: [
        "Ran a self-initiated innovation program that turned downtime into strategic value by upskilling a team while shipping functional MVPs. We built for real client problems: credible concepts with actual product process, not slide decks.",
        "Delivery doubled as training: distributed research, fast iteration, and hands-on build experience (FlutterFlow, Supabase, AI integration) to stretch designers across the full lifecycle."
      ],
      impact: {
        metrics: [
          {
            value: "6-7",
            label: "Team Members",
            description: "Upskilled across full lifecycle"
          },
          {
            value: "Functional",
            label: "MVPs Delivered",
            description: "With real databases and APIs"
          },
          {
            value: "10+",
            label: "Users Tested",
            description: "Validated concepts and pivots"
          },
          {
            value: "New",
            label: "Service Offering",
            description: "Rapid prototyping capability"
          }
        ]
      },
      images: [
        "/images/ri-feature-new.png",
        "/images/ri-feature.png",
        "/images/ri-ideation.png",
        "/images/ri-information-architecture.png",
        "/images/ri-wireframes.png",
        "/images/ri-ui-design.png",
        "/images/ri-flutterflow.png",
        "/images/ri-testing.png"
      ]
    }
  },

  // Honorable Mentions
  honorableMentions: [
    {
      title: "AI-Accelerated Coffee Directory",
      description: "AI-accelerated coffee shop directory with custom scraping",
      tech: ["Astro", "Supabase", "Web Scraping"],
      image: "/images/work/findmeacoffee/findmeacoffee-thumbnail.jpeg",
      images: [
        "/images/work/findmeacoffee/findmeacoffee-thumbnail.jpeg",
        "/images/work/findmeacoffee/findmeacoffee-home.png",
        "/images/work/findmeacoffee/findmeacoffee-listing.png",
        "/images/work/findmeacoffee/findmeacoffee-filter.png",
        "/images/work/findmeacoffee/findmeacoffee-supabase-table.png",
        "/images/work/findmeacoffee/findmeacoffee-apify-action.png",
        "/images/work/findmeacoffee/findmeacoffee-extractor.jpeg",
        "/images/work/findmeacoffee/findmeacoffee-extractor-build.png"
      ]
    },
    {
      title: "EverPrompt",
      description: "Prompt management platform for AI workflows",
      tech: ["React", "Supabase", "AI Integration"],
      image: "/images/work/Everprompt - AI Prompt Management Made Simple.jpeg",
      images: [
        "/images/work/Everprompt - AI Prompt Management Made Simple.jpeg",
        "/images/work/everprompt-app1.png",
        "/images/work/everprompt-app2.png",
        "/images/work/everprompt-app3.png"
      ]
    },
    {
      title: "WhatsApp Flow Builder",
      description: "AI-powered FlowJSON builder with Figma export",
      tech: ["React", "TypeScript", "Supabase", "AI"],
      image: "/images/work/flows/flows-feature.jpeg",
      images: [
        "/images/work/flows/flows-feature.jpeg",
        "/images/work/flows/flows-preview.png",
        "/images/work/flows/flows-manual.png",
        "/images/work/flows/flows-main-app.jpeg",
        "/images/work/flows/flows-visual-editor.jpeg",
        "/images/work/flows/flows-generator.jpeg",
        "/images/work/flows/flows-figma-plugin.png",
        "/images/work/flows/flows-figma-generated-ui.png"
      ]
    },
    {
      title: "Ripple",
      description: "Personal productivity and habit tracking app",
      tech: ["React", "Supabase", "Tailwind"],
      image: "/images/work/Ripple.jpeg",
      images: [
        "/images/work/Ripple.jpeg",
        "/images/work/ripple-app-1.png",
        "/images/work/ripple-app-2.png",
        "/images/work/ripple-app-3.png"
      ]
    }
  ],

  // Closing
  closing: {
    lookingFor: {
      title: "What I'm Looking For",
      content: [
        "Lead / Senior product designer roles",
        "Organizations that value innovation and execution",
        "Opportunities to leverage my broad skill set",
        "Environments where I can teach and impart knowledge"
      ],
      availability: "Available immediately (no notice period)"
    },
    contact: {
      title: "Let's Connect",
      email: "contact@nasif.co.za",
      linkedin: "linkedin.com/in/nasifsalaam",
      portfolio: "nasif.co.za",
      cta: "Ready to discuss how I can contribute to your team"
    }
  }
};
