const fs = require("fs");
const path = require("path");

const files = [
  "src/screens/SplashScreen.jsx",
  "src/screens/PhoneScreen.jsx",
  "src/screens/ProfileSetupScreen.jsx",
  "src/screens/ProviderSetupScreen.jsx",
  "src/screens/ClientProfileScreen.jsx",
  "src/screens/HomeProviderScreen.jsx",
  "src/screens/VerificationPendingScreen.jsx",
  "src/screens/ProviderProfileScreen.jsx",
  "src/screens/ProviderProfileOwnScreen.jsx",
  "src/screens/HomeScreen.jsx",
  "src/screens/MapScreen.jsx",
  "src/screens/ChatListScreen.jsx",
  "src/screens/ChatScreen.jsx",
  "src/screens/MyRequestsScreen.jsx",
  "src/screens/MissionHistoryScreen.jsx",
  "src/screens/RequestDetailScreen.jsx",
  "src/components/chat/ChatInput.jsx",
  "src/components/homeProvider/RequestCard.jsx",
  "src/components/clientProfile/FavoritesSection.jsx",
  "src/components/providerOwnProfile/PortfolioSection.jsx",
  "src/components/providerOwnProfile/EditProfileSheet.jsx",
  "src/components/providerProfile/ServiceRequestModal.jsx",
  "src/components/providerProfile/ReviewsTab.jsx",
  "src/components/ui/Select.jsx",
  "src/components/ui/EmptyState.jsx",
];

let errors = 0;
for (const f of files) {
  try {
    const code = fs.readFileSync(f, "utf-8");
    const opens = (code.match(/\{/g) || []).length;
    const closes = (code.match(/\}/g) || []).length;
    if (Math.abs(opens - closes) > 2) {
      console.error("BRACE MISMATCH: " + f + " (" + opens + " open, " + closes + " close)");
      errors++;
    }
    if (code.length < 100) {
      console.error("FILE TOO SHORT: " + f);
      errors++;
    }
  } catch (e) {
    console.error("CANNOT READ: " + f + " - " + e.message);
    errors++;
  }
}
if (errors === 0) console.log("All " + files.length + " files OK - no structural issues");
else console.log(errors + " error(s) found");
