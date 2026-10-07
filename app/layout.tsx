// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === "dark");
    }

    const handleStorage = () => {
      const theme = localStorage.getItem("theme");
      if (theme !== null) {
        setIsDarkMode(theme === "dark");
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("themeChange", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("themeChange", handleStorage);
    };
  }, []);

  const bgColor = isDarkMode ? "#0d0d0d" : "#f8f9fa";

  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
      style={{
        backgroundColor: bgColor,
        margin: 0,
        padding: 0,
        minHeight: "100vh",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <head>
        <title>Mastanda Plug | Find your next room</title>
        <meta name="description" content="A simpler way for Zimbabwean tenants and landlords to connect." />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{
          backgroundColor: bgColor,
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}