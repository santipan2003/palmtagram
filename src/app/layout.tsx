// app/layout.tsx    ← your single true root layout
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { DM_Sans, Noto_Sans_Thai } from "next/font/google";

// Configure fonts
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-noto-sans-thai",
  weight: ["400", "500", "600", "700"],
});

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
      <body className={`${dmSans.variable} ${notoSansThai.variable} font-sans`}>
        {/* Move your ThemeProvider here so its script to set the
            class on <html> runs before hydration */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}