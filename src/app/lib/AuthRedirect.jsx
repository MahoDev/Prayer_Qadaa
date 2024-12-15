"use client"; 
import { useEffect } from "react";
import {  onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { usePathname, useRouter } from "next/navigation";

export default function AuthRedirect() {

  	const router = useRouter();
		const pathName = usePathname();

		// Authentication check
		useEffect(() => {
			const unsubscribe = onAuthStateChanged(auth, (user) => {
				if (!user && pathName !== "/") {
					router.push("/login");
				}
			});
			return () => unsubscribe();
		}, []);

  return null; // No need to render anything in this component
}
