// A utility function to make links looks nicer and terse as possible:
// - Remove the protocol from a URL,
// - Remove www. if it’s present
// - Remove trailing slash
// - Remove the query string
// - Remove the fragment identifier

export function prettifyUrl(url: string): string {
  return url
    .replace(/https?:\/\//, "")
    .replace(/www\./, "")
    .replace(/\/$/, "")
    .replace(/\?.*/, "")
    .replace(/#.*/, "");
}
