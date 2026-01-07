// A utility function to remove the protocol from a URL, and www. if it’s present and remove trailing slash
export function prettifyUrl(url: string): string {
  return url
    .replace(/https?:\/\//, "")
    .replace(/www\./, "")
    .replace(/\/$/, "");
}
