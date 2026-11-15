import type { Metadata } from "next";

// The extension connect page is a client component, so its title is set here.
export const metadata: Metadata = {
  title: "Connect the extension",
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
