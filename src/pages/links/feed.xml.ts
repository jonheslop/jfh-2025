import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

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
      return {
        title: link.data.title,
        pubDate: link.data.date,
        content: link.body || "",
        link: `/links/${link.id}/`,
      };
    }),
  });
}
