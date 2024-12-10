import webPush from "web-push";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

console.log(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
console.log(process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY);

if (!fs.readFileSync(".env.local").includes("VAPID")) {
	const vapidKeys = webPush.generateVAPIDKeys();
	const envData = `
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
NEXT_PUBLIC_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
    `;

	fs.writeFileSync(".env.local", envData, { flag: "a" });
}
