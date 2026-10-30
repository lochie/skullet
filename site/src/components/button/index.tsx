import Link from "next/link";
import { CSSProperties, Ref } from "react";
import styles from "./styles.module.scss";

type Props = {
  children: React.ReactNode;
  wide?: boolean;
  variant?: "primary" | "secondary";
  style?: CSSProperties;
};

/** A button, or a link styled as one when given `href`. */
export const Button = (
  props: Props &
    (
      | ({ href?: undefined; ref?: Ref<HTMLButtonElement> } & Omit<
          React.ButtonHTMLAttributes<HTMLButtonElement>,
          "style"
        >)
      | ({ href: string } & Omit<
          React.AnchorHTMLAttributes<HTMLAnchorElement>,
          "href" | "style"
        >)
    ),
) => {
  const { children, wide, variant, style, ...rest } = props;
  const shared = {
    className: styles.button,
    "data-variant": variant,
    style: { width: wide ? "100%" : "auto", ...style },
  };

  if (rest.href !== undefined) {
    return (
      <Link
        {...rest}
        {...shared}
        // Next's types pin an older csstype than React's
        style={shared.style as React.ComponentProps<typeof Link>["style"]}
        href={rest.href}
      >
        {children}
      </Link>
    );
  }
  return (
    <button {...rest} {...shared}>
      {children}
    </button>
  );
};
