/**
 * Adds `fonts` to existing theme import lines where it's missing but used.
 */
const fs = require("fs");
const path = require("path");

const files = [
  "src/components/providerOwnProfile/EditProfileSheet.jsx",
  "src/components/ui/Button.jsx",
  "src/components/ui/Select.jsx",
  "src/screens/ClientProfileScreen.jsx",
  "src/screens/HomeScreen.jsx",
  "src/screens/MapScreen.jsx",
  "src/screens/MissionHistoryScreen.jsx",
  "src/screens/MyRequestsScreen.jsx",
  "src/screens/OTPScreen.jsx",
  "src/screens/PhoneScreen.jsx",
  "src/screens/ProfileSetupScreen.jsx",
  "src/screens/ProviderProfileOwnScreen.jsx",
  "src/screens/ProviderSetupScreen.jsx",
  "src/screens/RequestDetailScreen.jsx",
  "src/screens/VerificationPendingScreen.jsx",
];

let fixed = 0;
for (const rel of files) {
  const filePath = path.resolve(rel);
  let code = fs.readFileSync(filePath, "utf-8");

  // Check if fonts is already imported
  const themeImportRegex = /import\s*\{([^}]+)\}\s*from\s*["'][^"']*theme["']/;
  const match = code.match(themeImportRegex);

  if (!match) {
    console.log("  NO THEME IMPORT FOUND: " + rel);
    continue;
  }

  const importContent = match[1];
  if (importContent.includes("fonts")) {
    console.log("  ALREADY HAS fonts: " + rel);
    continue;
  }

  // Add fonts to the import
  const newImport = importContent.trim().replace(/,?\s*$/, "") + ", fonts";
  const newLine = match[0].replace(match[1], " " + newImport + " ");
  code = code.replace(match[0], newLine);

  fs.writeFileSync(filePath, code, "utf-8");
  console.log("  FIXED: " + rel);
  fixed++;
}

console.log("\nFixed " + fixed + " files");
