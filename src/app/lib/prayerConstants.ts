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
