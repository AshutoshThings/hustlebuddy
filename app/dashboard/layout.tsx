import type { Metadata } from "next";

// The dashboard page is a client component, so its title is set here.
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
