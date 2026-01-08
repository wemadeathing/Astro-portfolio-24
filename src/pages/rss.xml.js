import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const blog = await getCollection('blog');
  const projects = await getCollection('projects');

  // Combine blog posts and projects for the feed
  const items = [
    ...blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      // Compute RSS link from post `slug`
      // This example assumes all blog posts are rendered as `/blog/[slug]` routes
      link: `/blog/${post.slug}/`,
    })),
    ...projects
      .filter((project) => project.data.published)
      .map((project) => ({
        title: project.data.title,
        // Projects might not have a pubDate, so we might need a fallback or exclude them if strictly time-based
        // Assuming projects don't have a date field in schema, we'll skip or use a default.
        // Checking schema: projects schema has no date. 
        // We'll exclude projects for now to keep the RSS feed compliant with pubDate requirements or just stick to blog.
        // Actually, let's just do blog posts for the RSS feed as that's standard.
      }))
  ].filter(item => item.link); // Filter out items without links (projects removed above effectively)

  // Re-filtering just for blog posts to be safe and clean
  const blogItems = blog.map((post) => ({
    title: post.data.title,
    pubDate: post.data.pubDate,
    description: post.data.description,
    customData: `<language>en-us</language>`,
    link: `/blog/${post.slug}/`,
  }));

  return rss({
    title: 'Nasif Salaam | Insights',
    description: 'Technical Product Designer & AI Integration Specialist. Notes on AI-powered workflows, product craft, and the practical side of shipping.',
    site: context.site,
    items: blogItems,
  });
}
