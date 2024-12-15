"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout"; 
import {
	prayerNamesArabic,
	prayerNames,
	PrayerType,
} from "@/app/lib/prayerConstants";
import sidePrayer from "../../../public/side-prayer.png";
import Image from "next/image";
import PrayerInfo from "../components/PrayerInfo";

type AnalysisResult = Array<{
	frame: string;
	boxes: number[][];
	conf: number[];
	cls: number[];
	names: { [key: number]: string };
}> | null;

const prayerPostures: string[] = ["qiyam", "ruku", "sujud", "julus"];
const prayerPosturesMap: { [key: string]: string } = {
	qiyam: "قيام",
	ruku: "ركوع",
	sujud: "سجود",
	julus: "جلوس",
};

const idealPrayerSequences: { [key in PrayerType]: number[] } = {
	fajr: [0, 1, 0, 2, 3, 2, 0, 1, 0, 2, 3, 2, 3],
	dhur: [
		0, 1, 0, 2, 3, 2, 0, 1, 0, 2, 3, 2, 3, 0, 1, 0, 2, 3, 2, 0, 1, 0, 2, 3, 2,
		3,
	],
	asr: [
		0, 1, 0, 2, 3, 2, 0, 1, 0, 2, 3, 2, 3, 0, 1, 0, 2, 3, 2, 0, 1, 0, 2, 3, 2,
		3,
	],
	maghrib: [0, 1, 0, 2, 3, 2, 0, 1, 0, 2, 3, 2, 3, 0, 1, 0, 2, 3, 2, 3],
	isha: [
		0, 1, 0, 2, 3, 2, 0, 1, 0, 2, 3, 2, 3, 0, 1, 0, 2, 3, 2, 0, 1, 0, 2, 3, 2,
		3,
	],
};
export default function AiCheckerPage() {
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [analyzing, setAnalyzing] = useState(false);
	const [results, setResults] = useState<AnalysisResult>(null);
	const [detectedPostures, setDetectedPostures] = useState<string[]>([]);
	const [selectedPrayer, setSelectedPrayer] = useState<PrayerType>("fajr");
	const [classNames, setClassNames] = useState<{
		[key: number]: string;
	} | null>(null);
	const [framesBase64, setFramesBase64] = useState<string[]>([]);
	const [confidenceThreshold, setConfidenceThreshold] = useState(0.8);
	const [displayedFrames, setDisplayedFrames] = useState<
		{ frameIndex: number; className: string; confidence: number }[] | null
	>(null);
	const posturesSequenceToNumbers = (sequence: string[]) => {
		return sequence.map((posture) => prayerPostures.indexOf(posture));
	};

	const getVideoFramesAsBase64 = async (
		videoFile: File,
		fps: number
	): Promise<string[]> => {
		return new Promise((resolve, reject) => {
			try {
				const video = document.createElement("video");
				const framesBase64: string[] = [];

				video.onloadedmetadata = () => {
					// Set up the canvas dimensions
					const canvas = document.createElement("canvas");
					const context = canvas.getContext("2d");
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;

					const interval = 1 / fps; // Interval in seconds
					let currentTime = 0; // Start at the beginning of the video

					video.onseeked = () => {
						if (currentTime >= video.duration) {
							resolve(framesBase64);
							URL.revokeObjectURL(video.src);
							return;
						}

						// Draw the current frame to the canvas
						context?.drawImage(video, 0, 0, canvas.width, canvas.height);

						// Save the frame as a base64 string
						framesBase64.push(canvas.toDataURL("image/jpeg", 0.8));

						// Move to the next time interval
						currentTime += interval;
						video.currentTime = Math.min(currentTime, video.duration); // Avoid going beyond the duration
					};

					// Start the frame capture
					video.currentTime = 0;
				};

				video.onerror = () => {
					reject(new Error("Error processing the video."));
				};

				// Set the video source
				video.src = URL.createObjectURL(videoFile);
			} catch (error) {
				reject(new Error("Error processing the video."));
			}
		});
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setResults(null);
		const file = event.target.files?.[0] || null;
		setVideoFile(file);

		if (!file) return;
		if (file.size > 1024 * 1024 * 100) {
			toast.error("الملف كبير جدًا. يُرجى تحديد ملف أقل من 100 ميجابايت.");
			return;
		}

		try {
			const frames = await getVideoFramesAsBase64(file, 5);
			setFramesBase64(frames);
		} catch (error) {
			console.error("خطأ في استخراج الإطارات من الفيديو.");
		}
	};

	const handleAnalyze = async () => {
		if (!videoFile || framesBase64.length === 0) {
			toast.error("يرجى رفع فيديو.");
			return;
		}

		setAnalyzing(true);
		setClassNames(null);
		setDetectedPostures([]); // Update state with the sequence
		setDisplayedFrames(null); // Update state with frames info
		setResults(null); // Store results

		try {
			const response = await fetch("http://localhost:5001/analyze-prayer", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ frames: framesBase64 }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "حدث خطأ");
			}

			const results: AnalysisResult = await response.json();

			if (!Array.isArray(results)) {
				throw new Error("Unexpected response format from the server.");
			}

			const posturesSequence: string[] = [];
			const displayedFrames: {
				frameIndex: number;
				className: string;
				confidence: number;
			}[] = [];

			results.forEach((result, resultIndex) => {
				if (
					result?.boxes?.length > 0 &&
					result.cls?.length > 0 &&
					result.conf?.length > 0
				) {
					// Find the class with the highest confidence
					const highestConfidenceIndex = result.conf.indexOf(
						Math.max(...result.conf)
					);
					const className = result.names[result.cls[highestConfidenceIndex]];
					const confidence = result.conf[highestConfidenceIndex];

					if (confidence >= confidenceThreshold) {
						const lastClassName = posturesSequence[posturesSequence.length - 1];
						if (className && className !== lastClassName) {
							// Add to sequence if it's not a repeat of the last posture
							posturesSequence.push(className);

							// Add frame info for display
							displayedFrames.push({
								frameIndex: resultIndex,
								className,
								confidence,
							});
						}
					} else {
						//console.log(`Skipped frame with low confidence: ${confidence}`);
					}
				}
			});

			console.log(posturesSequence);
			setClassNames(results[0]?.names || {}); // Set class names
			setDetectedPostures(posturesSequence); // Update state with the sequence
			setDisplayedFrames(displayedFrames); // Update state with frames info
			setResults(results); // Store results
		} catch (error) {
			toast.error((error as Error).message);
		} finally {
			setAnalyzing(false);
		}
	};

	const analyzePrayer = () => {
		if (!results) return "يرجى رفع فيديو.";

		const detectedSequence = posturesSequenceToNumbers(detectedPostures);
		const idealSequence = idealPrayerSequences[selectedPrayer];

		return JSON.stringify(detectedSequence) ===
			JSON.stringify(idealSequence) ? (
			<span className="text-green-500">الصلاة صحيحة. </span>
		) : (
			<span className="text-red-500">الصلاة غير صحيحة. </span>
		);
	};

	console.log(displayedFrames);
	return (
		<Layout>
			<div className="container mx-auto px-4 py-8">
				<h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">
					فاحص الصلاة
					<span className="text-red-500 mr-2 inline-block">
						🚧 (قيد التطوير) 🚧
					</span>
				</h2>
				<p className="text-gray-800 text-center">
					برنامج يعتمد على تقنيات الذكاء الاصطناعي لتحليل مقاطع الفيديو الخاصة
					بك أثناء أداء الصلاة التي أخترتها، وتقديم تقييم لصحتها.
				</p>
				<p className="text-gray-800 mt-2 text-center">
					احرص على ظهور جسدك بأكمله والتصوير من الجانب لأفضل النتائج.
				</p>
				<div className="flex justify-center mt-4">
					<Image
						alt="side-prayer"
						src={sidePrayer}
						width={371}
						height={185}
						className="rounded-md shadow"
					/>
				</div>

				<div className="mt-8">
					<label
						htmlFor="prayer-select"
						className="block text-gray-700 font-bold mb-2"
					>
						الصلاة المختارة:
					</label>
					<select
						id="prayer-select"
						className="w-full border text-gray-700 border-gray-300 rounded-md p-2 focus:border-blue-500 focus:outline-none sm:text-sm"
						value={selectedPrayer}
						onChange={(e) => setSelectedPrayer(e.target.value as PrayerType)}
					>
						{prayerNames.map((prayerName) => (
							<option key={prayerName} value={prayerName}>
								{prayerNamesArabic[prayerName]}
							</option>
						))}
					</select>
				</div>

				<div className="mt-4">
					<label
						htmlFor="video-upload"
						className="block text-gray-700 font-bold mb-2"
					>
						رفع فيديو:
					</label>
					<input
						id="video-upload"
						type="file"
						accept="video/*"
						className="block w-full text-gray-700 border border-gray-300 rounded-md p-2"
						onChange={handleFileChange}
					/>
					<button
						onClick={handleAnalyze}
						className="mt-4 w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:opacity-50"
						disabled={
							analyzing || (videoFile !== null && framesBase64.length === 0)
						}
					>
						{analyzing ? "جاري الفحص..." : "أفحص"}
					</button>
				</div>

				<div className="mt-8 border border-gray-200 rounded-md p-6 shadow-sm">
					<p className="font-bold text-xl text-gray-900 mb-4">نتائج الفحص</p>
					{results ? (
						<>
							<div className="mb-4">
								<p className="text-gray-700 font-medium">
									<span className="font-bold">الحركات المكتشفة:</span>
								</p>
								<p className="text-gray-700 mt-2">
									{detectedPostures
										.map((posture) => prayerPosturesMap[posture])
										.join(" ← ")}
								</p>
								<p className="text-gray-700 mt-4">{analyzePrayer()}</p>
							</div>

							{displayedFrames && displayedFrames.length < 13 && (
								<p className="text-gray-700 mt-4 bg-yellow-50 p-4 border border-yellow-200 rounded">
									إن رأيت أن النتيجة خاطئة، يرجى إرسال مقطع أكثر وضوحًا.
								</p>
							)}

							<div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{displayedFrames?.map((frameData) => {
									const postureIndex = prayerPostures.indexOf(
										frameData.className
									);
									const isMatching =
										idealPrayerSequences[selectedPrayer][postureIndex] ===
										postureIndex;

									return (
										<div
											key={frameData.frameIndex}
											className={`border border-gray-200 rounded-md p-4 ${
												isMatching ? "bg-green-100" : ""
											}`}
										>
											<div className="flex justify-center">
												<Image
													src={framesBase64[frameData.frameIndex]}
													alt={`Frame ${frameData.frameIndex + 1}`}
													width={160}
													height={160}
													className="max-h-40 w-auto rounded-md"
												/>
											</div>
											<p className="text-sm font-medium text-gray-500 mt-2 text-center">
												{prayerPosturesMap[frameData.className]} (
												{(frameData.confidence * 100).toFixed(0)}%)
											</p>
										</div>
									);
								})}
							</div>
						</>
					) : (
						<>
							<p className="text-gray-700 bg-gray-50 p-4 border border-gray-200 rounded">
								لا يوجد نتائج. يرجى رفع فيديو وبدء الفحص.
							</p>
						</>
					)}
				</div>
				{(results === null || results.length == 0) && <PrayerInfo />}
			</div>
		</Layout>
	);
}
