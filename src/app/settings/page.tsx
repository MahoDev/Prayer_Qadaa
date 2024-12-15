"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { auth, db } from "../lib/firebase";
import {
	query,
	doc,
	getDoc,
	updateDoc,
	deleteDoc,
	collection,
	where,
	getDocs,
	writeBatch,
} from "firebase/firestore";
import {
	deleteUser,
	onAuthStateChanged,
	updateProfile,
	updateEmail,
	reauthenticateWithCredential,
	EmailAuthProvider,
	updatePassword,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
	const [user, setUser] = useState<any>(null); // Initialize user to null
	const [name, setName] = useState("");
	const [profilePicture, setProfilePicture] = useState<string | null>(null); // Store profile picture as base64 or null
	const [newEmail, setNewEmail] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	const router = useRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				setUser(user);
				setName(user.displayName || ""); // Set initial name
				const userDocRef = doc(db, "users", user.uid);
				const userDocSnap = await getDoc(userDocRef); // Try to get user data from Firestore
				if (userDocSnap.exists()) {
					setProfilePicture(userDocSnap.data().profilePicture || null); // Set profile picture from Firestore
				}
			} else {
				// User is signed out
				setUser(null);
			}
		});
		return () => unsubscribe(); // Unsubscribe when component unmounts
	}, []);

	const handleNameChange = async () => {
		if (!user) return;

		try {
			// Update Firebase auth profile
			await updateProfile(user, { displayName: name });
			await updateDoc(doc(db, "users", user.uid), { name });
			toast.success("تم تحديث الاسم بنجاح.");
		} catch (error) {
			console.error("Error updating name:", error);
			toast.error("حدث خطأ ما.");
		}
	};

	const handleProfilePictureChange = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];

		if (!file) return;

		const MAX_WIDTH = 200; // Maximum width of the resized image
		const MAX_HEIGHT = 200; // Maximum height of the resized image

		try {
			const img = new Image();
			img.src = URL.createObjectURL(file);

			img.onload = async () => {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");

				let width = img.width;
				let height = img.height;

				if (width > height) {
					if (width > MAX_WIDTH) {
						height *= MAX_WIDTH / width;
						width = MAX_WIDTH;
					}
				} else {
					if (height > MAX_HEIGHT) {
						width *= MAX_HEIGHT / height;
						height = MAX_HEIGHT;
					}
				}

				canvas.width = width;
				canvas.height = height;
				ctx?.drawImage(img, 0, 0, width, height); // Draw the resized image onto the canvas

				const resizedImageDataUrl = canvas.toDataURL("image/jpeg", 0.7); // Convert to base64 with reduced quality

				console.log("New profile picture base64:", resizedImageDataUrl); // Log the resized base64 string

				await updateDoc(doc(db, "users", user.uid), {
					profilePicture: resizedImageDataUrl, // Store the resized image
				});

				setProfilePicture(resizedImageDataUrl);
				toast.success("تم تحديث صورة الملف الشخصي.");

				URL.revokeObjectURL(img.src); // Clean up created URL
			};
		} catch (error) {
			console.error("Error updating profile picture:", error);
			toast.error("حدث خطأ ما.");
		}
	};

	const handleChangeEmail = async () => {
		if (!user) return;
		if (newEmail === user.email) {
			toast.error(
				"البريد الإلكتروني الجديد يجب أن يكون مختلفًا عن البريد الإلكتروني الحالي."
			);
			return;
		}

		try {
			// 1. Reauthenticate the user (required for sensitive operations like email update)
			const credential = EmailAuthProvider.credential(
				user.email,
				currentPassword
			);
			await reauthenticateWithCredential(user, credential);

			// 2. Update the email
			await updateEmail(user, newEmail);

			// Update user's email in Firestore
			await updateDoc(doc(db, "users", user.uid), { email: newEmail });

			toast.success("تم تغيير البريد الإلكتروني بنجاح");
			setNewEmail(""); // Clear new email input
			setCurrentPassword(""); // Clear current password input
		} catch (error) {
			if ((error as any).message.includes("auth/wrong-password"))
				toast.error("كلمة المرور غير صحيحة");
			else toast.error("حدث خطأ ما");
		}
	};

	const handleChangePassword = async () => {
		if (!user) return;

		if (newPassword !== confirmPassword) {
			return toast.error(
				"كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين."
			);
		}

		if (newPassword.length < 6) {
			return toast.error(
				"كلمة المرور قصيرة جدًا. يجب أن تتكون من 6 أحرف على الأقل"
			);
		}

		try {
			// 1. Reauthenticate the user (required for sensitive operations)
			const credential = EmailAuthProvider.credential(
				user.email,
				currentPassword
			);
			await reauthenticateWithCredential(user, credential);

			// 2. Update the password
			await updatePassword(user, newPassword);
			toast.success("تم تغيير كلمة المرور بنجاح.");

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error: any) {
			if (error.code === "auth/weak-password") {
				toast.error("كلمة المرور ضعيفة جدًا.");
			} else if (error.code === "auth/wrong-password") {
				toast.error("كلمة المرور القديمة غير صحيحة");
			} else {
				toast.error("حدث خطأ ما");
			}
		}
	};

	const handleDeleteAccount = async () => {
		if (!user) return;

		try {
			const credential = EmailAuthProvider.credential(
				user.email,
				currentPassword
			);
			await reauthenticateWithCredential(user, credential);
		} catch (error) {
			if ((error as any).message.includes("auth/wrong-password"))
				toast.error("كلمة المرور غير صحيحة");
			else toast.error("حدث خطأ ما");
			return; // Return early if reauthentication fails
		}

		try {
			// 1. Delete completed prayers (batch delete)
			const completedPrayersQuery = query(
				collection(db, "completedPrayers"),
				where("userId", "==", user.uid)
			);
			const completedPrayersSnapshot = await getDocs(completedPrayersQuery);
			const batch = writeBatch(db);

			completedPrayersSnapshot.forEach((doc) => {
				batch.delete(doc.ref);
			});

			await batch.commit();

			// 2. Delete Qadaa plans (you'll need to implement this part)
			// Query Firestore to get the plan IDs associated with the user
			const qadaaPlansQuery = query(
				collection(db, "qadaaPlans"),
				where("userId", "==", user.uid)
			);
			const qadaaPlansSnapshot = await getDocs(qadaaPlansQuery);
			// batch delete
			qadaaPlansSnapshot.forEach((doc) => {
				batch.delete(doc.ref);
			});
			await batch.commit();
			const scheduledRemindersQuery = query(
				collection(db, "scheduledReminders"),
				where("userId", "==", user.uid)
			);
			const scheduledRemindersSnapshot = await getDocs(scheduledRemindersQuery);
			scheduledRemindersSnapshot.forEach((doc) => batch.delete(doc.ref));
			await batch.commit();

			// 3. Delete user data from Firestore

			const usersRef = doc(db, "users", user.uid);
			await deleteDoc(usersRef);

			// 4. Delete user from Firebase Auth

			await deleteUser(user);

			toast.success("تم حذف الحساب بنجاح.");
			router.push("/login");
			setCurrentPassword(""); // Clear the password field after successful deletion
		} catch (error) {
			toast.error("حدث خطأ ما.");
		}
		setShowDeleteConfirmation(false);
	};

	return (
		<Layout>
			{/* Confirmation dialog for account deletion */}
			{showDeleteConfirmation && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white p-6 rounded shadow-md">
						<p className="text-gray-700 mb-4">
							هل أنت متأكد أنك تريد حذف حسابك؟ سيتم حذف جميع بياناتك.
						</p>
						<div className="flex justify-end">
							<button
								onClick={() => setShowDeleteConfirmation(false)}
								className="mr-2 py-2 px-4 rounded border border-gray-300 hover:bg-gray-100"
							>
								إلغاء
							</button>
							<button
								onClick={handleDeleteAccount}
								className="py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
							>
								تأكيد
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="container mx-auto px-4 py-8">
				<h2 className="text-2xl font-bold mb-4 text-gray-900">الإعدادات</h2>

				{/* Profile Information */}
				{user && ( // Only show profile settings if user is signed in
					<div className="bg-white rounded-lg p-6 shadow mb-8">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							معلومات الملف الشخصي
						</h3>

						<div className="mb-4">
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-700"
							>
								الاسم
							</label>
							<div className="flex">
								{" "}
								{/* Use flexbox for layout */}
								<input
									type="text"
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="border border-gray-300 rounded-md px-3 py-2 mr-2 w-full sm:w-auto focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
								<button
									onClick={handleNameChange}
									className="shrink-0 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
								>
									تغيير
								</button>
							</div>
						</div>

						<div className="mb-4">
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700"
							>
								البريد الإلكتروني
							</label>
							<input
								type="email"
								id="email"
								value={user.email}
								disabled
								className="border border-gray-300 rounded-md px-3 py-2 bg-gray-100 w-full sm:w-auto focus:outline-none"
							/>
						</div>
						<div className="mb-4">
							<label
								htmlFor="newEmail"
								className="block text-sm font-medium text-gray-700"
							>
								البريد الإلكتروني الجديد
							</label>
							<input
								type="email"
								id="newEmail"
								name="newEmail"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div className="mb-4">
							<label
								htmlFor="currentPassword"
								className="block text-sm font-medium text-gray-700"
							>
								كلمة المرور الحالية
							</label>
							<input
								id="currentPassword"
								name="currentPassword"
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<button
							onClick={handleChangeEmail}
							className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700"
						>
							تغيير البريد الإلكتروني
						</button>

						<div className="mt-6">
							{" "}
							{/* Added some spacing */}
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								{" "}
								تغيير كلمة المرور
							</h3>
							<div className="mb-4">
								<label
									htmlFor="currPassword"
									className="block text-sm font-medium text-gray-700"
								>
									كلمة المرور الحالية
								</label>
								<input
									type="password"
									id="currPassword"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>
							<div className="mb-4">
								<label
									htmlFor="newPassword"
									className="block text-sm font-medium text-gray-700"
								>
									كلمة المرور الجديدة
								</label>
								<input
									type="password"
									id="newPassword"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>
							<div className="mb-4">
								<label
									htmlFor="confirmPassword"
									className="block text-sm font-medium text-gray-700"
								>
									تأكيد كلمة المرور الجديدة
								</label>
								<input
									type="password"
									id="confirmPassword"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>
							<button
								onClick={handleChangePassword}
								className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700"
							>
								تغيير كلمة المرور
							</button>
						</div>
						{/* Profile picture upload */}
						<div className="mb-4">
							<label
								htmlFor="profilePicture"
								className="block text-sm font-medium text-gray-700 mt-3"
							>
								صورة الملف الشخصي
							</label>
							<input
								type="file"
								id="profilePicture"
								accept="image/*"
								onChange={handleProfilePictureChange}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
							{profilePicture && (
								<div className="mt-2">
									<img
										src={profilePicture}
										alt="Profile"
										className="h-24 w-24 rounded-full object-cover"
									/>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Delete Account Button */}
				{user && (
					<div className="mt-6">
						<button
							onClick={() => setShowDeleteConfirmation(true)}
							className="py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
						>
							حذف الحساب
						</button>
					</div>
				)}
			</div>
		</Layout>
	);
}
