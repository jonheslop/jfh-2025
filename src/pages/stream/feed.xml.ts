import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
const parser = new MarkdownIt();
import { dateOptions, parseDateFromId } from "../../utils/types";

export async function GET(context: { site: string }) {
  const stream = (await getCollection("stream")).sort((a, b) => {
    const [yearA, dayA] = a.id.split("/").map(Number);
    const [yearB, dayB] = b.id.split("/").map(Number);
    if (yearB !== yearA) return yearB - yearA;
    return dayB - dayA;
  });

  return rss({
    title: "Photo stream - Jon Heslop",
    description: "One photo a day.",
    site: `${context.site}/stream`,
    items: stream.map((post) => {
      const photo = `<figure><img
    alt=""
    src="https://imagedelivery.net/tfgleCjJafHVtd2F4ngDnQ/${post.data.photo}/medium"
  /></figure><br/>`;
      const content = photo + parser.render(post.body ?? "");

      return {
        title: parseDateFromId(post.id).toLocaleDateString(
          "en-GB",
          dateOptions,
        ),
        description: post.data.camera,
        pubDate: parseDateFromId(post.id),
        content: sanitizeHtml(content, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        }),

        link: `/stream/${post.id}/`,
      };
    }),
  });
}
