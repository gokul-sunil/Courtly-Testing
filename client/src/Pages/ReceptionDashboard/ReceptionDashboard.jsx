import React, { useEffect, useState } from 'react';
import styles from "../ReceptionDashboard/ReceptionDashboard.module.css";
import BookingForm from "../BookingPage/BookingPage";
import axios from "axios"
import baseUrl from "../../baseUrl"

function ReceptionDashboard() {
 const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedCourtNumber,setSelectedCourtNumber]=useState(null)
  const [courts,setCourts]=useState([])

 
  const stats = [
    { label: 'Total Members', value: '250' },
    { label: 'Booking Details', value: '35' }
  ];

  const handleBookNow = (court) => {
    setSelectedCourt(court.courtName);
    setShowBookingForm(true);
    setSelectedCourtNumber(court._id)
    
  };

  const handleBackToDashboard = () => {
    setShowBookingForm(false);
    setSelectedCourt(null);
  };

  
useEffect(()=>{
  getCourts()
},[])
const getCourts=async () => {
  try {
    const response=await axios.get(`${baseUrl}/api/v1/Court/fetchCourts`);
    if(response.status===200){
      setCourts(response.data.data)
    }
    
  } catch (error) {
    console.log(error);
    
  }
}
if (showBookingForm) {
    return <BookingForm selectedCourt={selectedCourt} selectedCourtNumber={selectedCourtNumber} onBack={handleBackToDashboard} />;
  }
  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Dashboard</h1>
      </div>

      <div className={styles.courtsGrid}>
        {courts.map((court,index) => (
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

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className={styles.statCard}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            }}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <h2 className={styles.statValue}>{stat.value}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}


export default ReceptionDashboard