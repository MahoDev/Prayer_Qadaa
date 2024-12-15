import type { Metadata } from "next";
import "./globals.css";
import AuthRedirect from "@/app/lib/AuthRedirect";
import { auth } from "./lib/firebase";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NotificationHandler from "./lib/NotificationHandler";

export const metadata: Metadata = {
	title: "موقع قضاء",
	description: "موقع يسهل عليك قضاء صلواتك الفائتة",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="">
				<ToastContainer rtl stacked />
				<AuthRedirect />
				<NotificationHandler />
				{children}
			</body>
		</html>
	);
}
