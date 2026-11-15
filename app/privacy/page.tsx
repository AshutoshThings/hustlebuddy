import type { Metadata } from "next";
import {
  LegalPage,
  List,
  Mail,
  Section,
} from "@/app/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What HustleBuddy stores, what the browser extension can see, and how to get your data deleted.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="16 November 2026">
      <p>
        HustleBuddy helps you track job and internship applications. This page
        explains what we store, what the browser extension can access, who
        processes data for us, and how to have your data deleted.
      </p>

      <Section heading="What we store">
        <List
          items={[
            <>
              <strong className="text-white">Account:</strong> your name, email
              address and a hashed password (we never store the password
              itself). If you sign in with Google, we receive your name and
              email address from Google.
            </>,
            <>
              <strong className="text-white">Applications:</strong> the company,
              role, status, source and notes you save, and when you saved them.
            </>,
            <>
              <strong className="text-white">Resumes:</strong> PDF files you
              upload, with the role and notes you add. Files are kept in private
              storage and shown to you through links that expire after an hour.
            </>,
            <>
              <strong className="text-white">Sign-in sessions:</strong> a
              fingerprint (hash) of each session token, so we can sign you out
              of devices.
            </>,
            <>
              <strong className="text-white">Abuse protection:</strong> to limit
              repeated sign-in attempts we keep short-lived counters keyed by a
              hash of your IP address or email, deleted within a day.
            </>,
          ]}
        />
      </Section>

      <Section heading="The browser extension">
        <List
          items={[
            "It runs only on job pages of LinkedIn, Unstop, Internshala and Naukri, and on the HustleBuddy site. It doesn't read other sites or your browsing history.",
            "On those job pages it reads the job's company and role, so it can offer to log the application. Nothing is saved unless you confirm.",
            "When you open its popup on any page, it reads that page once to prefill the form. This uses Chrome's activeTab permission and only happens when you click the extension.",
            "It keeps your HustleBuddy sign-in token, and any applications waiting to sync, in the extension's local storage on your computer.",
          ]}
        />
      </Section>

      <Section heading="Cookies and local storage">
        <p>
          We use two cookies to keep you signed in. They are not readable by
          scripts and are not used for tracking. Your dashboard preferences
          (default view, column colours) are kept in your browser&apos;s local
          storage. We don&apos;t use advertising or analytics cookies.
        </p>
      </Section>

      <Section heading="Who processes data for us">
        <List
          items={[
            "Vercel: hosts the website and API.",
            "Supabase: stores the database and resume files.",
            "Mailjet: sends verification and password-reset emails.",
            "Google: only if you choose to sign in with Google.",
          ]}
        />
        <p>
          We don&apos;t sell your data, show ads, or share your information with
          recruiters or anyone else.
        </p>
      </Section>

      <Section heading="Keeping and deleting your data">
        <p>
          We keep your data while you have an account. You can export your
          applications from Settings at any time. To delete your account and
          everything in it, including resume files, email <Mail /> from the
          address you signed up with, and we&apos;ll do it within 30 days.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If we change what we collect or how we use it, we&apos;ll update this
          page and the date at the top.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about privacy: <Mail />.
        </p>
      </Section>
    </LegalPage>
  );
}
