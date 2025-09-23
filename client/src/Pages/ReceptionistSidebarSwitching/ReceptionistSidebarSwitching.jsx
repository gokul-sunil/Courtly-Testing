import React from "react";
import DashboardPage from "../AdminDashboard/AdminDashboard";
import MembersPage from "../MembersPage/MembersPage";
import ReportsPage from "../ReportPage/ReportPage";
import BookingsPage from "../BookingPage/BookingPage";
import SettingsPage from "../SettingsPage/SettingsPage";
import PaymentHistory from "../PaymentHistory/PaymentHistory";
import Sidebar from "../ReceptionistSidebar/ReceptionistSidebar";
import {useNavigate} from "react-router-dom"

const SidebarSwitching = ({ activeNav, setActiveNav }) => {
  const navigate=useNavigate()
  const handleLogout=()=>{
    navigate("/")
    setActiveNav("Dashboard")
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
      return <MembersPage />;
    case "Bookings":
      return <BookingsPage />;
    case "Payments":
      return <PaymentHistory />;
    case "Reports":
      return <ReportsPage />;
    case "Settings":
      return <SettingsPage />;
    case "Logout":
      handleLogout();
      return;
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

export default SidebarSwitching;
