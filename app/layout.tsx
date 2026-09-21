import type { Metadata, Viewport } from "next";
import React from "react";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "Mastanda Plug | Find your next room",
  description: "A simpler way for Zimbabwean tenants and landlords to connect.",
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ margin: 0, backgroundColor: "#0d0d0d" }}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}