import type { Metadata } from "next";

// The sign-in page is a client component, so its title is set here.
export const metadata: Metadata = {
  title: "Sign in",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
