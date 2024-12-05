"use client";
import { ReactNode, useState } from "react";
import SideNav from "./SideNav"; 
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
		<div className="h-screen bg-gray-100 flex">
			<SideNav isSidebarOpen={isSidebarOpen} />
			{!isSidebarOpen && (
				<div
					className="fixed top-0 right-0 z-49 w-6 h-screen cursor-pointer hover:bg-[#eceef2]"
					onClick={() => setIsSidebarOpen(!isSidebarOpen)}
				></div>
			)}{" "}
			<button
				className="fixed top-[90%] right-0 z-50 bg-blue-100/80 rounded-full p-2 shadow-lg "
				onClick={() => setIsSidebarOpen(!isSidebarOpen)}
			>
				{isSidebarOpen ? (
					<ChevronRightIcon className="h-6 w-6" />
				) : (
					<ChevronLeftIcon className="h-6 w-6" />
				)}
			</button>
			<main className="flex-1 p-8 overflow-y-auto">{children}</main>
		</div>
	);
};

export default Layout;
