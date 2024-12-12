"use client";
import { useState } from "react";
import Link from "next/link";
import {
	createUserWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	getRedirectResult,
	signInWithRedirect,
} from "firebase/auth";
import { auth, db } from "@/app/lib/firebase"; // Import Firebase auth instance
import { useRouter } from "next/navigation";
import { Metadata } from "next";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { RiGoogleFill, RiGoogleLine } from "@remixicon/react";

const metadata: Metadata = {
	title: "التسجيل",
	description: "صفحة تسجيل الحساب",
};

export default function RegisterPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");

	const createUserDocument = async (user: any) => {
		// Helper function to create user document
		try {
			const userRef = doc(db, "users", user.uid);
			await setDoc(
				userRef,
				{
					email: user.email || "",
					name: user.displayName || "اسم المستخدم", // Add other user data as needed
					profilePicture: null,
					timestamp: serverTimestamp(),
				},
				{ merge: true }
			); // Use merge: true to avoid overwriting data if the document already exists (e.g., from Google sign-in)

			console.log("User document created in Firestore");
		} catch (error) {
			console.error("Error creating user document:", error);
			toast.error("حدث خطأ ما"); // Or a more specific error message
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("كلمات المرور غير متطابقة"); // Passwords don't match
			return;
		}

		if (!email || !password || password.length < 6) {
			setError(
				"يرجى ملء جميع الحقول بشكل صحيح. كلمة المرور يجب أن تكون 6 أحرف على الأقل"
			);
			return;
		}

		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
			const user = userCredential.user; // Get user data
			await createUserDocument(user); // Redirect to dashboard after successful registration
			router.push("/missed-prayers");
		} catch (err: any) {
			if (err.message.includes("auth/email-already-in-use"))
				setError("البريد الإلكتروني مستخدم بالفعل");
			else setError(err.message);
			// Handle Errors here.
			console.error(err);
		}
	};

	const handleGoogleSignIn = async () => {
		const provider = new GoogleAuthProvider();
		try {
			// Check for redirect result (if user is returning from Google)
			const result = await signInWithPopup(auth, provider);
			if (result) {
				const user = result.user; // Get user data from Google sign-in
				await createUserDocument(user);

				// User successfully signed in.  You can get user details from `result.user`.
				router.push("/missed-prayers");
				return;
			}
			//await signInWithRedirect(auth, provider);
		} catch (err) {
			console.error("Error signing in with Google:", err);
			setError("حدث خطأ أثناء تسجيل الدخول باستخدام جوجل.");
		}
	};

	return (
		<div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
					إنشاء حساب جديد
				</h2>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<form className="space-y-6" onSubmit={handleSubmit}>
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700"
							>
								عنوان البريد الإلكتروني
							</label>
							<div className="mt-1">
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="appearance-none text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								كلمة المرور
							</label>
							<div className="mt-1">
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="new-password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="appearance-none text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								/>
							</div>
						</div>

						{/* Confirm Password */}
						<div>
							<label
								htmlFor="confirm-password"
								className="block text-sm font-medium text-gray-700"
							>
								تأكيد كلمة المرور
							</label>
							<div className="mt-1">
								<input
									id="confirm-password"
									name="confirm-password"
									type="password"
									autoComplete="new-password"
									required
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="appearance-none text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								/>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<p className="text-red-500 text-sm text-center">{error}</p>
						)}

						<div>
							<button
								type="submit"
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								إنشاء حساب
							</button>
						</div>

						<div>
							<button
								type="button"
								onClick={handleGoogleSignIn}
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
							>
								{/* Google Sign-Up Button Text */}
								التسجيل باستخدام جوجل
								<RiGoogleFill className="mr-2" />
							</button>
						</div>
						<div className="text-center mt-2 text-sm text-gray-600">
							لديك حساب بالفعل؟{" "}
							<Link href="/login" className="text-blue-600">
								تسجيل الدخول
							</Link>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
