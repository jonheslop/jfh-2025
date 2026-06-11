import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const parser = new MarkdownIt();

import {
  dateOptions,
  parseDateFromId,
  sortStreamByDate,
} from "../../utils/types";

export async function GET(context: { site: string }) {
  const stream = sortStreamByDate(await getCollection("stream"));

  return rss({
    title: "Photo stream - Jon Heslop",
    description: "One photo a day.",
    site: `${context.site}/stream`,
    items: stream.map((post) => {
      const photo = post.data.photo
        ? `<figure><img
    alt=""
    src="https://imagedelivery.net/tfgleCjJafHVtd2F4ngDnQ/${post.data.photo.id}/medium"
  /></figure><br/>`
        : "<p>No photo today.</p>";
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
