import { Reveal } from "@/components/common/reveal";
import { Panel } from "@/components/common/surfaces";
import { getDataProvider } from "@/lib/data";
import { Icon } from "@/lib/icons";

/** Tech-stack grid: one panel per skill group, with the skills as chips. */
export function SkillsGrid() {
  const groups = getDataProvider().getSkillGroups();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group, index) => (
        <Reveal key={group.id} delay={index * 0.05}>
          <Panel className="h-full p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md border border-gold/20 bg-ocean-deep/60 text-gold">
                <Icon name={group.iconKey ?? "tools"} className="size-5" />
              </span>
              <h3 className="font-display text-base text-foreground">
                {group.label}
              </h3>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-md border border-gold/15 bg-ocean-deep/50 px-2.5 py-1 text-xs text-foreground/85"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      ))}
    </div>
  );
}
