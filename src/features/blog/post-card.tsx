import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Post } from "@/types";
import { formatPostDate } from "./format-date";

/** One post in a list: date, title, summary, tags. Used by the blog index and
 *  by project pages, so both lists always look the same. */
export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-lg border border-gold/15 bg-ocean-panel/50 p-5 transition-colors hover:border-gold/40"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        {post.readingMinutes ? <span>· {post.readingMinutes} min read</span> : null}
        {post.draft ? (
          <span className="rounded-full border border-gold/40 px-2 py-0.5 text-xs text-gold">
            Draft
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 font-display text-xl text-balance text-foreground group-hover:text-gold">
        {post.title}
      </h3>
      <p className="mt-2 text-pretty text-foreground/80">{post.summary}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-gold/15 bg-ocean-panel/60 px-2 py-0.5 text-[11px] tracking-wide text-foreground/80"
            >
              {tag}
            </li>
          ))}
        </ul>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-gold">
          Read
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
