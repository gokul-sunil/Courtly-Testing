import React from "react";
import DashboardPage from "../TrainerDashboard/TrainerDashboard";
import ReportsPage from "../ReportPage/ReportPage";
import SettingsPage from "../SettingsPage/SettingsPage";
import Sidebar from "../TrainerSidebar/TrainerSidebar";
import { useNavigate } from "react-router-dom"
import Login from "../Login/Login"
import GymMembers from "../GymMembers/GymMembers";
import Gym from "../Gym/Gym"

const TrainerSidebarSwitching = ({ activeNav, setActiveNav }) => {
  const navigate = useNavigate()
  const handleLogout = () => {
    navigate("/")
  }
  const styles = {
    container: {
      fontFamily: "system-ui, -apple-system, sans-serif",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    },
  };

  const renderPage = () => {
    switch (activeNav) {
      case "Dashboard":
        return <DashboardPage />;
      case "Members":
        return <GymMembers />;
      case "Gym":
        return <Gym />;
      case "Reports":
        return <ReportsPage />;
      case "Settings":
        return <SettingsPage />;
      case "Logout":
        handleLogout();
        return <Login />;
      default:
        return <DashboardPage />;
    }
  };


  return (
    <div style={styles.container}>
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
      {renderPage()}
    </div>
  );
};

export default TrainerSidebarSwitching;
