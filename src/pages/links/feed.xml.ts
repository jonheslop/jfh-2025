import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const parser = new MarkdownIt();

export async function GET(context: { site: string }) {
  const allLinks = await getCollection("links");
  const links = allLinks.sort((a, b) => {
    const dateDiff = b.data.date.getTime() - a.data.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return Number(b.id) - Number(a.id);
  });

  return rss({
    title: "Links - Jon Heslop",
    description:
      "Links to things I’ve read/watched/seen around the web, saved here for posterity.",
    site: `${context.site}/links`,
    items: links.map((link) => {
      let parsedContent = parser.render(link.body ?? "");
      const parsedVia = link.data.via
        ? parser.render(`Via ${link.data.via}`)
        : null;

      if (parsedVia) {
        parsedContent = `${parsedContent} <hr/>${parsedVia}`;
      }
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
