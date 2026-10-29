import { useEffect, useRef } from "react";
import { Skeleton } from "skullet/react";
import styles from "./styles.module.scss";

const LOOK = 16; // How far the face turns toward the pointer, in viewBox units — about 4px at the homepage's 80px
const LEFT = 7; // Less room that way: the left eye sits near the skull's edge, and would run into its outline

const REACH = 400; // px from the mascot at which they've travelled all of it

const TAIL =
  "M274.621 204.819C304.266 200.327 318.672 177.609 299.11 178.859C299.11 178.859 255.28 178.344 235.024 110.034C219.192 56.6437 102.463 255.238 161.222 244.09C179.828 240.56 208.105 273.52 221.746 254.827C227.133 247.444 219.658 236.769 228.659 238.354C283.814 248.061 297.713 230.485 276.019 220.777C264.267 215.519 262.487 206.658 274.621 204.819Z";
const FACE =
  "M109.025 251.818C113.402 249.96 118.469 237.32 120.302 242.08C129.191 265.163 155.586 247.355 144.994 226.075C160.316 226.79 192.151 226.74 211.818 194.597C244.396 141.354 223.658 77.5941 160.634 59.356C103.915 42.9426 31.9772 70.4992 26.128 129.44C22.6595 164.393 26.1281 192.832 62.8344 211.55C58.3759 222.596 56.6758 239.718 73.8578 240.685C76.7056 240.845 80.1401 238.315 80.001 239.519C78.3361 253.919 95.3757 257.612 109.025 251.818Z";
const RING =
  "M68.5193 53.9074C97.2977 40.2962 132.856 37.231 164.395 46.3577C199.783 56.5985 224.243 80.0328 234.803 109.25C245.313 138.331 241.598 171.853 223.361 201.659C205.671 230.57 179.628 237.87 160.814 239.41C159.836 248.849 154.816 257.103 147.422 261.997C141.333 266.027 133.15 267.954 124.935 265.083C122.6 264.266 120.467 263.136 118.535 261.745C117.444 262.603 116.033 263.543 114.312 264.274C105.069 268.197 93.8868 269.342 84.3319 266.024C79.3965 264.311 74.3498 261.184 70.7831 256.025C70.2834 255.302 69.8288 254.56 69.4163 253.803C64.2159 252.975 59.3653 250.975 55.3491 247.461C50.4209 243.149 47.9887 237.642 46.9665 232.57C45.9781 227.667 46.1817 222.645 46.977 218.022C31.7156 208.128 22.0016 195.8 16.6977 181.205C10.598 164.42 10.8821 146.046 12.6627 128.104C16.17 92.7608 39.5708 67.599 68.5193 53.9074ZM160.634 59.3556C103.915 42.9423 31.977 70.4991 26.1279 129.44L25.9711 131.074C22.7764 165.279 26.7017 193.124 62.8344 211.55C58.3759 222.596 56.6762 239.718 73.8581 240.684C76.7057 240.845 80.1393 238.316 80.0007 239.518C78.3617 253.694 94.848 257.494 108.383 252.083L109.024 251.818C113.402 249.96 118.47 237.32 120.303 242.08C129.192 265.162 155.585 247.354 144.994 226.074C160.196 226.783 191.654 226.74 211.355 195.344L211.818 194.597C244.142 141.769 223.979 78.589 162.103 59.7912L160.634 59.3556Z";
const NOSE =
  "M102.128 206.117C111.005 207.848 105.193 180.66 96.0658 180.404C87.2662 180.156 77.3493 203.16 86.0465 204.213C89.5389 204.635 91.4053 201.556 94.8864 202.038C98.1985 202.497 98.8577 205.48 102.128 206.117Z";
const LINES = [
  "M246.198 66.872L259.34 53.0679",
  "M260.524 88.9648L279.522 84.1913",
];
const EYES = {
  right: { cx: 145.633, cy: 159.665, r: 31.4754 },
  left: { cx: 65.0317, cy: 153.341, rx: 24.4155, ry: 28.2396 },
};

// The ring's outer edge alone: its hole and the face inside it would leave a seam where their edges meet
const OUTLINE = `${RING.split("Z")[0]}Z`;

// Everything the mascot covers, as one shape: the skeleton is a shimmering bar cut to it
const SILHOUETTE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><path d="${TAIL}"/><path d="${OUTLINE}"/>${LINES.map((d) => `<path d="${d}" stroke="#000" stroke-width="10.5898" stroke-linecap="round"/>`).join("")}</svg>`,
)}")`;

/** The mascot as a skeleton: its silhouette shimmering with the page, its eyes and nose still cut out. */
const MascotSkeleton = ({ size }: { size: number }) => (
  <div className={styles.skeleton} style={{ width: size, height: size }}>
    <Skeleton
      width={size}
      height={size}
      radius={0}
      style={{
        maskImage: SILHOUETTE,
        WebkitMaskImage: SILHOUETTE,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
      }}
    />
    <svg width={size} height={size} viewBox="0 0 320 320" aria-hidden>
      <circle {...EYES.right} fill="var(--bg-1)" />
      <ellipse {...EYES.left} fill="var(--bg-1)" />
      <path d={NOSE} fill="var(--bg-1)" />
    </svg>
  </div>
);

export const Mascot = ({
  size = 320,
  loading,
}: {
  size?: number;
  loading?: boolean;
}) => {
  const ref = useRef<SVGSVGElement>(null);

  // The face toward the pointer, once the real mascot is there; skipped under reduced motion
  useEffect(() => {
    const svg = ref.current;
    if (!svg || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const look = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = svg.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy) || 1;
        const reach = (Math.min(distance / REACH, 1) * LOOK) / distance;
        svg.style.setProperty("--look-x", `${Math.max(dx * reach, -LEFT)}px`);
        svg.style.setProperty("--look-y", `${dy * reach}px`);
      });
    };
    addEventListener("pointermove", look, { passive: true });
    return () => {
      removeEventListener("pointermove", look);
      cancelAnimationFrame(frame);
    };
  }, [loading]);

  return (
    <svg
      ref={ref}
      className={styles.mascot}
      width={size}
      height={size}
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g name="mascot">
        <g name="skull">
          <path className={styles.tail} d={TAIL} fill="var(--fg-1)" />

          <path d={FACE} fill="var(--bg-1)" />
        </g>
        <path name="nose" d={RING} fill="var(--fg-1)" />
        <g className={styles.look}>
          <circle
            className={styles.eye}
            name="right eye"
            {...EYES.right}
            fill="var(--fg-1)"
          />
        </g>
        <g className={styles.look}>
          <ellipse
            className={styles.eye}
            name="left eye"
            {...EYES.left}
            fill="var(--fg-1)"
          />
        </g>
        <path className={styles.nose} name="hair" d={NOSE} fill="var(--fg-1)" />
        <g name="decoration">
          <path
            className={styles.line}
            d={LINES[0]}
            strokeWidth="10.5898"
            strokeLinecap="round"
            stroke="var(--fg-1)"
          />
          <path
            className={styles.line}
            d={LINES[1]}
            strokeWidth="10.5898"
            strokeLinecap="round"
            stroke="var(--fg-1)"
          />
        </g>
      </g>
    </svg>
  );
};
Mascot.Skeleton = MascotSkeleton;
