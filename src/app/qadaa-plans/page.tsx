"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { addDays, differenceInDays, format } from "date-fns";
import {
	prayerNames,
	prayerNamesArabic,
	PrayerType,
} from "../lib/prayerConstants";
import {
	collection,
	addDoc,
	getDocs,
	query,
	where,
	doc,
	getDoc,
	updateDoc,
	deleteDoc,
	Timestamp,
	writeBatch,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { CheckIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { toast } from "react-toastify";

import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, Unsubscribe } from "firebase/auth";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { requestNotificationPermission } from "../lib/NotificationHandler";

// Types
interface QadaaPlan {
	id?: string;
	name: string;
	userId: string;
	startDate: Timestamp;
	endDate: Timestamp;
	targets: Record<PrayerType, number>;
	progress: Record<PrayerType, number>;
	reminderSettings: {
		type: "none" | "custom";
		customTime: string | null;
	};
}

const durationOptions = [
	{ value: "7", label: "7 أيام" },
	{ value: "14", label: "14 يوم" },
	{ value: "30", label: "30 يوم" },
	{ value: "custom", label: "مخصص" },
];

const initialPlanState: QadaaPlan = {
	userId: "",
	name: "",
	startDate: Timestamp.fromDate(new Date()),
	endDate: Timestamp.fromDate(addDays(new Date(), 7)),
	targets: prayerNames.reduce(
		(acc, prayerName) => ({ ...acc, [prayerName]: 0 }),
		{
			fajr: 0,
			dhur: 0,
			asr: 0,
			maghrib: 0,
			isha: 0,
		}
	),
	progress: prayerNames.reduce(
		(acc, prayerName) => ({ ...acc, [prayerName]: 0 }),
		{
			fajr: 0,
			dhur: 0,
			asr: 0,
			maghrib: 0,
			isha: 0,
		}
	),
	reminderSettings: {
		type: "none",
		customTime: null,
	},
};

export default function QadaaPlanPage() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const planId = searchParams.get("planId");
	const [isEditing, setIsEditing] = useState(false);
	const router = useRouter();
	const [plan, setPlan] = useState<QadaaPlan>(initialPlanState);
	const [duration, setDuration] = useState(durationOptions[0]);
	const [loading, setLoading] = useState(false);
	const [selectedDurationIndex, setSelectedDurationIndex] = useState(0); // Keep track of selected index
	const [customEndDate, setCustomEndDate] = useState<string | null>(null);
	const [existingPlans, setExistingPlans] = useState<any[]>([]);
	const [showForm, setShowForm] = useState(false);

	useEffect(() => {
		requestNotificationPermission(auth.currentUser?.uid); // Request permission when the component mounts
	}, []);

	const fetchExistingPlans = async (userId: string) => {
		try {
			const q = query(
				collection(db, "qadaaPlans"),
				where("userId", "==", userId)
			);
			const querySnapshot = await getDocs(q);
			const plansData: QadaaPlan[] = querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					name: data.name || "",
					userId: data.userId,
					startDate: data.startDate,
					endDate: data.endDate || null,
					targets: data.targets,
					progress: data.progress,
					reminderSettings: {
						type: data.reminderSettings.type,
						customTime: data.reminderSettings.customTime || null,
						lastNotified: data.reminderSettings.lastNotified || null,
					},
				};
			});
			setExistingPlans(plansData);
		} catch (error) {
			console.error("Error fetching existing plans:", error);
			toast.error("حدث خطأ ما"); // Or a more specific error message
		}
	};
	useEffect(() => {
		// Fetch existing plans when the component mounts

		let unsubscribeAuth: Unsubscribe | null = null;
		unsubscribeAuth = onAuthStateChanged(auth, (user) => {
			if (user) {
				fetchExistingPlans(user.uid); // Fetch existing plans when user is authenticated
			}
			return () => {
				if (unsubscribeAuth) {
					unsubscribeAuth();
				}
			};
		});
	}, []);

	useEffect(() => {
		const fetchPlan = async (planId: string) => {
			setLoading(true);
			try {
				const planDocRef = doc(db, "qadaaPlans", planId);
				const planDocSnap = await getDoc(planDocRef);

				if (planDocSnap.exists()) {
					const fetchedPlan = planDocSnap.data();
					setPlan({
						...initialPlanState,
						...fetchedPlan,
						id: planDocSnap.id,
					} as QadaaPlan);

					// Set duration
					if (fetchedPlan.endDate) {
						const diffInDays = differenceInDays(
							fetchedPlan.endDate.toDate(),
							fetchedPlan.startDate.toDate()
						); //differenceInDays
						const durationOption = durationOptions.find(
							(option) => parseInt(option.value) === diffInDays
						);
						setDuration(
							durationOption || durationOptions[durationOptions.length - 1]
						); // Select "Custom" if no match
						setCustomEndDate(
							format(fetchedPlan.endDate.toDate(), "yyyy-MM-dd")
						);
					} else {
						setDuration(
							durationOptions.find((option) => option.value === "custom") ||
								durationOptions[0]
						);
						setCustomEndDate(null); // Reset custom end date if plan is ongoing
					}

					setIsEditing(true); // Set isEditing to true *after* fetching the plan data
				} else {
					toast.error("خطة القضاء غير موجودة");
					setIsEditing(false); // Set isEditing to false if plan not found
					router.push("/qadaa-plans"); // Redirect to the main plans page
				}
			} catch (error) {
				// ... error handling ...
			} finally {
				setLoading(false);
			}
		};

		if (planId) {
			fetchPlan(planId);
		} else {
			setIsEditing(false); // Set isEditing to false if no planId
			setPlan({
				...initialPlanState,
				startDate: Timestamp.fromDate(new Date()),
			}); // reset plan state
		}
	}, [planId]);

	const handleCreateNewPlan = () => {
		///reset
		setPlan(initialPlanState);
		setDuration(durationOptions[0]);
		setCustomEndDate(null);
		setIsEditing(false);
		setShowForm(true);
	};

	useEffect(() => {
		if (planId) {
			setShowForm(true); // Show form if planId is present (editing mode)
		}
	}, [planId]);

	const handleSavePlan = async () => {
		const userId = auth.currentUser?.uid;
		if (!userId) return toast.error("يرجى تسجيل الدخول");

		const planToSave: any = { ...plan, userId }; // Add userId to the plan

		// Check if all targets are 0
		const allTargetsZero = prayerNames.every(
			(prayerName) => plan.targets[prayerName] === 0
		);

		if (allTargetsZero) {
			toast.error("يجب تعيين هدف واحد على الأقل."); // Or a similar error message
			return; // Prevent saving the plan
		}
		try {
			let planId: string;
			if (isEditing && plan.id) {
				planId = plan.id as string;

				await updateDoc(doc(db, "qadaaPlans", planId), planToSave);
				toast.success("تم تعديل خطة القضاء بنجاح");
			} else {
				const newPlanRef = await addDoc(
					collection(db, "qadaaPlans"),
					planToSave
				);
				planId = newPlanRef.id; // Set planId from new document reference
				toast.success("تم إنشاء خطة القضاء بنجاح");
				setPlan({
					...initialPlanState,
					startDate: Timestamp.fromDate(new Date()),
				}); // Reset the form, but maintain current date for startDate
				setDuration(durationOptions[0]);
			}

			const userId = auth.currentUser?.uid;
			if (userId) {
				fetchExistingPlans(userId); // Call after save/update
			}

			if (planToSave.reminderSettings.type === "custom") {
				if (!planToSave.reminderSettings.customTime)
					return toast.error("يرجى تحديد وقت مخصص");

				// If editing and reminders exist, update or delete the reminders
				if (isEditing && planId) {
					await updateOrDeleteReminders(
						planId,
						userId as string,
						planToSave.reminderSettings.customTime
					);
				} else {
					// When creating new plan schedule as usual
					await scheduleReminder(
						planId,
						userId as string,
						planToSave.reminderSettings.customTime
					);
				}
			} else if (isEditing && planId && plan.reminderSettings.type === "none") {
				// Remove reminders if reminder type is changed to 'none' while editing
				const q = query(
					collection(db, "scheduledReminders"),
					where("planId", "==", planId)
				);
				const remindersSnapshot = await getDocs(q);
				//batch delete
				const batch = writeBatch(db);
				remindersSnapshot.forEach((doc) => {
					batch.delete(doc.ref);
				});

				await batch.commit();
			}
		} catch (error) {
			console.error("Error saving plan:", error);
			toast.error("حدث خطأ ما");
		}
	};

	// Helper function to update existing reminders or delete them if the prayer is no longer in the plan
	async function updateOrDeleteReminders(
		planId: string,
		userId: string,
		reminderTime: string,
		upsert = false
	) {
		try {
			const q = query(
				collection(db, "scheduledReminders"),
				where("planId", "==", planId)
			);
			const remindersSnapshot = await getDocs(q);
			const reminders = remindersSnapshot.docs.map((doc) => ({
				...doc.data(),
				id: doc.id,
			}));

			// Create or update a reminder for the custom time
			await scheduleReminder(planId, userId, reminderTime, true); // Set upsert to true
		} catch (error) {
			console.error("Error updating or deleting reminders:", error);
			toast.error("حدث خطأ ما");
		}
	}

	const scheduleReminder = async (
		planId: string,
		userId: string,
		reminderTime: string,
		upsert = false
	) => {
		try {
			const [hours, minutes] = reminderTime.split(":").map(Number);
			const nextReminderTime = new Date();
			nextReminderTime.setHours(hours);
			nextReminderTime.setMinutes(minutes);
			nextReminderTime.setSeconds(0);

			const reminderData = {
				planId,
				userId,
				reminderTime,
				nextReminderTime: Timestamp.fromDate(nextReminderTime), // Store as Timestamp
				sent: false,
			};

			// Check if a reminder already exists for the same custom time
			const q = query(
				collection(db, "scheduledReminders"),
				where("planId", "==", planId)
			);
			const querySnapshot = await getDocs(q);

			if (querySnapshot.size > 0) {
				if (upsert) {
					// Update the existing reminder if upsert is true
					const reminderDoc = querySnapshot.docs[0];
					await updateDoc(reminderDoc.ref, reminderData);
					toast.success("تم تحديث التذكير بنجاح.");
				}
			} else {
				const newReminder = await addDoc(
					collection(db, "scheduledReminders"),
					reminderData
				); // Create a new reminder
				toast.success("تم جدولة التذكير بنجاح.");
			}
		} catch (error) {
			console.error("Error scheduling reminder:", error);
			toast.error("حدث خطأ ما.");
		}
	};

	const handleDeletePlan = async (planId: string) => {
		try {
			await deleteDoc(doc(db, "qadaaPlans", planId));
			toast.success("تم حذف خطة القضاء بنجاح");
			// Refetch existing plans after deleting a plan
			const userId = auth.currentUser?.uid;
			if (userId) {
				fetchExistingPlans(userId);
			}
			// Redirect to the main qadaa-plans page after deleting
			router.push("/qadaa-plans");
		} catch (error) {
			console.error("Error deleting plan:", error);
			toast.error("حدث خطأ ما");
		}
	};

	const handleDurationSelect = (index: number) => {
		const selectedDuration = durationOptions[index];
		setSelectedDurationIndex(index);

		if (selectedDuration.value === "custom") {
			setCustomEndDate(format(plan.startDate.toDate(), "yyyy-MM-dd")); // Set initial custom end date to today
			setPlan((prevPlan) => ({ ...prevPlan })); // Clear endDate for custom duration
		} else {
			setCustomEndDate(null); // Clear custom end date if not custom duration
			const daysToAdd = parseInt(selectedDuration.value);
			const newEndDate = addDays(plan.startDate.toDate(), daysToAdd);
			setPlan((prevPlan) => ({
				...prevPlan,
				endDate: Timestamp.fromDate(newEndDate),
			}));
		}
	};

	const handleCustomEndDateChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setCustomEndDate(e.target.value);
		const newEndDate = new Date(e.target.value);
		if (newEndDate < plan.startDate.toDate())
			return toast.error("تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء");
		setPlan((prevPlan) => ({
			...prevPlan,
			endDate: Timestamp.fromDate(newEndDate),
		}));
	};

	const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newStartDate = new Date(e.target.value);
		if (newStartDate < new Date())
			return toast.error("تاريخ البدء يجب أن يكون بعد تاريخ اليوم");

		setPlan({ ...plan, startDate: Timestamp.fromDate(newStartDate) });

		// Recalculate end date based on selected duration if not custom
		if (durationOptions[selectedDurationIndex].value !== "custom") {
			const daysToAdd = parseInt(durationOptions[selectedDurationIndex].value);
			const newEndDate = addDays(newStartDate, daysToAdd);
			setPlan((prevPlan) => ({
				...prevPlan,
				endDate: Timestamp.fromDate(newEndDate),
			}));
		}
	};

	const progressPercentage = (prayerType: PrayerType) => {
		const target = plan.targets[prayerType] || 0; // Handle cases where target might be 0
		const currentProgress = plan.progress[prayerType] || 0;
		return target === 0
			? 100
			: Math.min(Math.round((currentProgress / target) * 100), 100); // Ensure percentage doesn't exceed 100.  Return 100 if target is 0 (to avoid division by 0).
	};

	return (
		<Layout>
			<div className="container mx-auto p-6">
				{" "}
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-bold mb-6 text-gray-900">خطط القضاء</h2>
					{/* Back button (only shown when editing, creating or viewing a plan) */}
					{(isEditing || planId || showForm) && ( // Show back button on detail screen
						<button
							onClick={() => {
								router.push("/qadaa-plans");
								setShowForm(false);
							}}
							className="text-blue-500 hover:underline"
						>
							رجوع
						</button>
					)}
				</div>
				{(isEditing || planId || showForm || existingPlans.length == 0) && (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleSavePlan();
						}}
					>
						<div className="mb-4">
							<label
								htmlFor="planName"
								className="block font-medium text-lg text-gray-800"
							>
								اسم الخطة
							</label>
							<input
								type="text"
								id="planName"
								name="planName"
								value={plan.name} // Bind to plan.name
								onChange={(e) => setPlan({ ...plan, name: e.target.value })}
								className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								required={!isEditing}
							/>
						</div>
						{/* Start Date */}
						<div className="mb-4">
							<label
								htmlFor="startDate"
								className="block  font-medium text-lg text-gray-800"
							>
								تاريخ البدء
							</label>
							<input
								type="date"
								id="startDate"
								name="startDate"
								onChange={handleStartDateChange}
								value={format(plan.startDate.toDate(), "yyyy-MM-dd", {})}
								className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								required
								min={format(new Date(), "yyyy-MM-dd")} // Set minimum date to plan's start date
							/>
						</div>

						{/* Duration Selection (Custom Card Design) */}
						<div className="mb-4">
							<h4 className="block font-medium text-lg text-gray-800">المدة</h4>
							<div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{durationOptions.map((option, index) => (
									<div
										key={option.value}
										className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer ${
											selectedDurationIndex === index
												? "bg-blue-50 border-blue-500"
												: "bg-white border-gray-200"
										}`}
										onClick={() => handleDurationSelect(index)}
									>
										<span className="text-gray-900">{option.label}</span>
										{selectedDurationIndex === index && (
											<CheckIcon className="text-blue-500 w-5 h-5" />
										)}{" "}
										{/* Show checkmark when selected */}
									</div>
								))}
							</div>
						</div>
						{/* Custom End Date Input (Conditionally rendered) */}
						{customEndDate && (
							<div className="mb-4">
								<label
									htmlFor="customEndDate"
									className="block font-medium text-lg text-gray-800"
								>
									تاريخ الانتهاء
								</label>
								<input
									type="date"
									id="customEndDate"
									name="customEndDate"
									value={customEndDate}
									onChange={handleCustomEndDateChange}
									className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									min={format(plan.startDate.toDate(), "yyyy-MM-dd", {})} // Set minimum date to plan's start date
								/>
							</div>
						)}

						{/* Prayer Targets */}
						<div className="mb-6">
							{" "}
							{/* Added margin */}
							<h4 className="font-medium text-lg text-gray-800 mb-2">
								أهداف خطة القضاء{" "}
							</h4>
							<div className="grid grid-cols-2 gap-4">
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
											value={plan.targets[prayerName]}
											onChange={(e) =>
												setPlan({
													...plan,
													targets: {
														...plan.targets,
														[prayerName]: parseInt(e.target.value) || 0,
													},
												})
											}
											className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
											min="0"
											required
										/>
									</div>
								))}
							</div>
						</div>

						{/* Reminder Settings */}
						<div className="mb-4">
							<label
								htmlFor="reminderType"
								className="block font-medium text-lg text-gray-800"
							>
								وقت التذكير
							</label>
							<select
								id="reminderType"
								name="reminderType"
								value={plan.reminderSettings.type}
								onChange={(e) =>
									setPlan({
										...plan,
										reminderSettings: {
											...plan.reminderSettings,
											type: e.target.value as "none" | "custom",
											customTime:
												e.target.value === "none"
													? null
													: plan.reminderSettings.customTime,
										}, // Reset customTime if "none" is selected
									})
								}
								className="mt-1 text-gray-500 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							>
								<option value="none">بدون تذكير</option>{" "}
								<option value="custom">وقت مخصص</option>
							</select>

							{plan.reminderSettings.type === "custom" ? ( // Conditionally render custom time input
								<div className="mt-2">
									<label
										htmlFor="customTime"
										className="block text-sm font-medium text-gray-700"
									>
										وقت مخصص (يوميا)
									</label>
									<input
										type="time"
										id="customTime"
										name="customTime"
										value={plan.reminderSettings.customTime || ""} // Provide a default value or handle null
										onChange={(e) =>
											setPlan({
												...plan,
												reminderSettings: {
													...plan.reminderSettings,
													customTime: e.target.value,
												},
											})
										}
										className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
										required={
											plan.reminderSettings.type === "custom" ||
											plan.reminderSettings.type === "both"
										} //Make only required if selected
									/>
								</div>
							) : null}
						</div>

						<div className="flex justify-end mt-6">
							{" "}
							{/* Added margin-top and flex container */}
							{isEditing && ( // Only show Delete button when editing
								<button
									type="button" // Change to type="button"
									onClick={() => handleDeletePlan(plan.id as string)}
									className="mr-4 py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
								>
									حذف الخطة
								</button>
							)}
							<button
								type="submit"
								className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700"
							>
								{isEditing ? "حفظ التغييرات" : "حفظ الخطة"}
							</button>
						</div>

						{/* Progress Tracking Section */}
						{isEditing && (
							<div className="mt-8">
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									التقدم في خطة القضاء
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{prayerNames.map((prayerName) => (
										<div
											key={prayerName}
											className="bg-white rounded-lg p-4 shadow"
										>
											<h4 className="text-gray-900 font-medium text-lg mb-2">
												{prayerNamesArabic[prayerName]}
											</h4>
											<div className="relative w-full bg-gray-200 rounded-full h-2.5 mb-2">
												{" "}
												{/* Base bar */}
												<div
													style={{
														width: `${progressPercentage(
															prayerName as PrayerType
														)}%`,
													}}
													className="absolute top-0 right-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500" // Gradient
												></div>
												<span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-700 text-xs font-medium">
													{plan.progress[prayerName as PrayerType] || 0} /{" "}
													{plan.targets[prayerName as PrayerType] || 0}
												</span>{" "}
												{/* Progress text */}
											</div>
											<p className="text-gray-500 text-sm">
												{progressPercentage(prayerName as PrayerType)}% مكتمل
											</p>
										</div>
									))}
								</div>
							</div>
						)}
					</form>
				)}
				{!showForm && existingPlans !== null && (
					<div className="mb-8">
						{existingPlans.length > 0 ? (
							<div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									خطط القضاء المحفوظة
								</h3>
								<ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
									{" "}
									{/* Added border and dividers */}
									{existingPlans?.map((plan) => (
										<li
											key={plan.id}
											className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-gray-50"
											onClick={() => {
												router.push(`/qadaa-plans?planId=${plan.id}`);
											}}
										>
											{" "}
											<div className="flex-auto lg:w-0">
												<Link
													href={`/qadaa-plans?planId=${plan.id}`}
													className="text-blue-600 hover:underline font-medium"
												>
													{plan.name}
												</Link>
												<div className="text-gray-600 text-sm">
													<span>
														من:{" "}
														{format(plan.startDate.toDate(), "dd MMM yyyy", {
															locale: ar,
														})}
													</span>{" "}
													{plan.endDate ? ( // Conditionally render end date
														<span>
															إلى:{" "}
															{format(plan.endDate.toDate(), "dd MMM yyyy", {
																locale: ar,
															})}
														</span>
													) : (
														<span>إلى: مستمر</span>
													)}
												</div>
												<div className="text-gray-500 text-sm">
													اضغط لرؤية تفاصيل الخطة وتقدمك الحالي
												</div>
											</div>
											<div className="flex-none ml-4 flex items-center">
												{" "}
												{/* Actions */}
												<Link
													className="mt-[2px]"
													href={`/qadaa-plans?planId=${plan.id}`}
													onClick={(e) => {
														e.stopPropagation();
													}}
												>
													<button className="py-1 px-2 bg-blue-500 text-white rounded hover:bg-blue-600 ">
														<Pencil1Icon />
													</button>
												</Link>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleDeletePlan(plan.id);
													}}
													className="py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600"
												>
													<TrashIcon />
												</button>
											</div>
										</li>
									))}
								</ul>
							</div>
						) : (
							<p className="text-gray-800">
								لا توجد خطط محفوظة. أنشئ خطة جديدة.
							</p>
						)}
						{existingPlans.length > 0 && (
							<button
								onClick={handleCreateNewPlan}
								className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								إنشاء خطة جديدة
							</button>
						)}
					</div>
				)}
			</div>
		</Layout>
	);
}
