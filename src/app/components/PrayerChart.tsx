"use client";
import { Bar } from "react-chartjs-2";
import {
	ChartOptions,
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import {
	prayerNamesArabic,
	prayerNames,
	PrayerType,
} from "../lib/prayerConstants";
import { format } from "date-fns";
import { useState } from "react";
import { ar } from "date-fns/locale";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

interface PrayerChartProps {
	completedPrayers: any[];
	startDate?: Date | null;
	endDate?: Date | null;
}

const PrayerChart = ({
	completedPrayers,
	startDate,
	endDate,
}: PrayerChartProps) => {
	const [isYearly, setIsYearly] = useState(false);

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

	const generateChartData = (
		completedPrayers: any[],
		startDate?: Date | null,
		endDate?: Date | null
	) => {
		let labels: any;

		// Filter data based on startDate and endDate (Handles null values)
		const filteredPrayers = completedPrayers.filter((prayer) => {
			const madeUpDate = prayer.madeUpDate.toDate();

			if (startDate && madeUpDate < startDate) return false;
			if (endDate && madeUpDate > endDate) return false;
			return true;
		});

		let prayersByDate: any = {}; // Initialize prayersByDate

		if (isYearly) {
			// Yearly view logic
			const prayersByMonth: {
				[month: number]: { [prayerType in PrayerType]: number };
			} = {}; // Group by month

			filteredPrayers.forEach((prayer) => {
				const madeUpDate = prayer.madeUpDate.toDate();
				const month = madeUpDate.getMonth(); // Extract month

				prayersByMonth[month] = prayersByMonth[month] || {
					fajr: 0,
					dhur: 0,
					asr: 0,
					maghrib: 0,
					isha: 0,
				};
				prayersByMonth[month][prayer.prayerType as PrayerType]++;
			});

			labels = Object.keys(prayersByMonth).map(Number); // Months as labels (numbers 0-11)

			// Convert prayersByMonth to the format expected by Chart.js
			prayersByDate = labels.reduce((acc: any, month: any) => {
				acc[month] = { ...prayersByMonth[month] };
				return acc;
			}, {});
		} else {
			// Grouping logic for monthly/custom range view
			filteredPrayers.forEach((prayer) => {
				const date = format(prayer.madeUpDate?.toDate(), "yyyy-MM-dd");
				prayersByDate[date] = prayersByDate[date] || {
					fajr: 0,
					dhur: 0,
					asr: 0,
					maghrib: 0,
					isha: 0,
				};
				prayersByDate[date][prayer.prayerType as PrayerType]++;
			});

			labels = Object.keys(prayersByDate); // Dates as labels
		}

		// Prepare datasets
		const datasets = prayerNames.map((prayerName) => ({
			label: prayerNamesArabic[prayerName],
			data: labels.map((label: any) => {
				if (isYearly) {
					return prayersByDate[label][prayerName] || 0;
				} else {
					return prayersByDate[label]?.[prayerName] || 0;
				}
			}),
			backgroundColor: getRandomColor(prayerName as PrayerType),
		}));

		const data = {
			labels: labels.map((label: any) =>
				isYearly
					? format(new Date(new Date().getFullYear(), label, 1), "MMMM", {
							locale: ar,
					  })
					: label
			), // Format month labels for yearly view
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

	const data = generateChartData(completedPrayers, startDate, endDate); // Call generateChartData and store the result in 'data'

	return (
		<div className="overflow-x-auto">
			<div className="min-w-[40rem]">
				<div className="flex justify-end">
					<button
						className="py-[6px]  w-24 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 mr-2"
						onClick={() => setIsYearly(!isYearly)}
					>
						{isYearly ? "عرض يومي" : "مجموع شهري"}
					</button>
				</div>

				<Bar options={options} data={data} />
			</div>
		</div>
	);
};
export default PrayerChart;
