// app/layout.tsx    ← your single true root layout
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Palmtagram",
  description: "A modern social media platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning silences mismatch complaints on <html>
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Move your ThemeProvider here so its script to set the
            class on <html> runs before hydration */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
