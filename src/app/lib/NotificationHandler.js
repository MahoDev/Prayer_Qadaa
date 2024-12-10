"use client";

import { useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { toast } from "react-toastify";
import { auth, db, messaging, app } from "./firebase.js"; // Import messaging from firebase.js
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

async function requestAndStoreToken(userId) {
	try {
		let token = null;
		token = await getToken(messaging, {
			vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
		});

		if (token) {
			// Store the token in Firestore
			try {
				if (userId) {
					const usersRef = doc(db, "users", userId);
					await setDoc(
						usersRef,
						{ fcmToken: token, timestamp: serverTimestamp() },
						{ merge: true }
					);
					console.log("Token stored in Firestore");
				}
			} catch (error) {
				console.error("Error storing token in Firestore:", error);
			}
		} else {
			console.log("No registration token available. Requesting permission...");
			requestNotificationPermission(); // Request permission if no token
		}
	} catch (error) {
		console.error("Error getting token:", error);
	}
}

export const requestNotificationPermission = async (userId) => {
	try {
		await Notification.requestPermission();

		if (auth.currentUser?.uid === userId) {
			// Check if user is still the same

			requestAndStoreToken(userId);
		}
	} catch (error) {}
};

export default function NotificationHandler() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			// Check if service worker is supported
			navigator.serviceWorker
				.register("/firebase-messaging-sw.js")
				.then((registration) => {
					console.log("Service worker registered:", registration);
				})
				.catch((error) => {
					console.error("Service worker registration failed:", error);
				});
		} else {
			console.warn("Service workers are not supported in this browser.");
		}

		onMessage(messaging, (payload) => {
			toast.info(
				payload.notification?.body || "Received a foreground notification"
			);
		});

		const unsubscribe = onAuthStateChanged(auth, (user) => {
			// Move onAuthStateChanged inside useEffect

			if (user) {
				requestNotificationPermission(user.uid); // Pass messaging and userId
			}
			// No else block needed, as you'll handle the signed-out case in requestNotificationPermission
		});

		return () => unsubscribe(); // Clean up the listener
	}, []);

	return null;
}
