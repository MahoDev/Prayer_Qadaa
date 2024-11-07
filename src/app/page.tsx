import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          {/* Arabic Text: Welcome to Prayer Qadaa */}
          أهلاً بك في تطبيق قضاء الصلاة
        </h1>

        <p className="text-lg text-gray-700 mb-8">
          {/* Arabic Text:  Stay on top of your prayers with our easy-to-use tracking and planning app.  Make up missed prayers (Qadaa) effortlessly and strengthen your connection with God. */}
          تابع صلاتك بسهولة مع تطبيقنا لتتبع وتخطيط الصلاة. أقضي صلاتك الفائتة
           دون عناء وقوي صلتك مع الله.
        </p>

        <div className="mt-8">
          <Link
            href="/register"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {/* Arabic Text: Sign Up */}
            سجل الآن
          </Link>
          <div className="mt-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {/* Arabic Text: Login */}
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
