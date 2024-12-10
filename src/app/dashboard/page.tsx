"use client";

import { useState, useEffect } from "react";
import {
	Root as DialogRoot,
	Content as DialogContent,
	DialogTrigger,
	DialogClose,
	DialogTitle,
	DialogDescription,
} from "@radix-ui/react-dialog";
import * as ToolTip from "@radix-ui/react-tooltip";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ChartOptions,
	ScriptableContext,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Link from "next/link";
import {
	addDays,
	differenceInDays,
	format,
	isSameDay,
	startOfYear,
	subDays,
} from "date-fns";
import { RiFireFill } from "@remixicon/react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import {
	collection,
	addDoc,
	getDocs,
	serverTimestamp,
	query,
	where,
	orderBy,
	updateDoc,
	increment,
	onSnapshot,
	doc,
	Timestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { ar } from "date-fns/locale";
import {
	prayerNamesArabic,
	prayerNames,
	PrayerType,
} from "@/app/lib/prayerConstants";
import Layout from "../components/Layout";
import { Metadata } from "next";

 const metadata: Metadata = {
	title: "الرئيسية",
	description: "الصفحة الرئيسية حيث يمكن رؤية وتسجيل التقدم في القضاء",
};

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

const motivationalMessages = [
	"الصلاة نور",
	"صل قبل أن يصلى عليك",
	"إن الصلاة تنهى عن الفحشاء والمنكر",
];

export default function DashboardPage() {
	const router = useRouter();

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

	// Prayer registration dialog visibility
	const [isPrayerRegistrationOpen, setIsPrayerRegistrationOpen] =
		useState(false);
	// Prayer type and date states
	const [selectedPrayer, setSelectedPrayer] = useState<PrayerType>("fajr");
	const [prayerDate, setPrayerDate] = useState(
		format(new Date(), "yyyy-MM-dd")
	);


	// State for the motivational message
	const [message, setMessage] = useState("");

	useEffect(() => {
		// Set initial message
		setMessage(
			motivationalMessages[
				Math.floor(Math.random() * motivationalMessages.length)
			]
		);

		// Update message every 5 minutes
		const intervalId = setInterval(() => {
			setMessage(
				motivationalMessages[
					Math.floor(Math.random() * motivationalMessages.length)
				]
			);
		}, 5 * 60 * 1000);

		// Clear interval on component unmount
		return () => clearInterval(intervalId);
	}, []);

	// Chart options 
	const options: ChartOptions<"bar"> = {
		responsive: true,
		plugins: {
			legend: {
				position: "top",
			},
			title: {
				display: false, 
				text: "Chart.js Bar Chart",
			},
		},
		scales: {
			x: {
				title: {
					display: true,
					text: "تاريخ الصلاة", // x-axis label
				},
				stacked: false, // Stack bars for each prayer type
			},
			y: {
				title: {
					display: true,
					text: "عدد الصلوات", // y-axis label
				},
				stacked: false, // Stack bars for each prayer type
				beginAtZero: true,
			},
		},
	};

	// Function to generate chart data
	const generateChartData = (completedPrayers: any[]) => {
		// 1. Group completed prayers by date and prayer type
		const prayersByDate: {
			[date: string]: { [prayerType in PrayerType]: number };
		} = {};
		completedPrayers.forEach((prayer) => {
			const date = format(prayer.madeUpDate.toDate(), "yyyy-MM-dd"); // Format date
			prayersByDate[date] = prayersByDate[date] || {
				fajr: 0,
				dhur: 0,
				asr: 0,
				maghrib: 0,
				isha: 0,
			};
			prayersByDate[date][prayer.prayerType as PrayerType]++;
		});

		// 2. Prepare data for Chart.js
		const labels = Object.keys(prayersByDate); // Dates as labels
		const datasets = prayerNames.map((prayerName) => ({
			// One dataset per prayer type
			label: prayerNamesArabic[prayerName],
			data: labels.map((date) => prayersByDate[date][prayerName] || 0), // Get prayer count for each date, or 0 if no prayers
			backgroundColor: getRandomColor(prayerName), // Assign a color to each prayer type
		}));

		const data = {
			labels,
			datasets,
		};
		return data;
	};

	// Helper function to generate colors
	const getRandomColor = (prayerType: PrayerType) => {
		const colors: Record<PrayerType, string> = {
			fajr: "rgba(255, 99, 132, 0.5)", 
			dhur: "rgba(54, 162, 235, 0.5)",
			asr: "rgba(255, 206, 86, 0.5)",
			maghrib: "rgba(102, 162, 86, 0.5)",
			isha: "rgba(153, 102, 255, 0.5)",
		};
		return colors[prayerType];
	};

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
			isSameDay(prayer.madeUpDate.toDate(), date)
		);
	};

	return (
		<Layout>
			<div className="min-h-screen bg-gray-100 flex">
				{/* Main Content Area */}
				<main
					className={`flex-1 p-8 overflow-y-auto transition-all duration-300 `}
				>
					{/* Motivational Message */}
					<div className="bg-blue-100 rounded-lg p-4 mb-6">
						<p className="text-blue-700 font-medium text-center">{message}</p>
					</div>
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
									<div className="flex justify-between items-center">
										<p className="text-gray-700">الفائتة: {missedCount}</p>
										<p className="text-gray-700">المؤداة: {madeUpCount}</p>
									</div>
								</div>
							);
						})}
					</div>
					{/* Prayer Registration Section */}
					<div className="bg-white rounded-lg p-6 shadow mb-8">
						{" "}
						<h3 className="text-xl font-semibold text-gray-900 mb-4">
							تسجيل صلاة مؤداة
						</h3>
						{/*  Button to Open Prayer Registration Dialog */}
						<button
							onClick={() => setIsPrayerRegistrationOpen(true)}
							className="w-40 bg-blue-600 text-white rounded py-2 px-4 hover:bg-blue-700"
						>
							فتح{" "}
						</button>
						<RegisterPrayerDialog
							isOpen={isPrayerRegistrationOpen}
							onClose={() => setIsPrayerRegistrationOpen(false)}
							selectedPrayer={selectedPrayer}
							setSelectedPrayer={setSelectedPrayer}
							prayerDate={prayerDate}
							setPrayerDate={setPrayerDate}
						/>
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
							<Bar
								options={options}
								data={generateChartData(completedPrayers)}
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

// Separate component for the Prayer Registration Dialog
const RegisterPrayerDialog = ({
	isOpen,
	onClose,
	selectedPrayer,
	setSelectedPrayer,
	prayerDate,
	setPrayerDate,
}: any) => {

	const handlePrayerRegistration = async (userId: string) => {
		try {
			const madeUpDate = new Date(prayerDate);

			// 1. Add document to completedPrayers
			const completedPrayerRef = await addDoc(
				collection(db, "completedPrayers"),
				{
					userId,
					prayerType: selectedPrayer,
					madeUpDate,
					addedDate: new Date(),
					timestamp: serverTimestamp(),
				}
			);

			// 2. Update missedPrayers count
			const missedPrayersRef = doc(db, "missedPrayers", userId);
			await updateDoc(missedPrayersRef, {
				[selectedPrayer]: increment(-1), // Decrement missed count
				lastUpdated: serverTimestamp(),
			});

			onClose(); // Close the dialog
		} catch (error) {
			console.error("Error registering prayer:", error);
			// handle the error, e.g., display an error message
		}
	};

	return (
		<DialogRoot open={isOpen} defaultOpen={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-white rounded-lg p-6 shadow-lg">
				{/* Prayer Type Selection */}
				<DialogTitle className="text-lg font-medium mb-4">
					{/* empty */}
				</DialogTitle>
				<select
					value={selectedPrayer}
					onChange={(e) => setSelectedPrayer(e.target.value)}
					className="block text-black w-full py-2 px-3 border border-gray-300 rounded-md mb-4"
				>
					<option value="fajr">الفجر</option>
					<option value="dhur">الظهر</option>
					<option value="asr">العصر</option>
					<option value="maghrib">المغرب</option>
					<option value="isha">العشاء</option>
				</select>

				{/* Prayer Date Selection */}
				<input
					type="date"
					value={prayerDate}
					onChange={(e) => setPrayerDate(e.target.value)}
					className="block w-full py-2 px-3 border border-gray-300 rounded-md mb-4"
				/>
				{/* Buttons */}
				<div className="flex justify-end">
					{" "}
					{/* Right-aligned buttons */}
					<DialogClose asChild>
						<button
							onClick={onClose}
							className="mr-2 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
						>
							إلغاء
						</button>
					</DialogClose>
					{/* Pass userId to handlePrayerRegistration */}
					<button
						onClick={() => {
							const userId = auth.currentUser?.uid;
							// Check if user is logged in
							if (userId) {
								handlePrayerRegistration(userId);
							} else {
								// Handle the case where the user is not logged in
								console.error("User not logged in");
							}
						}}
						className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						تسجيل
					</button>
				</div>
			</DialogContent>
		</DialogRoot>
	);
};
