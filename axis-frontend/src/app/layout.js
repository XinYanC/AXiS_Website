import { Host_Grotesk } from "next/font/google";
import "./globals.css";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
});

export const metadata = {
  title: "AXiS Marketplace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${hostGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}
