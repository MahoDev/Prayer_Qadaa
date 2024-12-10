"use client";
import { useState, useEffect } from "react";
import {
	doc,
	increment,
	onSnapshot,
	serverTimestamp,
	updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";
import {
	format,
	addYears,
	differenceInDays,
	differenceInYears,
} from "date-fns";
import { onAuthStateChanged } from "firebase/auth";
import {
	prayerNamesArabic,
	prayerNames,
	PrayerType,
} from "@/app/lib/prayerConstants";
import Layout from "../components/Layout";
import { ToastContainer, toast } from "react-toastify"; // For displaying toast messages
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for react-toastify
import { Metadata } from "next";

const metadata: Metadata = {
	title: "الصلوات الفائتة",
	description: "صفحة لتسجيل الصلوات الفائتة وتعديلها أو حذفها",
};

export default function MissedPrayersPage() {
	const [missedPrayers, setMissedPrayers] = useState<
		Record<PrayerType, number>
	>({
		fajr: 0,
		dhur: 0,
		asr: 0,
		maghrib: 0,
		isha: 0,
	});
	const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1); // Use union type for clarity
	const [birthDate, setBirthDate] = useState("");
	const [pubertyAge, setPubertyAge] = useState("");
	const [prayerStartAge, setPrayerStartAge] = useState("");
	const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
	const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
	const [editingPrayer, setEditingPrayer] = useState<PrayerType | null>(null);
	const [editValue, setEditValue] = useState(0);
	const [showResetConfirmation, setShowResetConfirmation] = useState(false);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				const missedPrayersRef = doc(db, "missedPrayers", user.uid);
				const unsubscribeMissedPrayers = onSnapshot(missedPrayersRef, (doc) => {
					if (doc.exists()) {
						console.log("missed prayers doc exists");
						setMissedPrayers(doc.data() as Record<PrayerType, number>);
					} else {
						createMissedPrayersDocument(user.uid);
					}
				});
				return () => {
					unsubscribeMissedPrayers();
					unsubscribe();
				};
			}
		});
	}, []);

	const createMissedPrayersDocument = async (userId: string) => {
		/* ...  */
	};

	const logPrayer = async (
		prayerName: PrayerType,
		amount: number,
		missedPrayersRef: any
	) => {
		try {
			await updateDoc(missedPrayersRef, {
				[prayerName]: increment(amount), // Increment the specific prayer type
				lastUpdated: serverTimestamp(),
			});
		} catch (error) {
			console.error("Error logging prayer:", error);
		}
	};

	const handleLogPrayer = async (prayerName: PrayerType, amount: number) => {
		const userId = auth.currentUser?.uid;
		if (!userId) return toast.error("يرجى تسجيل الدخول");

		const missedPrayersRef = doc(db, "missedPrayers", userId);
		logPrayer(prayerName, amount, missedPrayersRef);
	};

	const handleMethod1 = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		try {
			for (let i = 0; i < prayerNames.length; i++) {
				const amount = parseInt(formData.get(prayerNames[i]) as string) || 0;
				formData.set(prayerNames[i], "0");
				handleLogPrayer(prayerNames[i] as PrayerType, amount);
			}
			toast.success("تم تسجيل الصلاة بنجاح");
		} catch (error) {
			toast.error("حدث خطأ ما");
		}
	};

	const handleMethod2 = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const userId = auth.currentUser?.uid;
		if (!userId) return toast.error("يرجى تسجيل الدخول");
		const missedPrayersRef = doc(db, "missedPrayers", userId);

		try {
			const birthDateObj = new Date(birthDate);
			const pubertyAgeNum = parseInt(pubertyAge);
			const prayerStartAgeNum = parseInt(prayerStartAge);

			// Input validation
			if (isNaN(pubertyAgeNum) || isNaN(prayerStartAgeNum)) {
				return toast.error(
					"الرجاء إدخال أرقام صحيحة لسن البلوغ و سن بدء الصلاة"
				);
			}
			if (pubertyAgeNum <= 0 || prayerStartAgeNum <= 0) {
				console.log("error toast");

				return toast.error(
					"الرجاء إدخال أرقام موجبة لسن البلوغ و سن بدء الصلاة"
				);
			}
			if (prayerStartAgeNum < pubertyAgeNum) {
				return toast.error(
					"سن بدء الصلاة يجب ان يكون اكبر من او يساوي سن البلوغ"
				);
			}
			if (birthDateObj >= new Date()) {
				return toast.error("تاريخ الميلاد يجب أن يكون في الماضي.");
			}
			const age = differenceInYears(new Date(), birthDateObj);
			if (pubertyAgeNum > age || prayerStartAgeNum > age) {
				return toast.error(
					"سن البلوغ و سن بدء الصلاة يجب أن يكونا أقل من أو يساوي عمرك الحالي."
				);
			}

			const prayerStartDateObj = addYears(birthDateObj, prayerStartAgeNum); // Calculate Prayer start date

			const diff = differenceInDays(new Date(), prayerStartDateObj);
			const prayersMissedTotal = diff * prayerNames.length;

			// Log the prayers
			prayerNames.forEach((prayerName) =>
				logPrayer(
					prayerName as PrayerType,
					prayersMissedTotal,
					missedPrayersRef
				)
			);
		} catch (error) {
			console.error("Error calculating missed prayers:", error);
			toast.error(
				"حدث خطأ أثناء حساب الصلوات الفائتة، يرجى التحقق من صحة البيانات المدخلة"
			);
		}
	};

	const handleMethod3 = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const userId = auth.currentUser?.uid;
		if (!userId) return toast.error("يرجى تسجيل الدخول");
		const missedPrayersRef = doc(db, "missedPrayers", userId);

		try {
			const startDateObj = new Date(startDate);
			const endDateObj = new Date(endDate);
			const diff = differenceInDays(endDateObj, startDateObj);

			if (diff < 0)
				return toast.error("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");

			const prayersMissedTotal = diff * prayerNames.length;
			prayerNames.forEach((prayerName) =>
				logPrayer(
					prayerName as PrayerType,
					prayersMissedTotal,
					missedPrayersRef
				)
			);
		} catch (error) {
			toast.error("حدث خطأ، يرجى التأكد من صحة التواريخ");
		}
	};

	const handleEditClick = (prayerType: PrayerType, currentValue: number) => {
		setEditingPrayer(prayerType);
		setEditValue(currentValue);
	};

	const handleEditSave = async (prayerType: PrayerType, newValue: number) => {
		const userId = auth.currentUser?.uid;
		if (!userId) return toast.error("يرجى تسجيل الدخول");
		const missedPrayersRef = doc(db, "missedPrayers", userId);

		try {
			const diff = newValue - (missedPrayers[prayerType] || 0);
			logPrayer(prayerType, diff, missedPrayersRef);

			setEditingPrayer(null);
		} catch (e) {
			toast.error("حدث خطأ ما");
		}
	};

	const handleResetConfirm = async () => {
		// Separate confirm function
		await handleReset();
		setShowResetConfirmation(false);
	};

	const handleReset = async () => {
		const userId = auth.currentUser?.uid;
		if (!userId) return toast.error("يرجى تسجيل الدخول");
		const missedPrayersRef = doc(db, "missedPrayers", userId);

		try {
			// Update all prayer types to 0
			const updates: Partial<Record<PrayerType, number>> = {}; // Create an object with updated prayer counts
			prayerNames.forEach((prayerName) => {
				updates[prayerName as PrayerType] = 0;
			});
			await updateDoc(missedPrayersRef, updates); // Update Firestore

			setMissedPrayers((prevMissedPrayers) => ({
				...prevMissedPrayers,
				...updates,
			}));

			toast.success("تمت إعادة تعيين جميع الصلوات بنجاح.");
		} catch (error) {
			toast.error("حدث خطأ ما");
		}
	};

	return (
		<Layout>
			<div className="container mx-auto px-4 py-8">
				<h2 className="text-2xl font-bold mb-4 text-gray-900">
					سجل الصلوات الفائتة
				</h2>

				{/* Tab-like Navigation */}
				<div className="flex border-b border-gray-200 mb-6">
					{[1, 2, 3].map((methodNumber) => (
						<button
							key={methodNumber}
							onClick={() => setActiveTab(methodNumber as 1 | 2 | 3)} // Type assertion
							className={`py-2 px-4 text-gray-700 border-b-2 ${
								activeTab === methodNumber
									? "border-blue-500 text-blue-500 font-semibold"
									: "border-transparent hover:text-gray-900"
							}`}
						>
							{methodNumber === 1
								? "إدخال يدوي"
								: methodNumber === 2
								? "حسب تاريخ البلوغ"
								: "حسب تاريخ معين"}
						</button>
					))}
				</div>

				{/* Method 1: Manual Input */}
				{activeTab === 1 && (
					<form onSubmit={handleMethod1}>
						<div className="grid grid-cols-2 gap-4 mb-4">
							{prayerNames.map((prayerName) => (
								<div key={prayerName}>
									<label
										htmlFor={prayerName}
										className="block text-sm font-medium text-gray-700"
									>
										{prayerNamesArabic[prayerName]}
									</label>
									<input
										type="number"
										id={prayerName}
										name={prayerName}
										className="mt-1 p-2 block w-full text-gray-500  rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm mr-1"
										min="0"
									/>
								</div>
							))}
						</div>
						<button
							type="submit"
							className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700"
						>
							تسجيل
						</button>
					</form>
				)}

				{/* Method 2: by Taklif/puberty Date */}
				{activeTab === 2 && (
					<form onSubmit={handleMethod2} className="mb-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label
									htmlFor="birthDate"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									تاريخ الميلاد
								</label>
								<input
									type="date"
									id="birthDate"
									name="birthDate"
									value={birthDate}
									onChange={(e) => setBirthDate(e.target.value)}
									className="block p-2 w-full text-gray-500 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								/>
							</div>
							<div>
								<label
									htmlFor="pubertyAge"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									سن البلوغ
								</label>
								<input
									type="number"
									id="pubertyAge"
									name="pubertyAge"
									value={pubertyAge}
									onChange={(e) => setPubertyAge(e.target.value)}
									className="block p-2 w-full text-gray-500 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									min="0"
								/>
							</div>
							<div>
								<label
									htmlFor="prayerStartAge"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									سن بدء الصلاة
								</label>
								<input
									type="number"
									id="prayerStartAge"
									name="prayerStartAge"
									value={prayerStartAge}
									onChange={(e) => setPrayerStartAge(e.target.value)}
									className="block p-2 w-full text-gray-500 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									min="0"
								/>
							</div>
						</div>
						<button
							type="submit"
							className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700 mt-4"
						>
							حساب
						</button>
					</form>
				)}

				{/* Method 3: Date Range */}
				{activeTab === 3 && (
					<form onSubmit={handleMethod3}>
						<div className="grid grid-cols-2 gap-4 mb-4">
							<div>
								<label
									htmlFor="startDate"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									تاريخ البداية
								</label>
								<input
									type="date"
									id="startDate"
									name="startDate"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="block p-2 w-full text-gray-500 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								/>
							</div>
							<div>
								<label
									htmlFor="endDate"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									تاريخ النهاية
								</label>
								<input
									type="date"
									id="endDate"
									name="endDate"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="block p-2 w-full text-gray-500 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								/>
							</div>
						</div>

						<button
							type="submit"
							className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700"
						>
							حساب
						</button>
					</form>
				)}

				{/* Reset Confirmation Overlay */}
				{showResetConfirmation && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
						<div className="bg-white p-6 rounded shadow-md">
							<p className="text-gray-700 mb-4">
								هل أنت متأكد أنك تريد إعادة تعيين كل الصلوات الفائتة؟
							</p>
							<div className="flex justify-end">
								<button
									onClick={() => setShowResetConfirmation(false)}
									className="mr-2 py-2 px-4 rounded border text-white border-gray-300 bg-red-500 hover:bg-red-600"
								>
									إلغاء
								</button>
								<button
									onClick={handleResetConfirm}
									className="py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
								>
									تأكيد
								</button>
							</div>
						</div>
					</div>
				)}
				{/* Display Missed Prayers */}

				<div className="mt-8">
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						الصلوات الفائتة
					</h3>
					<ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
						{prayerNames.map((prayerName) => (
							<li
								key={prayerName}
								className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
							>
								<div className="w-0 flex-1 flex items-center">
									<span className="ml-2 flex-1 w-0 truncate text-gray-900">
										{prayerNamesArabic[prayerName]}
									</span>
								</div>
								<div className="ml-4 flex-shrink-0 relative">
									{editingPrayer === prayerName ? ( // Conditional rendering for edit input
										<div>
											<input
												type="number"
												value={editValue}
												onChange={(e) => {
													if (!isNaN(parseInt(e.target.value)))
														// type checking and restriction to numbers only
														setEditValue(parseInt(e.target.value));
												}}
												className="w-20 border border-gray-300 rounded px-2"
											/>
											<button
												onClick={() =>
													handleEditSave(prayerName as PrayerType, editValue)
												}
												className="ml-2 px-2 py-1 bg-green-500 text-white rounded"
											>
												حفظ
											</button>
										</div>
									) : (
										<span className="font-medium text-gray-900">
											{missedPrayers[prayerName as PrayerType] || 0}
										</span>
									)}

									<button
										onClick={() => {
											if (editingPrayer !== prayerName) {
												handleEditClick(
													prayerName,
													missedPrayers[prayerName] || 0
												);
											} else {
												setEditingPrayer(null);
												setEditValue(0);
											}
										}}
										className={`ml-2 text-blue-500 hover:underline ${
											editingPrayer === prayerName ? "text-red-500" : ""
										}`}
									>
										{editingPrayer === prayerName ? "إلغاء" : "تعديل"}{" "}
									</button>
								</div>
							</li>
						))}
					</ul>
					<button
						onClick={() => setShowResetConfirmation(true)}
						className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
					>
						إعادة تعيين الكل
					</button>
				</div>
			</div>
		</Layout>
	);
}
