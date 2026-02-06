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

// Helper function to format numbers with commas
export const formatNumber = (value: string | number): string => {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  return num.toLocaleString("en-GB");
};
