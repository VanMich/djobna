// src/hooks/useAuth.js
// Hook pour l'authentification OTP via Firebase Auth
// Utilisé dans PhoneScreen.js et OTPScreen.js

import { useState } from "react";
import { auth } from "../config/firebase";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";

export function useAuth() {
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────
  // ÉTAPE 1 : Envoyer le SMS OTP
  // phoneNumber : format E.164 ex "+237612345678"
  // recaptchaVerifier : ref passée depuis PhoneScreen
  // ─────────────────────────────────────────
  const sendOTP = async (phoneNumber, recaptchaVerifier) => {
    setLoading(true);
    setError(null);

    try {
      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier,
      );
      setVerificationId(id);
      return { success: true, verificationId: id };
    } catch (err) {
      const msg =
        err.code === "auth/invalid-phone-number"
          ? "Numéro de téléphone invalide"
          : err.code === "auth/too-many-requests"
            ? "Trop de tentatives. Réessayez dans quelques minutes."
            : "Erreur d'envoi du SMS. Vérifiez votre connexion.";

      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // ÉTAPE 2 : Vérifier le code OTP (6 chiffres)
  // ─────────────────────────────────────────
  const verifyOTP = async (otpCode, idFromRoute = null) => {
    const id = verificationId || idFromRoute;

    if (!id) {
      setError("Session expirée. Renvoyez le code.");
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const credential = PhoneAuthProvider.credential(id, otpCode);
      const result = await signInWithCredential(auth, credential);

      return {
        success: true,
        user: result.user,
        isNewUser: result._tokenResponse?.isNewUser ?? false,
      };
    } catch (err) {
      const msg =
        err.code === "auth/invalid-verification-code"
          ? "Code incorrect. Vérifiez et réessayez."
          : err.code === "auth/code-expired"
            ? "Code expiré. Demandez un nouveau code."
            : "Vérification échouée. Réessayez.";

      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return { sendOTP, verifyOTP, loading, error, verificationId };
}
