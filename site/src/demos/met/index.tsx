/* eslint-disable @next/next/no-img-element -- plain images, so the skeleton measures them as such */
import styles from "./styles.module.scss";
import { json, LiveSource } from "../parts/live-source";

type Artwork = {
  objectID: number;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  primaryImageSmall: string;
};

const ARTWORKS: Artwork[] = Array.from({ length: 4 }, (_, i) => ({
  objectID: i,
  title: "Portrait of a Woman",
  artistDisplayName: "Unknown artist",
  objectDate: "ca. 1650",
  primaryImageSmall: "",
}));

const SEARCHES = ["portrait", "teapot", "armor", "landscape", "cat"];

// A search and a page per round — far apart, and the same again on a refetch
const loadArtworks = async (round: number) => {
  const q = SEARCHES[round % SEARCHES.length]!;
  const { objectIDs } = await json<{ objectIDs: number[] | null }>(
    `https://collectionapi.metmuseum.org/public/collection/v1.1/search?hasImages=true&q=${q}&offset=${(round * 4) % 40}&limit=4`,
  );
  return Promise.all(
    (objectIDs ?? []).map((id) =>
      json<Artwork>(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
      ),
    ),
  );
};

const Artworks = ({ artworks }: { artworks: Artwork[] }) => (
  <div className={styles.artworks}>
    {artworks.map((artwork) => (
      <figure key={artwork.objectID}>
        {artwork.primaryImageSmall ? (
          <img
            src={artwork.primaryImageSmall}
            alt=""
            width={400}
            height={500}
          />
        ) : (
          <div className={styles.noImage}>No image</div>
        )}
        <figcaption>
          <p className={styles.feedName}>{artwork.title}</p>
          {artwork.artistDisplayName && (
            <p className={styles.feedMeta}>{artwork.artistDisplayName}</p>
          )}
          {artwork.objectDate && (
            <p className={styles.feedMeta}>{artwork.objectDate}</p>
          )}
        </figcaption>
      </figure>
    ))}
  </div>
);

export const Met = () => (
  <LiveSource id="live-met" load={loadArtworks} sample={ARTWORKS}>
    {(artworks) => <Artworks artworks={artworks} />}
  </LiveSource>
);
