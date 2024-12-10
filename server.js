import admin from "firebase-admin";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import webpush from "web-push";
import cron from "node-cron";
import { differenceInMinutes, addMinutes, subMinutes, addDays } from "date-fns";
import dotenv from "dotenv";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

dotenv.config({ path: "./.env.local" });

const REMINDER_WINDOW_MINUTES = 2; // Check for reminders within a 2-minute window
const app = express();
const port = process.env.PORT || 3001; // Or any available port
app.use(bodyParser.json());
app.use(cors());

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});
}

const db = admin.firestore(); // Firestore instance from Firebase Admin SDK

console.log("vapid");
console.log(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

webpush.setVapidDetails(
	"mailto:mt.alshahat@gmail.com",
	process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
	process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY
);

// ... used for triggering a push notification from something in the app.
app.post("/send-reminder", async (req, res) => {
	// Send push notification using web-push
	try {
		const { title, body, token } = req.body; // Assuming the notification data is coming from the request body
		const pushPayload = JSON.stringify({
			title,
			body,
		});

		const pushOptions = {
			TTL: 3600, // Time-to-live
		};

		await webpush.sendNotification(token, pushPayload, pushOptions); 

		console.log("Successfully sent push notification");
		res.status(200).send("Notification sent successfully");
	} catch (error) {
		console.error("Error sending push notification:", error);
		res.status(500).send("Error sending push notification");
	}
});

// Helper function to check if a reminder should be sent
const shouldSendReminder = (reminder) => {
    const currentTime = new Date();
    const reminderTime = reminder.nextReminderTime.toDate();
    return Math.abs(currentTime.getTime() - reminderTime.getTime()) < REMINDER_WINDOW_MINUTES * 60 * 1000; // Compare timestamps directly
};

// Scheduled task to send reminders (runs every minute)
cron.schedule("* * * * *", async () => {
	try {
		const currentTime = new Date();
		const start = subMinutes(currentTime, REMINDER_WINDOW_MINUTES); // Start of the check window
		const end = addMinutes(currentTime, REMINDER_WINDOW_MINUTES); // End of the check window

		// Query Firestore using Admin SDK
		const remindersSnapshot = await db
			.collection("scheduledReminders")
			.where("nextReminderTime", ">=", start)
			.where("nextReminderTime", "<=", end)
			.where("sent", "==", false) // Only fetch unsent reminders
			.get();

		// Loop through the reminders and process them
		for (const reminderDoc of remindersSnapshot.docs) {
			const reminder = { id: reminderDoc.id, ...reminderDoc.data() };

			if (shouldSendReminder(reminder)) {
				// Fetch user document
				try {
					const userDoc = await db
						.collection("users")
						.doc(reminder.userId)
						.get();
					if (!userDoc.exists || !userDoc.data().fcmToken) {
						console.log(
							`User ${reminder.userId} does not have a registered FCM token for plan ${reminder.planId}`
						);
						continue; // Skip if no token is found
					}

					const planDoc = await db
						.collection("qadaaPlans")
						.doc(reminder.planId)
						.get();
					const planName = planDoc.data().name;

					const fcmToken = userDoc.data().fcmToken;
					// Construct the notification message
					const message = {
						token: fcmToken,
						notification: {
							title: "تذكير بقضاء الصلاة",
							body: `وقت قضاء الصلاة (${reminder.reminderTime}) للخطة (${planName})`,
						},
					};

					console.log("fcmToken");
					console.log(fcmToken);

					const response = await admin.messaging().send(message); // Send push notification
					console.log(`Successfully sent reminder for prayer: ${response}`);

					// Update reminder status in Firestore
					const nextReminderTime = addDays(
						reminder.nextReminderTime.toDate(),
						1
					);
					await db
						.collection("scheduledReminders")
						.doc(reminder.id)
						.update({
							sent: true,
							nextReminderTime:
								admin.firestore.Timestamp.fromDate(nextReminderTime),
						});
				} catch (error) {
					console.error("Error sending reminder:", error);
				}
			}
		}
	} catch (error) {
		console.error("Error in cron job:", error);
	}
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
