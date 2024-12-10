import { Timestamp } from "firebase/firestore";

export const prayerNamesArabic: Record<PrayerType, string> = {
	fajr: "الفجر",
	dhur: "الظهر",
	asr: "العصر",
	maghrib: "المغرب",
	isha: "العشاء",
};
export const prayerNames = Object.keys(
	prayerNamesArabic
) as (keyof typeof prayerNamesArabic)[];

// Define prayer types
export type PrayerType = "fajr" | "dhur" | "asr" | "maghrib" | "isha";

export interface QadaaPlan {
	id?: string;
	userId: string;
	name: string;
	startDate: Timestamp;
	endDate: Timestamp | null;
	targets: Record<PrayerType, number>;
	progress: Record<PrayerType, number>;
	reminderSettings: {
		type: "none" | "custom";
		customTime: string | null;
	};
}
