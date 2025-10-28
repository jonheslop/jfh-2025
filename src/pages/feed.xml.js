import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
const parser = new MarkdownIt();

export async function GET(context) {
  const posts = await getCollection("posts");

  const photos = await getCollection("photos");

  const combined = [...posts, ...photos].sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: "Jon Heslop",
    description: "Jon Heslop is a front end developer based in London.",
    site: context.site,
    items: combined.map((post) => {
      let content = parser.render(post.body);
      if (post.collection === "photos" && post.data.photos !== undefined) {
        post.data.photos.map(
          (cloudflareId) =>
            (content += `<br/><figure><img
          alt=""
          src="https://imagedelivery.net/tfgleCjJafHVtd2F4ngDnQ/${cloudflareId}/small"
        /></figure>`),
        );
      }

      content = content + `<hr/><p>Thanks for subscribing via RSS ᕕ( ᐛ )ᕗ</p>`;

      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description,
        content: sanitizeHtml(content, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        }),

        link: `/${post.collection}/${post.id}/`,
      };
    }),
  });
}
