import React, { useEffect, useState } from 'react';
import styles from './AdminDashboard.module.css';
import BookingForm from './BookingForm';
import GymSideBarSwitching from '../GymSidebarSwitching/GymSidebarSwitching';
import axios from "axios"
import baseUrl from "../../baseUrl"

function AdminDashboard() {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedCourtNumber, setSelectedCourtNumber] = useState(null);
  const [courts, setCourts] = useState([]);
  const [isTrainerView, setIsTrainerView] = useState(false);
  const [trainerActiveNav, setTrainerActiveNav] = useState("Dashboard");

  

  const handleBookNow = (court) => {
    setSelectedCourt(court.courtName);
    setShowBookingForm(true);
    setSelectedCourtNumber(court._id);
  };

  const handleBackToDashboard = () => {
    setShowBookingForm(false);
    setSelectedCourt(null);
  };

  const handleToggleView = () => {
    setIsTrainerView(!isTrainerView);
    // Reset trainer navigation to Dashboard when switching views
    if (!isTrainerView) {
      setTrainerActiveNav("Dashboard");
    }
  };

  useEffect(() => {
    getCourts();
  }, []);
  

  const getCourts = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/v1/Court/fetchCourts`);
      if (response.status === 200) {
        setCourts(response.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // If in trainer view, render the trainer dashboard
  if (isTrainerView) {
    return (
      <div>
        <div className={styles.toggleContainer}>
          <button 
            className={styles.toggleButton} 
            onClick={handleToggleView}
          >
            Switch to Court View
          </button>
        </div>
        <GymSideBarSwitching 
          activeNav={trainerActiveNav} 
          setActiveNav={setTrainerActiveNav}
        />
      </div>
    );
  }

  if (showBookingForm) {
    return <BookingForm selectedCourt={selectedCourt} selectedCourtNumber={selectedCourtNumber} onBack={handleBackToDashboard} />;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Admin Dashboard</h1>
          <button 
            className={styles.toggleButton} 
            onClick={handleToggleView}
          >
            Switch to Gym View
          </button>
        </div>
      </div>

      <div className={styles.courtsGrid}>
        {courts.map((court, index) => (
          <div
            key={index}
            className={styles.courtCard}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className={styles.courtName}>{court.courtName}</div>
            <button
              className={styles.bookButton}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleBookNow(court);
              }}
            >
              Book
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;