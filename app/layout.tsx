"use client";

import React, { useState, useEffect } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";
import { SwipeProvider } from "./components/SwipeNavigator";
import { SwipeWrapper } from "./components/SwipeWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const readTheme = () => {
      const theme = localStorage.getItem("theme");
      setIsDarkMode(theme === null ? true : theme === "dark");
    };

    const handleStorage = () => readTheme();

    // Initial sync with localStorage, deferred to just before the next
    // paint so the effect body itself never calls setState synchronously.
    const raf = requestAnimationFrame(readTheme);

    window.addEventListener("storage", handleStorage);
    window.addEventListener("themeChange", handleStorage);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("themeChange", handleStorage);
    };
  }, []);

  const bgColor = isDarkMode ? "#0d0d0d" : "#f8f9fa";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{
        margin: 0,
        padding: 0,
        width: "100%",
        minHeight: "100vh",
        height: "100%",
        backgroundColor: bgColor,
      }}
    >
      <head>
        <title>Mastanda Plug | Find your next room</title>
        <meta name="description" content="A simpler way for Zimbabwean tenants and landlords to connect." />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          minHeight: "100vh",
          height: "100%",
          backgroundColor: bgColor,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SwipeProvider>
          <Navbar isDarkMode={isDarkMode} />
          {/* The swipe deck owns scrolling (each page panel scrolls itself),
              so main is just a bounded flex box. Non-deck routes scroll via
              the plain viewport inside SwipeWrapper. Page-level bottom padding
              (--bottom-nav-clearance) keeps content clear of the floating
              bottom navigation pill. */}
          <main
            style={{
              flex: 1,
              minHeight: 0,
              width: "100%",
              overflow: "hidden",
            }}
          >
            <SwipeWrapper>
              {children}
            </SwipeWrapper>
          </main>
        </SwipeProvider>
      </body>
    </html>
  );
}