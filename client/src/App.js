import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login/Login.jsx";
import AdminLogin from "./Pages/AdminLogin/AdminLogin.jsx";
import TrainerLogin from "./Pages/Trainer/TrainerLogin.jsx";
import SidebarSwitching from "./Pages/SidebarSwitching/SidebarSwitching.jsx"; // Import the component
import ReceptionLogin from "./Pages/ReceptionLogin/ReceptionLogin.jsx";
import { useState } from "react";
import BookingManagement from "./Pages/BookingPage/BookingPage.jsx";
import ReportPage from "./Pages/ReportPage/ReportPage.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Trainer
import TrainerSidebarSwitching from "./Pages/TrainerSidebarSwitching/TrainerSidebarSwitching.jsx";

// Reception
import ReceptionistSidebarSwitching from "./Pages/ReceptionistSidebarSwitching/ReceptionistSidebarSwitching.jsx";

function App() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="App">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" 
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Adminlogin" element={<AdminLogin />} />
          <Route path="/Trainerlogin" element={<TrainerLogin />} />

          <Route
            path="/Admindashboard"
            element={
              <SidebarSwitching
                activeNav={activeNav}
                setActiveNav={setActiveNav}
              />
            }
          />
          <Route
            path="/Receptionistdashboard"
            element={
              <ReceptionistSidebarSwitching
                activeNav={activeNav}
                setActiveNav={setActiveNav}
              />
            }
          />
          <Route path="/booking" element={<BookingManagement />} />
          <Route path="/ReceptionLogin" element={<ReceptionLogin />} />
          <Route path="/report" element={<ReportPage />} />

          {/* Trainer */}
          <Route
            path="/Trainerdashboard/:id"
            element={
              <TrainerSidebarSwitching
                activeNav={activeNav}
                setActiveNav={setActiveNav}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
