"use client"; 
import { useEffect } from "react";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";

export default function FirebaseAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Redirect Result Error:", error);
      }
    };

    handleRedirectResult();
  }, []);

  return null; // No need to render anything in this component
}
