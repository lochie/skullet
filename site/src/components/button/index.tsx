import Link from "next/link";
import { Ref } from "react";
import styles from "./styles.module.scss";

type Props = {
  children: React.ReactNode;
  variant?: "secondary";
};

/** A button, or a link styled as one when given `href`. */
export const Button = (
  props: Props &
    (
      | ({ href?: undefined; ref?: Ref<HTMLButtonElement> } & Omit<
          React.ButtonHTMLAttributes<HTMLButtonElement>,
          "className"
        >)
      | ({ href: string } & Omit<
          React.AnchorHTMLAttributes<HTMLAnchorElement>,
          "href" | "className"
        >)
    ),
) => {
  const { children, variant, ...rest } = props;
  const shared = { className: styles.button, "data-variant": variant };

  if (rest.href !== undefined) {
    return (
      <Link {...rest} {...shared} href={rest.href}>
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
