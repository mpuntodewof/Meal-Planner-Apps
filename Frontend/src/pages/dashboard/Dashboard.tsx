import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../redux/store/storeRedux";
import userModel from "../../interfaces/userModel";
import Navbar from "../../components/sub-comp/Navbar";
import Footer from "../../components/Footer";
import DashboardTabs, { TabDef, TabKey } from "./components/DashboardTabs";
import OverviewTab from "./tabs/OverviewTab";
import ProfileTab from "./tabs/ProfileTab";
import MyRecipesTab from "./tabs/MyRecipesTab";
import FavoritesTab from "./tabs/FavoritesTab";
import SecurityTab from "./tabs/SecurityTab";
import "./dashboard.css";

const TABS: TabDef[] = [
  { key: "overview", label: "Overview" },
  { key: "profile", label: "Profile" },
  { key: "recipes", label: "My Recipes" },
  { key: "favorites", label: "Favorites" },
  { key: "security", label: "Security" },
];

// Per-tab masthead so the analytics-specific data note never sits over an edit form.
const MASTHEAD: Record<TabKey, { title: string; lead: string }> = {
  overview: { title: "Your planning behavior", lead: "How you plan, and what your plans reveal about your tastes and habits — at a glance." },
  profile: { title: "Your account", lead: "Update your personal details and profile photo." },
  recipes: { title: "Your recipes", lead: "Everything you've created, in one place." },
  favorites: { title: "Your favorites", lead: "Recipes you've hearted across the app." },
  security: { title: "Security", lead: "Manage your password." },
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userData: userModel = useSelector((state: RootState) => state.userAuthStore);
  const userId: string = userData.id ?? "";
  const email: string = userData.email ?? "";
  const role: string = (userData.role ?? "").toLowerCase();

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");
  const authResolving = !userId && hasToken;
  const loggedOut = !userId && !hasToken;

  const [active, setActive] = useState<TabKey>("overview");
  const mast = MASTHEAD[active];

  return (
    <>
      <Navbar />
      <div className="dashboard-root">
        <header className="ds-masthead">
          <div className="ds-kicker">Meal Planner · Account</div>
          <h1 className="ds-title">{mast.title}</h1>
          <p className="ds-lead">{mast.lead}</p>
        </header>

        {loggedOut && (
          <div className="ds-loading">
            Please <button className="ds-linkbtn" onClick={() => navigate("/login")}>log in</button> to view your account.
          </div>
        )}
        {authResolving && <div className="ds-loading">Loading your account…</div>}

        {userId && (
          <>
            <DashboardTabs tabs={TABS} active={active} onChange={setActive} />
            {active === "overview" && <OverviewTab userId={userId} role={role} />}
            {active === "profile" && <ProfileTab userId={userId} />}
            {active === "recipes" && <MyRecipesTab userId={userId} />}
            {active === "favorites" && <FavoritesTab userId={userId} />}
            {active === "security" && <SecurityTab email={email} />}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
