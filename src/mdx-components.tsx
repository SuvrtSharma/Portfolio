import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { isExternal } from "@/lib/url";

/**
 * Global styling for MDX content. Markdown elements map to themed components so
 * long-form island stories match the rest of the site (dark ocean + gold)
 * without per-file styling.
 */
const components: MDXComponents = {
  h2: (props) => (
    <h2
      className="mt-10 mb-3 font-display text-2xl text-foreground"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="mt-8 mb-2 font-display text-xl text-foreground" {...props} />
  ),
  p: (props) => <p className="my-4 leading-relaxed text-foreground/85" {...props} />,
  ul: (props) => (
    <ul
      className="my-4 list-disc space-y-1.5 pl-5 text-foreground/85 marker:text-gold"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="my-4 list-decimal space-y-1.5 pl-5 text-foreground/85 marker:text-gold"
      {...props}
    />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: ({ href = "#", ...rest }: ComponentPropsWithoutRef<"a">) => (
    <Link
      href={href}
      className="font-medium text-gold underline-offset-4 hover:underline"
      {...(isExternal(href)
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      {...rest}
    />
  ),
  strong: (props) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  em: (props) => <em className="italic" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-6 border-l-2 border-gold/50 pl-4 text-foreground/75 italic"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="rounded bg-ocean-panel px-1.5 py-0.5 font-mono text-sm text-gold-soft"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="my-6 overflow-x-auto rounded-lg border border-gold/15 bg-ocean-deep p-4 text-sm [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  hr: () => <hr className="my-8 border-gold/15" />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
