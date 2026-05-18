// src/hooks/useAuth.js
// Hook pour l'authentification OTP par SMS via Supabase + Twilio
// Utilisé dans : PhoneScreen.jsx (sendOTP) et OTPScreen.jsx (verifyOTP)
//
// Flow complet :
//   1. sendOTP(phone)          → Supabase appelle Twilio → Twilio envoie le SMS
//   2. verifyOTP(phone, code)  → Supabase vérifie le code → session créée
//
// Différence avec Firebase :
//   - Plus de reCAPTCHA (géré côté serveur par Twilio)
//   - Plus de verificationId (le numéro de téléphone suffit pour la vérification)

import { useState } from "react";
import { supabase } from "../config/supabase";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────
  // ÉTAPE 1 : Envoyer le SMS OTP
  // phoneNumber : format E.164 ex "+237612345678"
  // → équivalent de PhoneAuthProvider.verifyPhoneNumber() sous Firebase
  // ─────────────────────────────────────────
  const sendOTP = async (phoneNumber) => {
    setLoading(true);
    setError(null);

    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });
      if (err) throw err;
      return { success: true };
    } catch (err) {
      const msg = err.message?.includes("invalid")
        ? "Numéro de téléphone invalide"
        : err.message?.includes("rate") || err.message?.includes("limit")
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
  // phoneNumber : même numéro qu'à l'étape 1
  // otpCode    : code saisi par l'utilisateur
  // → équivalent de signInWithCredential() sous Firebase
  //
  // isNewUser : true si l'utilisateur n'a pas encore de profil dans la table users
  //             → utilisé dans OTPScreen pour rediriger vers ProfileSetup
  // ─────────────────────────────────────────
  const verifyOTP = async (phoneNumber, otpCode) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: "sms",
      });
      if (err) throw err;

      // Vérifie si l'utilisateur a déjà un profil → détermine isNewUser
      // maybeSingle() retourne null sans erreur si aucune ligne trouvée
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      return {
        success: true,
        user: data.user,
        isNewUser: !profile, // true = pas encore de profil → aller sur ProfileSetup
      };
    } catch (err) {
      const msg =
        err.message?.includes("invalid") || err.message?.includes("Token")
          ? "Code incorrect. Vérifiez et réessayez."
          : err.message?.includes("expired")
            ? "Code expiré. Demandez un nouveau code."
            : "Vérification échouée. Réessayez.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // signOut : identique à signOut(auth) de Firebase
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { sendOTP, verifyOTP, signOut, loading, error };
}
