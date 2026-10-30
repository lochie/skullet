import { useState } from "react";
import styles from "./styles.module.scss";
import { AVATAR_URL } from "@/utils/consts";

const AVATARS: Record<string, string> = {
  "Lochie Axon": AVATAR_URL,
  "Alex Vanderzon": "/avatars/alex.png",
  Pugson: "/avatars/pugson.jpg",
  USDC: "/avatars/usdc.png",
  ETH: "/avatars/eth.png",
  AAVE: "/avatars/aave.png",
};

const initialsOf = (name: string) => {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1]![0] : "";
  return (first + last).toUpperCase();
};

// Stable per name, so the same person keeps their colour everywhere
const hueOf = (name: string) =>
  [...name].reduce((sum, char) => sum + char.charCodeAt(0) * 47, 0) % 360;

export const Avatar = ({
  name,
  size = 32,
  hue = hueOf(name),
}: {
  name: string;
  size?: number;
  hue?: number;
}) => {
  const src = AVATARS[name];
  const [failed, setFailed] = useState(false);
  const image = src && !failed;

  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: image ? undefined : `oklch(0.75 0.12 ${hue})`,
      }}
    >
      {image ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          onError={() => setFailed(true)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
};
