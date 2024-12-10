"use client";
import Link from "next/link";

import { auth } from "../lib/firebase";
import { useState } from "react";
import { signOut } from "firebase/auth";


interface SideNavProps {
	isSidebarOpen: Boolean;
}

const SideNav = ({ isSidebarOpen}:SideNavProps) => {
	const handleSignOut = async () => {
		await signOut(auth);
	};

	return (
		<aside
			className={`fixed h-screen top-0 right-0 overflow-hidden  bg-white border-r border-gray-200 transition-width duration-300 ease-in-out z-10 lg:relative ${
				isSidebarOpen ? "w-64" : "w-0 "
			}`}
		>
			<div className="p-6">
				{/* User Profile/Avatar (Placeholder for now) */}
				<div className="flex items-center mb-8">
					<div className="w-12 h-12 bg-gray-300 rounded-full"></div>{" "}
					{/* to Replace with actual avatar */}
					<div className="mr-4">
						<h3 className="text-lg font-medium text-gray-900">اسم المستخدم</h3>{" "}
						{/* to Replace with username */}
					</div>
				</div>
				<nav className="text-base text-gray-600">
					<Link href="/dashboard" className="block py-2 px-4 hover:bg-gray-100">
						الرئيسية
					</Link>
					<Link
						href="/missed-prayers"
						className="block py-2 px-4 hover:bg-gray-100"
					>
						الصلوات الفائتة
					</Link>
					<Link
						href="/qadaa-plans"
						className="block py-2 px-4 hover:bg-gray-100"
					>
						خطط القضاء
					</Link>
					<Link
						href="/progress-visualization"
						className="block py-2 px-4 hover:bg-gray-100"
					>
						عرض التقدم
					</Link>
					<Link
						href="/ai-checker"
						className="block py-2 px-4 hover:bg-gray-100"
					>
						الفاحص الآلي
					</Link>

					<Link href="/settings" className="block py-2 px-4 hover:bg-gray-100">
						الإعدادات
					</Link>

					{/* Sign Out Button */}
					<button
						onClick={handleSignOut}
						className="w-full mt-4 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
					>
						تسجيل الخروج
					</button>
				</nav>
			</div>
		</aside>
	);
};

export default SideNav;
