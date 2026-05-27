import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
const parser = new MarkdownIt();

export async function GET(context: { site: string }) {
  const allLinks = await getCollection("links");
  const links = allLinks.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: "Links - Jon Heslop",
    description:
      "Links to things I’ve read/watched/seen around the web, saved here for posterity.",
    site: `${context.site}/links`,
    items: links.map((link) => {
      const parsedContent = parser.render(link.body ?? "");
      return {
        title: link.data.title,
        pubDate: link.data.date,
        content: sanitizeHtml(parsedContent, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        }),
        link: `/links/${link.id}/`,
      };
    }),
  });
}
