import Link from "next/link";
import { HustleBuddyLogo } from "@/app/components/ui/HustleBuddyLogo";

export const CONTACT_EMAIL = "founder@hustlebuddy.secondlayer.in";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#030303] text-slate-300">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
        >
          <HustleBuddyLogo className="w-4 h-4" />
          HustleBuddy
        </Link>
        <h1 className="mt-10 text-3xl font-medium tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated {updated}</p>
        <div className="mt-10 space-y-8 text-[15px] leading-7">{children}</div>
      </div>
    </main>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium text-white">{heading}</h2>
      {children}
    </section>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-slate-600">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Mail() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="text-white underline underline-offset-4 decoration-slate-600 hover:decoration-white"
    >
      {CONTACT_EMAIL}
    </a>
  );
}
