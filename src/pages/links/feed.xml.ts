import rss from "@astrojs/rss";
import { turso, type Link } from "../../utils/turso";

export async function GET(context: { site: string }) {
  const { rows } = await turso().execute(
    "SELECT * FROM links ORDER BY id DESC",
  );
  const links = rows as Link[];
  return rss({
    title: "Links - Jon Heslop",
    description:
      "Links to things I’ve read/watched/seen around the web, saved here for posterity.",
    site: `${context.site}/links`,
    items: links.map((link) => {
      return {
        title: link.title,
        pubDate: new Date(link.date),
        content: link.comment || "",
        link: `/links/${link.id}/`,
      };
    }),
  });
}
