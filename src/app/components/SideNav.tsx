"use client";
import Link from "next/link";

import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

interface SideNavProps {
	isSidebarOpen: Boolean;
}

const SideNav = ({ isSidebarOpen }: SideNavProps) => {
	const [user, setUser] = useState<any>();
	const [profilePicture, setProfilePicture] = useState<string | null>(null);
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
			if (auth.currentUser) {
				const userDocRef = doc(db, "users", auth.currentUser.uid);
				const userDocSnap = await getDoc(userDocRef);
				if (userDocSnap.exists()) {
					const userData = userDocSnap.data();
					setProfilePicture(userData.profilePicture || null); // Use optional chaining
					setUser(authUser); // Set user from auth state
				}
			} else {
				setUser(null);
				setProfilePicture(null);
			}
		});
		return () => unsubscribe(); // Unsubscribe when component unmounts
	}, []);

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
				<div className="flex-col justify-center items-center mb-8">
					{user?.profilePicture || profilePicture ? (
						<div className="mb-2">
							<img
								className="w-20 h-20 rounded-full"
								src={user?.profilePicture || profilePicture}
								alt="Profile pic"
							/>
						</div>
					) : (
						<div className="h-20 w-20 rounded-full bg-gray-100 mb-2"></div>
					)}
					<div className="mr-4">
						<h3 className="text-lg font-bold  text-gray-900">
							{" "}
							{/* user?.name ||  Use name from firestore if available, fallback to displayName from auth, then fallback to email  */}
							{user?.name || user?.displayName || user?.email || "مستخدم"}{" "}
						</h3>
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
