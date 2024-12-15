import Link from "next/link";
import {
	CalendarIcon,
	PencilIcon,
	DevicePhoneMobileIcon,
	ChartBarIcon,
	MegaphoneIcon,
	UserGroupIcon,
	VideoCameraIcon,
} from "@heroicons/react/24/outline";

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
			<div className="relative max-w-7xl mx-auto">
				<div className="text-center">
					<h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
						<span className="block mb-6">أهلاً بك في </span>
						<span className="block text-blue-600">موقع قضاء</span>
					</h1>
					<p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 sm:text-xl">
						أقضى صلاتك بسهولة مع موقعنا المصمم خصيصا ليساعدك في ذلك.
					</p>
					<div className="mt-6 flex justify-center space-x-4">
						<Link
							href="/register"
							className="inline-flex ml-1 items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-lg"
						>
							سجل الآن
						</Link>
						<Link
							href="/login"
							className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-blue-600 bg-white hover:bg-gray-100 rounded-md shadow-lg border border-blue-600"
						>
							تسجيل الدخول
						</Link>
					</div>
				</div>

				<div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{[
						{
							icon: <CalendarIcon className="h-8 w-8" />,
							title: "تتبع دقيق",
							description:
								" سجّل جميع صلواتك الفائتة مع التاريخ ونوع الصلاة لكل منها مع سهولة التعديل.",
						},
						{
							icon: <PencilIcon className="h-8 w-8" />,
							title: "خطط فعّالة",
							description:
								"أنشئ خططًا مخصصة لقضاء الصلاة، وحدد أهدافًا يومية أو أسبوعية.",
						},
						{
							icon: <DevicePhoneMobileIcon className="h-8 w-8" />,
							title: "اتاحة كبيرة",
							description:
								"ادخل إلى حسابك من أي جهاز، سواء كان حاسوبًا أو هاتفًا أو جهازًا لوحيًا.",
						},
						{
							icon: <ChartBarIcon className="h-8 w-8" />,
							title: "أعرض تقدمك",
							description:
								"تابع تقدمك في قضاء الصلاة من خلال رسوم بيانية تفاعلية.",
						},
						{
							icon: <MegaphoneIcon className="h-8 w-8" />,
							title: "حافظ على حماسك",
							description:
								"استقبل تذكيرات لأوقات قضاءك وتابع سلسلة تقدمك لتبقى متحمسًا.",
						},
						{
							icon: <UserGroupIcon className="h-8 w-8" />,
							title: "شارك تقدمك",
							description: "شارك تقدمك مع أصدقائك وعائلتك للحصول على الدعم.",
						},
						{
							icon: <VideoCameraIcon className="h-8 w-8" />,
							title: "مراجعة أداء الصلاة",
							description: "استخدم الذكاء الاصطناعي لتحليل وتقييم شكل صلاتك.",
						},
					].map((feature, index) => (
						<div
							key={index}
							className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
						>
							<div className="flex items-center space-x-4">
								<div className="p-4 ml-1 bg-blue-100 rounded-full text-blue-600">
									{feature.icon}
								</div>
								<h3 className="text-lg font-semibold text-gray-900">
									{feature.title}
								</h3>
							</div>
							<p className="mt-4 text-gray-600">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
