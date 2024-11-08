import Link from "next/link";
import {
  ClockIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  MegaphoneIcon,
  UserGroupIcon,
  VideoCameraIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block xl:inline my-4">أهلاً بك في </span>
            <span className="block text-blue-600 xl:inline">
              موقع قضاء
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-lg text-gray-500 sm:text-xl md:mt-5 md:max-w-3xl">
            أقضى صلاتك بسهولة مع موقعنا المصمم خصيصا ليساعدك في ذلك.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-y-12 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:gap-x-8">
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <ClockIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mr-4 text-lg leading-6 font-medium text-gray-900">
                  تتبع دقيق
                </h3>
              </div>
              <p className="mt-4 text-base text-gray-500">
                سجّل جميع صلواتك الفائتة مع التاريخ ونوع الصلاة لكل منها.
              </p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mr-4 text-lg leading-6 font-medium text-gray-900">
                  خطط فعّالة
                </h3>
              </div>
              <p className="mt-4 text-base text-gray-500">
                أنشئ خططًا مخصصة لقضاء الصلاة، وحدد أهدافًا يومية أو أسبوعية.
              </p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <DevicePhoneMobileIcon
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mr-4 text-lg leading-6 font-medium text-gray-900">
                  اتاحة كبيرة
                </h3>
              </div>
              <p className="mt-4 text-base text-gray-500">
                ادخل إلى حسابك من أي جهاز، سواء كان حاسوبًا أو هاتفًا أو جهازًا
                لوحيًا.
              </p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <ChartBarIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mr-4 text-lg leading-6 font-medium text-gray-900">
                  تصوّر تقدمك
                </h3>
              </div>
              <p className="mt-4 text-base text-gray-500">
                تابع تقدمك في قضاء الصلاة من خلال رسوم بيانية تفاعلية.
              </p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <MegaphoneIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mr-4 text-lg leading-6 font-medium text-gray-900">
                  حافظ على حماسك
                </h3>
              </div>
              <p className="mt-4 text-base text-gray-500">
                استقبل تذكيرات محفزة وتابع سلسلة تقدمك لتبقى متحمسًا.
              </p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mr-4 text-lg leading-6 font-medium text-gray-900">
                  شارك تقدمك
                </h3>
              </div>
              <p className="mt-4 text-base text-gray-500">
                شارك تقدمك مع أصدقائك وعائلتك للحصول على الدعم.
              </p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <VideoCameraIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mr-4 text-lg leading-6 font-medium text-gray-900">
                  مراجعة اداء الصلاة
                </h3>
              </div>
              <p className="mt-4 text-base text-gray-500">
                استخدم الذكاء الاصطناعي لتحليل وتقييم شكل صلاتك.
              </p>
            </div>
          </div>{" "}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/register"
            className="mx-4 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            سجل الآن
          </Link>
          <Link
            href="/login"
            className="mx-4 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
