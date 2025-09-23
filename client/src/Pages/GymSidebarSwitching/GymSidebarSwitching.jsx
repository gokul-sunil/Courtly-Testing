import React from "react";
import DashboardPage from "../GymDashboard/GymDashboard";
import ReportsPage from "../GymReport/GymReport";
import Sidebar from "../GymSidebar/GymSidebar";
import { useNavigate } from "react-router-dom";
import Login from "../Login/Login";
import GymMembers from "../GymMembers/GymMembers";
import Gym from "../Gym/Gym";
import PaymentHistory from "../GymPaymentHistory/GymPaymentHistory";

const GymSidebarSwitching = ({ activeNav, setActiveNav }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/");
  };
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
      case "Payments":
        return <PaymentHistory />;
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

export default GymSidebarSwitching;
