import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Tooso - Pakistani & BBQ Restaurant",
  description:
    "Tooso is a Pakistani and BBQ restaurant serving delicious traditional dishes, BBQ, and flavorful meals for dine-in and takeaway.",
};



export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
            />
          </AuthProvider>
        </QueryProvider>

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}