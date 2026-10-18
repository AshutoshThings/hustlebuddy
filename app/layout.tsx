import { ExtensionBridge } from "./components/ExtensionBridge";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
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
