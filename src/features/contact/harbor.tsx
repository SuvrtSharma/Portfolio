import { Download, Mail } from "lucide-react";
import { SocialLinks } from "@/components/common/social-links";
import { Parchment } from "@/components/common/surfaces";
import { buttonVariants } from "@/components/ui/button";
import { getDataProvider } from "@/lib/data";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** The Harbor — contact card. Parchment surface to stand apart from the dark
 *  page; all actions (email, résumé, socials) in one place. */
export function Harbor() {
  const profile = getDataProvider().getProfile();

  return (
    <Parchment className="mx-auto max-w-2xl p-8 text-center sm:p-10">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-wood/30 bg-parchment-dark/30 text-wood">
        <Icon name="anchor" className="size-6" />
      </span>
      <h3 className="mt-4 font-display text-2xl text-ink">
        Drop Anchor at the Harbor
      </h3>
      <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-ink/75">
        Looking to build something, hire, or just trade notes? The harbor is
        always open.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`mailto:${profile.email}`}
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          <Mail className="size-4" />
          {profile.email}
        </a>
        {profile.resumeUrl ? (
          <a
            href={profile.resumeUrl}
            download
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "gap-2 border-wood/30 bg-transparent text-ink hover:bg-parchment-dark/30 hover:text-ink",
            )}
          >
            <Download className="size-4" />
            Résumé
          </a>
        ) : null}
      </div>

      <div className="mt-6 flex justify-center">
        <SocialLinks itemClassName="border-wood/25 text-ink/70 hover:border-wood hover:text-wood" />
      </div>
    </Parchment>
  );
}
