import type { LucideIcon } from "lucide-react";

type PlaceholderModuleProps = {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  sections: string[];
};

export function PlaceholderModule({
  title,
  eyebrow,
  description,
  icon: Icon,
  sections
}: PlaceholderModuleProps) {
  return (
    <div className="space-y-3.5">
      <header className="mether-surface rounded-[26px] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-400/15 bg-blue-500/[0.08] text-blue-300">
            <Icon size={19} />
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400/80">
              {eyebrow}
            </div>
            <h1 className="mether-page-title mt-1 font-black">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(section => (
          <article
            key={section}
            className="mether-surface min-h-[118px] rounded-[22px] p-4"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
              AL METHER Module
            </div>
            <h2 className="mt-3 text-sm font-bold text-slate-200">
              {section}
            </h2>
            <p className="mt-2 text-[10px] leading-4 text-slate-600">
              Bu bölümün veri modeli ve işlem akışı sıradaki geliştirme
              adımlarında etkinleştirilecek.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
