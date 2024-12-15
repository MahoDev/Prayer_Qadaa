"use client";
import { useState } from "react";
import Link from "next/link";
import {
	signInWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithPopup,
} from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { RiGoogleFill } from "@remixicon/react";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		try {
			await signInWithEmailAndPassword(auth, email, password);
			router.push("/dashboard");
			// router.push("/");
		} catch (error: any) {
			if (error.message.includes("auth/user-not-found"))
				setError("المستخدم غير موجود");
			else if (error.message.includes("auth/wrong-password"))
				setError("كلمة المرور غير صحيحة");
			else setError("حدث خطأ ما");
			console.error("Login Error:", error);
		}
	};

	const handleGoogleSignIn = async () => {
		const provider = new GoogleAuthProvider();
		try {
			// Check for redirect result (if user is returning from Google)
			const result = await signInWithPopup(auth, provider);
			if (result) {
				// User successfully signed in.  You can get user details from `result.user`.
				router.push("/dashboard");
				return;
			}
		} catch (err) {
			console.error("Error signing in with Google:", err);
			setError("حدث خطأ أثناء تسجيل الدخول باستخدام جوجل.");
		}
	};

	return (
		<div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
					تسجيل الدخول
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

						{error && (
							<p className="text-red-500 text-sm text-center">{error}</p>
						)}

						<div>
							<button
								type="submit"
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								تسجيل الدخول
							</button>
						</div>
						<div>
							<button
								onClick={handleGoogleSignIn}
								type="button"
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
							>
								تسجيل الدخول باستخدام جوجل
								<RiGoogleFill className="mr-2" />
							</button>
						</div>
						<div className="space-y-3">
							<div className="text-center mt-4 ">
								<Link
									href="/password-reset"
									className="text-sm text-blue-600 hover:underline"
								>
									نسيت كلمة المرور؟
								</Link>
							</div>
							<div className="text-center  text-sm text-gray-600">
								ليس لديك حساب؟{" "}
								<Link href="/register" className="text-blue-600">
									إنشاء حساب
								</Link>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
