import { getDataProvider } from "@/lib/data";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { isExternal } from "@/lib/url";

/** Row of social/contact links, pulled from the active profile. */
export function SocialLinks({
  className,
  itemClassName,
}: {
  className?: string;
  itemClassName?: string;
}) {
  const { socials } = getDataProvider().getProfile();

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {socials.map((social) => (
        <li key={`${social.kind}:${social.href}`}>
          <a
            href={social.href}
            aria-label={social.label}
            title={social.label}
            {...(isExternal(social.href)
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-md border border-gold/20 text-foreground/80 transition-colors hover:border-gold/50 hover:text-gold focus-visible:border-gold focus-visible:text-gold",
              itemClassName,
            )}
          >
            <Icon name={social.kind} className="size-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
