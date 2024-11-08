// app/layout.js
import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import FirebaseAuthRedirect from "@/app/lib/firebaseAuthRedirect";

export const metadata: Metadata = {
  title: "قاضي",
  description: "موقع يساعد على قضاء الصلوات الفائتة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="">
        <FirebaseAuthRedirect /> 
        {children}
      </body>
    </html>
  );
}
