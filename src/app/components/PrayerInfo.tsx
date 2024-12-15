"use client";
import Image from "next/image";
import React, { useState } from "react";
import prayerSittings from "../../../public/prayer_sittings.png";

/*
Credits:
https://islamqa.info/ar/answers/65847
*/

function PrayerInfo() {
	const [showPopup, setShowPopup] = useState(false);
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
				<h2 className="text-2xl font-bold mb-4 text-gray-900">
					أركان وواجبات وسنن الصلاة
				</h2>
				<p className="text-gray-700 mb-4">
					الفرق بين الركن والواجب: أن الركن لا يسقط عمدا ولا سهوا، بل لابد من
					الإتيان به. أما الواجب: فيسقط بالنسيان، ويجبر بسجود السهو.
				</p>
				<p className="text-gray-700 mb-4">
					وسنن الصلاة كثيرة، منها القولية، ومنها الفعلية. والمقصود بالسنن: ما
					عدا الأركان والواجبات. وقد أوصل بعض الفقهاء السنن القولية إلى سبع عشرة
					سنة، والسنن الفعلية إلى خمس وخمسين سنة. ولا تبطل الصلاة بترك شئ من
					السنن، ولو عمدا. بخلاف الأركان والواجبات.
				</p>
				<div className="mt-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						أركان الصلاة
					</h3>
					<ul className="list-disc pl-6 mr-5 text-gray-700 space-y-1">
						<li>القيام في الفرض على القادر.</li>
						<li>تكبيرة الإحرام وهي "الله أكبر".</li>
						<li>قراءة الفاتحة.</li>
						<li>الركوع وأقله أن ينحني بحيث يمكنه مس ركبتيه بكفيه.</li>
						<li>الرفع من الركوع.</li>
						<li>الاعتدال قائما.</li>
						<li>السجود مع تمكين الأعضاء السبعة من الأرض.</li>
						<li>الجلوس بين السجدتين.</li>
						<li>الطمأنينة في كل ركن.</li>
						<li>التشهد الأخير.</li>
						<li>الجلوس للتشهد الأخير.</li>
						<li>التسليمتان.</li>
						<li>ترتيب الأركان كما ورد.</li>
					</ul>
				</div>
				<div className="mt-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						واجبات الصلاة
					</h3>
					<ul className="list-disc pl-6 mr-5 text-gray-700 space-y-1">
						<li>التكبير لغير الإحرام.</li>
						<li>قول: سمع الله لمن حمده للإمام وللمنفرد.</li>
						<li>قول: ربنا ولك الحمد.</li>
						<li>قول سبحان ربي العظيم مرة في الركوع.</li>
						<li>قول: سبحان ربي الأعلى مرة في السجود.</li>
						<li>قول: رب اغفر لي بين السجدتين.</li>
						<li>التشهد الأول.</li>
						<li>الجلوس للتشهد الأول.</li>
					</ul>
				</div>
				<div className="mt-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						سنن الصلاة
					</h3>
					<p className="text-gray-700 mb-4">
						سنن الصلاة كثيرة، منها القولية، ومنها الفعلية. والمقصود بالسنن: ما
						عدا الأركان والواجبات. وقد أوصل بعض الفقهاء السنن القولية إلى سبع
						عشرة سنة، والسنن الفعلية إلى خمس وخمسين سنة. ولا تبطل الصلاة بترك شئ
						من السنن، ولو عمدا. بخلاف الأركان والواجبات.
					</p>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						سنن الصلاة القولية
					</h3>
					<ul className="list-disc pl-6 mr-5 text-gray-700 space-y-1">
						<li>دعاء الاستفتاح.</li>
						<li>التعوذ.</li>
						<li>البسملة.</li>
						<li>قول آمين.</li>
						<li>قراءة السورة بعد الفاتحة.</li>
						<li>الجهر بالقراءة للإمام.</li>
						<li>ما زاد على المرة في تسبيح الركوع والسجود وبين السجدتين.</li>
						<li>الصلاة على النبي في التشهد الأخير.</li>
					</ul>
				</div>
				<div className="mt-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						سنن الصلاة الفعلية
					</h3>
					<ul className="list-disc pl-6 mr-5 text-gray-700 space-y-1">
						<li>رفع اليدين مع تكبيرة الإحرام وعند الركوع والرفع منه.</li>
						<li>وضع اليدين على الصدر.</li>
						<li>النظر إلى موضع السجود.</li>
						<li>تمكين الأعضاء السبعة أثناء السجود.</li>
						<li className="flex items-center space-x-2">
							الجلوس مفترشاً بين السجدتين وفي التشهد الأول، والتورك في التشهد
							الأخير.
							<button
								className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs hover:bg-blue-600"
								onClick={() => setShowPopup(true)}
								aria-label="Show movement image"
							>
								!
							</button>
							{showPopup && (
								<div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
									<div className="bg-white p-4 rounded-lg shadow-lg w-80">
										<button
											className="relative top-0 mr-[95%] text-xl text-gray-900 font-bold hover:text-gray-500"
											onClick={() => setShowPopup(false)}
										>
											X
										</button>
										<h3 className="text-lg font-semibold text-gray-800 mb-2">
											توضيح
										</h3>
										<Image
											src={prayerSittings}
											alt="شرح جلوس"
											className="w-full h-auto rounded-lg"
										/>
									</div>
								</div>
							)}
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

export default PrayerInfo;
