/** skullet's npm downloads over the last year, refreshed daily; undefined when npm can't be reached. */
export async function getDownloads(): Promise<number | undefined> {
  try {
    const response = await fetch(
      "https://api.npmjs.org/downloads/point/last-year/skullet",
      { next: { revalidate: 86400 } },
    );
    if (!response.ok) return undefined;
    return (await response.json()).downloads;
  } catch {
    return undefined;
  }
}
