"use client";

import { useState, useEffect } from "react";
import * as ToolTip from "@radix-ui/react-tooltip";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,

} from "chart.js";
import Link from "next/link";
import {
	addDays,
	differenceInDays,
	format,
	isSameDay,
	
	subDays,
} from "date-fns";
import {  onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import {
	collection,
	getDocs,
	serverTimestamp,
	query,
	where,
	increment,
	onSnapshot,
	doc,
	Timestamp,
	writeBatch,
	or,
	and,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { ar } from "date-fns/locale";
import {
	prayerNamesArabic,
	prayerNames,
	PrayerType,
	QadaaPlan,
} from "@/app/lib/prayerConstants";
import Layout from "../components/Layout";
import { Metadata } from "next";
import { toast } from "react-toastify";
import PrayerChart from "../components/PrayerChart";


// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

export default function DashboardPage() {
	const router = useRouter();
	const [quickRegisterAmounts, setQuickRegisterAmounts] = useState<
		Record<PrayerType, number>
	>(
		prayerNames.reduce(
			(acc, prayerName) => ({ ...acc, [prayerName]: 0 }),
			{} as Record<PrayerType, number>
		)
	);

	const [registerDate, setRegisterDate] = useState(
		format(new Date(), "yyyy-MM-dd")
	);

	// Authentication check
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				router.push("/login");
			}
		});
		return () => unsubscribe();
	}, []);

	// Prayer Data and realted States and Functions

	const [missedPrayers, setMissedPrayers] = useState<
		Record<PrayerType, number>
	>({
		fajr: 5,
		dhur: 5,
		asr: 6,
		maghrib: 20,
		isha: 5,
	}); // State for missed prayers

	const [completedPrayers, setCompletedPrayers] = useState<any[]>([]);

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
			if (user) {
				// Fetch missed prayers data
				const missedPrayersRef = doc(db, "missedPrayers", user.uid);
				const unsubscribeMissedPrayers = onSnapshot(missedPrayersRef, (doc) => {
					if (doc.exists()) {
						const { lastUpdated, ...missedPrayers } = doc.data();

						setMissedPrayers(missedPrayers as Record<PrayerType, number>);
					} else {
						// Handle case where document doesn't exist
						console.log("No missedPrayers document found for user");
					}
				});

				// Fetch completed prayers data
				const completedPrayersQuery = query(
					collection(db, "completedPrayers"),
					where("userId", "==", user.uid)
				);
				const unsubscribeCompletedPrayers = onSnapshot(
					completedPrayersQuery,
					(snapshot) => {
						const completedPrayersData = snapshot.docs.map((doc) => ({
							id: doc.id,
							...doc.data(),
						}));
						setCompletedPrayers(completedPrayersData);
					}
				);

				return () => {
					unsubscribeMissedPrayers();
					unsubscribeCompletedPrayers();
					unsubscribeAuth();
				};
			} else {
				// ...
			}
		});
	}, []);

	// Streak calculation function
	const calculateStreak = (completedPrayers: any[]) => {
		let streak = 0;
		let today = new Date();
		for (let i = 0; i < completedPrayers.length; i++) {
			const madeUpDate = completedPrayers[i].madeUpDate.toDate();

			if (isSameDay(today, madeUpDate)) {
				streak++;
				today = subDays(today, 1); // Check previous day
			} else if (today > madeUpDate) {
				break; // If madeUpDate is older than today, stop checking
			} else {
				break; // Streak broken
			}
		}
		return streak;
	};
	const getPrayersForDate = (date: Date, completedPrayers: any[]) => {
		return completedPrayers.filter((prayer) =>
			isSameDay(prayer.madeUpDate?.toDate(), date)
		);
	};

	const handleQuickRegister = async (prayerType: PrayerType) => {
		const userId = auth.currentUser?.uid;
		if (!userId) return toast.error("يرجى تسجيل الدخول");

		const amount = quickRegisterAmounts[prayerType];
		const missedPrayerCount = missedPrayers[prayerType] || 0;
		const amountToRegister = Math.min(amount, missedPrayerCount); // cannot exceed missed count

		if (amount <= 0) return;
		
		try {
			// Batch updates for Firestore
			const batch = writeBatch(db);

			// 1. Decrement missedPrayers count
			const missedPrayersRef = doc(db, "missedPrayers", userId);
			if (missedPrayerCount > 0) {
				batch.update(missedPrayersRef, {
					[prayerType]: increment(-amountToRegister), // Decrement by amount
					lastUpdated: serverTimestamp(),
				});
			}

			// 2. Add to completedPrayers
			const madeUpDate = Timestamp.fromDate(new Date(registerDate));

			for (let i = 0; i < amount; i++) {
				const completedPrayerRef = doc(collection(db, "completedPrayers"));
				batch.set(completedPrayerRef, {
					userId,
					prayerType,
					madeUpDate,
					addedDate: new Date(),
					timestamp: serverTimestamp(),
				});
			}

			// 3. Update progress in active Qadaa plan (if any)

			const activePlan = await getActiveQadaaPlan(userId); //Fetch active plan only once

			if (activePlan) {
				const planRef = doc(db, "qadaaPlans", activePlan.id as string);
				// Check if target is met for the prayer type
				if (activePlan.progress[prayerType] < activePlan.targets[prayerType]) {
					const amountToAdd = Math.min(
						amount,
						activePlan.targets[prayerType] - activePlan.progress[prayerType]
					); // Ensure progress doesn't exceed target
					batch.update(planRef, {
						[`progress.${prayerType}`]: increment(amountToAdd),
					});
				}
			}

			await batch.commit();

			setMissedPrayers((prev) => ({
				...prev,
				[prayerType]: (prev[prayerType] || 0) - amountToRegister,
			}));
			setCompletedPrayers((prevCompletedPrayers) => [
				...prevCompletedPrayers,
				...Array(amount).fill({
					userId,
					prayerType,
					madeUpDate, // Use madeUpDate here
					addedDate: new Date(),
					timestamp: serverTimestamp(),
				}),
			]);
			setQuickRegisterAmounts((prev) => ({ ...prev, [prayerType]: 0 }));
			toast.success("تم تسجيل الصلاة بنجاح");
		} catch (error) {
			console.error("Error in handleQuickRegister:", error);
			toast.error("حدث خطأ ما");
		}
	};

	const handleRegisterAll = async () => {
		const userId = auth.currentUser?.uid;
		if (!userId) return toast.error("يرجى تسجيل الدخول");

		//Loop through all prayers
		for (const prayerName of prayerNames) {
			await handleQuickRegister(prayerName as PrayerType); // Reuse handleQuickRegister for each prayer
		}
	};

	// Helper function to get the active Qadaa plan for a user (if any)
	const getActiveQadaaPlan = async (userId: string) => {
		const today = Timestamp.fromDate(new Date());
		try {
			const q = query(
				collection(db, "qadaaPlans"),
				or(
					and(
						where("userId", "==", userId),
						where("startDate", "<=", today),
						where("endDate", ">=", today)
					),
					where("endDate", "==", null)
				)
				//Add or condition for null for ongoing plans
			);
			const querySnapshot = await getDocs(q);
			if (querySnapshot.empty) return null;
			return {
				id: querySnapshot.docs[0].id,
				...querySnapshot.docs[0].data(),
			} as QadaaPlan;
		} catch (error) {
			console.error("Error fetching active plan:", error);
			return null;
		}
	};

	return (
		<Layout>
			<div className="min-h-screen bg-gray-100 flex">
				{/* Main Content Area */}
				<main
					className={`flex-1 p-8 overflow-y-auto transition-all duration-300 `}
				>
					{/* Prayer Progress Summary */}
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
						{["fajr", "dhur", "asr", "maghrib", "isha"].map((pn) => {
							const prayerName: PrayerType = pn as PrayerType;
							const missedCount = missedPrayers[prayerName] || 0;
							const madeUpCount = completedPrayers.filter(
								(prayer) => prayer.prayerType === prayerName
							).length;
							const arabicPrayerName = prayerNamesArabic[prayerName];

							return (
								<div
									key={prayerName}
									className="bg-white rounded-lg p-4 shadow"
								>
									<h4 className="text-gray-900 font-medium text-lg mb-2">
										{arabicPrayerName}
									</h4>
									<div className="flex justify-between items-center mb-2">
										<p className="text-gray-700">الفائتة: {missedCount}</p>
										<p className="text-gray-700">المؤداة: {madeUpCount}</p>
									</div>
								</div>
							);
						})}
					</div>
					{/* Prayer Registration Section */}
					<div className="bg-white rounded-lg p-6 shadow mb-8">
						<h3 className="text-xl font-semibold text-gray-900 mb-4">
							سجل صلواتك المؤداة
						</h3>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
							{prayerNames.map((prayerName) => (
								<div key={prayerName} className="flex flex-col items-center">
									{" "}
									<label
										htmlFor={prayerName}
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										{prayerNamesArabic[prayerName]}
									</label>
									<div className="flex">
										<input
											type="number"
											min="0"
											id={prayerName}
											className="border border-gray-300 rounded px-2 py-1 w-20 mb-2 text-center"
											value={quickRegisterAmounts[prayerName as PrayerType]}
											onChange={(e) => {
												const amount = parseInt(e.target.value) || 0;

												setQuickRegisterAmounts((prev) => ({
													...prev,
													[prayerName]: amount,
												}));
											}}
										/>
									</div>
								</div>
							))}
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleRegisterAll();
							}}
						>
							<div className="flex justify-center items-center mt-2 mb-4">
								{" "}
								{/* Container for date input */}
								<label
									htmlFor="registerDate"
									className="block text-sm font-medium text-gray-700 mr-2"
								>
									{" "}
									تاريخ القضاء
								</label>
								<input
									type="date"
									id="registerDate"
									required
									className="border border-gray-300 rounded px-2 py-1 w-[50%]"
									value={registerDate}
									onChange={(e) => setRegisterDate(e.target.value)}
								/>
							</div>
							<div className="flex justify-center mt-4">
								{" "}
								{/* Container for the button */}
								<button
									type="submit"
									className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
								>
									تسجيل الكل
								</button>
							</div>
						</form>
					</div>

					{/* Monthly Progress Chart */}
					<div className="bg-white rounded-lg p-6 shadow mt-8 overflow-x-auto ">
						{" "}
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xl font-semibold text-gray-900">
								تقدم هذا الشهر
							</h3>
							<Link
								href="/progress-visualization"
								className="text-blue-600 hover:underline"
							>
								رؤية المزيد
							</Link>
						</div>
						<div className="min-w-[40rem]">
							<PrayerChart
								completedPrayers={completedPrayers}
								startDate={subDays(new Date(), 28)}
								endDate={new Date()}
							/>
						</div>
					</div>
					{/* Streak Display  */}
					<div className="mt-8 bg-white rounded-lg p-6 shadow overflow-x-auto">
						<h3 className="text-xl font-semibold text-gray-900 mb-4">
							سلاسل القضاء المتتالية
						</h3>

						<div className="flex flex-col max-w-4xl  mx-auto  min-w-[56rem]">
							<div className="flex justify-evenly mb-2 ">
								{Array.from({ length: 12 }).map((_, monthIndex) => (
									<div
										key={monthIndex}
										className="text-xs w-1/12 text-center text-gray-700"
									>
										{format(
											new Date(new Date().getFullYear(), monthIndex, 1),
											"MMM",
											{ locale: ar }
										)}
									</div>
								))}
							</div>

							<div className="flex flex-nowrap ">
								{" "}
								{Array.from({ length: 12 }).map((_, monthIndex) => {
									const daysInMonth = (month: number, year: number) =>
										new Date(year, month + 1, 0).getDate();
									const year = new Date().getFullYear();
									const days = daysInMonth(monthIndex, year);
									const startOfMonth = new Date(year, monthIndex, 1);

									return (
										<div
											key={monthIndex}
											className="flex flex-col items-center mr-4 max-w-4xl mx-auto"
										>
											{" "}
											{/* Horizontal row for each month */}
											<div className="grid grid-cols-3 gap-1 max-w-4xl ">
												{Array.from({ length: days }).map((_, dayIndex) => {
													const currentDate = addDays(startOfMonth, dayIndex);
													const completedPrayersOnDate = getPrayersForDate(
														currentDate,
														completedPrayers
													);
													const prayersCount = completedPrayersOnDate.length;
													const isCurrentStreak =
														dayIndex >=
														differenceInDays(
															new Date(),
															subDays(
																new Date(),
																calculateStreak(completedPrayers)
															)
														);

													const colorIntensity = Math.min(
														prayersCount * 20,
														100
													);
													const backgroundColor =
														prayersCount > 0
															? `bg-blue-${colorIntensity}`
															: "bg-gray-200";

													return (
														<ToolTip.Provider
															delayDuration={100}
															key={`${monthIndex}-${dayIndex}`}
														>
															<ToolTip.Root>
																<ToolTip.Trigger asChild>
																	<div
																		className={`w-2 h-2 rounded-sm ${backgroundColor}
                                                ${
																									isCurrentStreak &&
																									prayersCount > 0
																										? "ring-2 ring-blue-500"
																										: ""
																								}
                                            `}
																	/>
																</ToolTip.Trigger>
																<ToolTip.Portal>
																	<ToolTip.Content
																		sideOffset={5}
																		className="TooltipContent"
																	>
																		{format(currentDate, "yyyy-MM-dd")}
																		<ToolTip.Arrow className="TooltipArrow" />
																	</ToolTip.Content>
																</ToolTip.Portal>
															</ToolTip.Root>
														</ToolTip.Provider>
													);
												})}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</main>
			</div>
		</Layout>
	);
}
