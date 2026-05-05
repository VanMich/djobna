import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { useState } from "react";
import { auth } from "../config/firebase";

// ⚠️ Note importante sur React Native + Firebase Auth :
// Firebase Auth côté web utilise reCAPTCHA (invisible sur mobile)
// Pour React Native natif, on utilise expo-firebase-recaptcha
// Pour Expo Go (dev), on peut utiliser le mode "test" Firebase

export function useAuth() {
  const [verificationId, setVerificationId] = useState(null);
  // verificationId = l'identifiant de session SMS retourné par Firebase
  // On en a besoin pour vérifier le code OTP ensuite

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────
  // ÉTAPE 1 : Envoyer le SMS
  // ─────────────────────────────────────────
  const sendOTP = async (phoneNumber, recaptchaVerifier) => {
    // phoneNumber doit être au format E.164 : "+237612345678"
    // recaptchaVerifier vient de FirebaseRecaptchaVerifierModal (OTPScreen)
    setLoading(true);
    setError(null);

    try {
      // PhoneAuthProvider.verifyPhoneNumber() envoie le SMS
      // et retourne un verificationId unique pour cette session
      const provider = new PhoneAuthProvider(auth);

      // recaptchaVerifier est obligatoire pour la sécurité anti-spam
      // Passé en paramètre depuis OTPScreen
      const id = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier,
      );
      setVerificationId(id);
      return { success: true };
    } catch (err) {
      // Codes d'erreur Firebase courants au Cameroun :
      // auth/invalid-phone-number  → numéro mal formaté
      // auth/too-many-requests     → trop de tentatives (rate limit)
      // auth/quota-exceeded        → quota SMS dépassé (plan gratuit)
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
  // ÉTAPE 2 : Vérifier le code OTP
  // ─────────────────────────────────────────
  const verifyOTP = async (otpCode) => {
    if (!verificationId) {
      setError("Session expirée. Renvoyez le code.");
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      // PhoneAuthProvider.credential() combine verificationId + code
      // → crée un "credential" (preuve d'identité)
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);

      // signInWithCredential() connecte l'utilisateur avec ce credential
      // → retourne un UserCredential avec user.uid, user.phoneNumber, etc.
      const result = await signInWithCredential(auth, credential);

      return {
        success: true,
        user: result.user,
        isNewUser: result._tokenResponse?.isNewUser ?? false,
        // isNewUser → true si c'est la première connexion
        // → utile pour rediriger vers l'écran de complétion du profil
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
