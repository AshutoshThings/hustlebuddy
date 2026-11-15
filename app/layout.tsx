import { ExtensionBridge } from "./components/ExtensionBridge";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import type { Metadata } from "next";

const DESCRIPTION =
  "Track every job and internship application in one place. Log them from LinkedIn, Unstop, Internshala and Naukri with the browser extension, and see where each one stands.";

export const metadata: Metadata = {
  title: {
    default: "HustleBuddy: track your job and internship applications",
    template: "%s · HustleBuddy",
  },
  description: DESCRIPTION,
  applicationName: "HustleBuddy",
  openGraph: {
    type: "website",
    siteName: "HustleBuddy",
    title: "HustleBuddy: track your job and internship applications",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "HustleBuddy",
    description: DESCRIPTION,
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ExtensionBridge />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
