"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import PrayerChart from "../components/PrayerChart";
import {
	collection,
	query,
	where,
	getDocs,
	Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/app/lib/firebase.js";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { differenceInDays, format, subDays } from "date-fns";
import { prayerNames, prayerNamesArabic } from "../lib/prayerConstants";
import domtoimage from "dom-to-image";

export default function ProgressVisualizationPage() {
	const [completedPrayers, setCompletedPrayers] = useState<any>([]);
	const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 365));
	const [endDate, setEndDate] = useState<Date>(new Date());
	const [averageDaily, setAverageDaily] = useState(0);
	const [averageWeekly, setAverageWeekly] = useState(0);
	const [averageMonthly, setAverageMonthly] = useState(0);
	const [updateAverages, setUpdateAverages] = useState(false); // State to control averages display

	const router = useRouter();
	const userId = auth.currentUser?.uid;
	// Authentication check
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				router.push("/login");
			}
		});
		return () => unsubscribe();
	}, []);

	const handleScreenshot = () => {
		const element = document.querySelector("html");

		if (!element) {
			toast.error("فشل العثور على المحتوى المراد التقاطه.");
			return;
		}
		const screenshotButton = document.getElementById("screenshotButton");
		if (screenshotButton) screenshotButton.style.display = "none";

		domtoimage
			.toPng(element, {
				style: {
					// Display text correctly
					direction: "rtl",
					fontFamily: "Cairo, sans-serif",
				},
				bgcolor: "#fff",
				quality: 1, // highest quality
				width: document.body.scrollWidth, // Ensure full desktop view
				height: document.body.scrollHeight, // Ensure full desktop view
			})
			.then((dataUrl: any) => {
				const link = document.createElement("a");
				link.href = dataUrl;
				link.download =
					format(new Date(), "dd-MM-yyyy") + "_Qadaa-Screenshoot.png";
				link.click();
				toast.success("تم التقاط لقطة الشاشة بنجاح!");
			})
			.catch((error: any) => {
				console.error("فشل التقاط لقطة الشاشة:", error);
				toast.error("فشل التقاط لقطة الشاشة.");
			})
			.finally(() => {
				// Show the button again
				if (screenshotButton) screenshotButton.style.display = "flex";
			});
	};

	useEffect(() => {
		const fetchCompletedPrayers = async (userId: string) => {
			try {
				// Add try-catch block
				let q = query(
					collection(db, "completedPrayers"),
					where("userId", "==", userId)
				);

				// Apply date filters if provided

				if (startDate) q = query(q, where("madeUpDate", ">=", startDate));

				if (endDate) q = query(q, where("madeUpDate", "<=", endDate)); // Ensure endDate is up to the end of the day

				const querySnapshot = await getDocs(q);

				const completedPrayersData = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));

				setCompletedPrayers(completedPrayersData);
			} catch (error) {
				console.error("Error fetching completedPrayers:", error);
			}
		};

		// Call when component renders initially
		if (userId) {
			const unsubscribe = fetchCompletedPrayers(userId);
		}
	}, [userId]); // Add startDate and endDate as dependencies to refetch data when filters change

	useEffect(() => {
		if (
			!completedPrayers ||
			completedPrayers.length === 0 ||
			!startDate ||
			!endDate
		) {
			setAverageDaily(0);
			setAverageWeekly(0);
			setAverageMonthly(0);

			return; // Don't calculate if completedPrayers is empty
		}

		const calculateAverages = () => {
			const filteredPrayers = completedPrayers?.filter((prayer: any) => {
				// Filter prayers based on startDate and endDate
				if (!prayer.madeUpDate) return false;

				const madeUpDate = prayer.madeUpDate.toDate();
				if (startDate && madeUpDate < startDate) return false;
				if (endDate && madeUpDate > endDate) return false;

				return true;
			});

			if (!filteredPrayers || filteredPrayers.length === 0) {
				setAverageDaily(0);
				setAverageWeekly(0);
				setAverageMonthly(0);

				return; // Don't calculate if no prayers within date range
			}

			const firstPrayerDate =
				filteredPrayers[filteredPrayers.length - 1].madeUpDate.toDate(); // Safe to access now
			const totalPrayers = filteredPrayers.length;

			const daysDiff = differenceInDays(endDate as Date, firstPrayerDate) + 1; // Use endDate for calculation
			const weeksDiff = Math.ceil(daysDiff / 7);
			const monthsDiff = Math.ceil(daysDiff / 30);

			setAverageDaily(totalPrayers / daysDiff || 0);
			setAverageWeekly(totalPrayers / weeksDiff || 0);
			setAverageMonthly(totalPrayers / monthsDiff || 0);
		};

		calculateAverages();
	}, [updateAverages, completedPrayers]);

	const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);

		const startDateString = formData.get("startDate") as string;
		const endDateString = formData.get("endDate") as string;

		let newStartDate;
		let newEndDate;
		if (startDateString && endDateString) {
			newStartDate = new Date(startDateString); // Create Date objects only if value is not nullish
			newEndDate = new Date(endDateString);
		}

		if (
			endDate &&
			startDate &&
			endDateString &&
			startDateString &&
			new Date(endDateString) < new Date(startDateString)
		)
			toast.error("تاريخ الانتهاء لا يجب ان يكون قبل تاريخ البداية");
		else {
			setStartDate(newStartDate as Date); // Use new Date()
			setEndDate(newEndDate as Date); // Use new Date()
			setUpdateAverages(!updateAverages);
		}
	};

	return (
		<Layout>
			<div className="container mx-auto px-4 py-8">
				<h2 className="text-2xl font-bold mb-4 text-gray-900">عرض التقدم</h2>
				{/* Screenshot Button */}
				<button
					className="hidden lg:flex py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
					onClick={() => {
						handleScreenshot();
					}}
					id="screenshotButton"
				>
					تحميل صورة للتقدم الحالي
				</button>
				<div className="my-4 text-center"></div>
				{/* Filters for Start and End Dates  */}
				<form
					className="mb-8 border border-gray-200 rounded-md p-6 grid grid-cols-1 md:grid-cols-4 gap-4"
					onSubmit={(e) => {
						handleFilterChange(e);
					}}
				>
					<div className="mb-2">
						<label
							htmlFor="startDate"
							className="block font-medium mb-1 text-gray-900"
						>
							تاريخ البداية:
						</label>
						<input
							type="date"
							name="startDate"
							id="startDate"
							className="block w-full border border-gray-200 rounded-md p-2 focus:border-blue-500 focus:outline-none sm:text-sm"
							// onChange={(e) => setStartDate(new Date(e.target.value))}
							defaultValue={format(startDate as Date, "yyyy-MM-dd")}
						/>
					</div>

					<div className="mb-2">
						<label
							htmlFor="endDate"
							className="block font-medium mb-1 text-gray-900"
						>
							تاريخ النهاية:
						</label>
						<input
							type="date"
							id="endDate"
							name="endDate"
							className="block w-full border border-gray-200 rounded-md p-2 focus:border-blue-500 focus:outline-none sm:text-sm"
							// onChange={(e) => setEndDate(new Date(e.target.value))}
							defaultValue={format(endDate as Date, "yyyy-MM-dd")}
						/>
					</div>
					<button
						className="h-fit p-2 mb-3 self-end bg-blue-500 text-white rounded hover:bg-blue-600 mr-1"
						type="submit"
					>
						عرض
					</button>
				</form>
				{/* Chart */}
				{/* Display all chart types, but conditionally render based on chartType state */}
				<div className="mt-8">
					<PrayerChart
						completedPrayers={completedPrayers}
						startDate={startDate}
						endDate={endDate}
					/>
				</div>
				<div className="mt-4">
					{" "}
					<h4 className="font-medium text-lg text-gray-800 mb-2">
						الصلوات المنجزة في الفترة المحددة
					</h4>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200 border border-gray-300">
							<thead className="bg-gray-50">
								<tr>
									{prayerNames.map((prayerName) => (
										<th
											key={prayerName}
											scope="col"
											className="px-6 py-3 text-center text-xs font-medium text-gray-500 tracking-wider"
										>
											{prayerNamesArabic[prayerName]}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								<tr className="bg-blue-100/50">
									{prayerNames.map((prayerName) => {
										// Filter based on startDate and endDate
										const filteredPrayers = completedPrayers?.filter(
											(prayer: any) => {
												if (prayer.prayerType !== prayerName) return false;
												// Filter based on date range (add similar endDate check as well)
												if (!prayer.madeUpDate) return false;

												const madeUpDate = prayer.madeUpDate.toDate();

												if (startDate && madeUpDate < startDate) return false;
												if (endDate && madeUpDate > endDate) return false;

												return true;
											}
										);

										return (
											<td
												key={prayerName}
												className="px-6 py-4 whitespace-nowrap"
											>
												<div className="flex flex-col items-center">
													<p className="text-gray-900 text-lg font-medium">
														{filteredPrayers?.length || 0}
													</p>
													<span className="text-xs text-gray-400"></span>
												</div>
											</td>
										);
									})}
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						{" "}
						{/* Daily average */}
						<p className="text-gray-700">
							<span className="font-bold">متوسط القضاء اليومي:</span>{" "}
							{averageDaily?.toFixed(2) || 0}
						</p>
					</div>

					<div>
						{" "}
						{/* Weekly average */}
						<p className="text-gray-700">
							<span className="font-bold">متوسط القضاء الأسبوعي:</span>{" "}
							{averageWeekly?.toFixed(2) || 0}
						</p>
					</div>
					<div>
						{" "}
						{/* Monthly average */}
						<p className="text-gray-700">
							<span className="font-bold">متوسط القضاء الشهري:</span>{" "}
							{averageMonthly?.toFixed(2) || 0}
						</p>
					</div>
				</div>
			</div>
		</Layout>
	);
}
