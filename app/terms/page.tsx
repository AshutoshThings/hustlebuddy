import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPage,
  List,
  Mail,
  Section,
} from "@/app/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms for using HustleBuddy and its browser extension.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="16 November 2026">
      <p>
        These terms apply when you use the HustleBuddy website, dashboard and
        browser extension. By creating an account you agree to them.
      </p>

      <Section heading="The service">
        <p>
          HustleBuddy lets you record and track your job and internship
          applications and store resumes. It is free for students and freshers.
          Features may change, and the extension depends on how job sites are
          built, so detection can stop working when a site changes.
        </p>
      </Section>

      <Section heading="Your account">
        <List
          items={[
            "Give a real email address and keep your password to yourself.",
            "You're responsible for what happens under your account.",
            "One person per account.",
          ]}
        />
      </Section>

      <Section heading="Your content">
        <p>
          You own the applications, notes and resumes you add. You give us
          permission to store and display them to you so the service works.
          Don&apos;t upload anything you don&apos;t have the right to share, or
          anything illegal or harmful.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <List
          items={[
            "Don't try to access other people's accounts or data.",
            "Don't overload, probe or break the service, or get around its limits.",
            "Follow the terms of the job sites you use the extension on. HustleBuddy doesn't submit applications for you.",
          ]}
        />
      </Section>

      <Section heading="No guarantees">
        <p>
          HustleBuddy is provided as it is, without warranties. We work to keep
          your data safe and the service available, but we can&apos;t promise it
          will be uninterrupted or error-free. Keep your own copies of anything
          important; you can export your applications from Settings. We
          aren&apos;t liable for missed deadlines, lost opportunities or
          indirect losses arising from using the service.
        </p>
      </Section>

      <Section heading="Ending your account">
        <p>
          You can stop using HustleBuddy at any time and ask us to delete your
          account (see the{" "}
          <Link
            href="/privacy"
            className="text-white underline underline-offset-4 decoration-slate-600 hover:decoration-white"
          >
            Privacy Policy
          </Link>
          ). We may suspend accounts that break these terms.
        </p>
      </Section>

      <Section heading="Changes and contact">
        <p>
          We may update these terms and will change the date above when we do.
          Questions: <Mail />.
        </p>
      </Section>
    </LegalPage>
  );
}
