import React, { useEffect, useState } from "react";
import styles from "./BookingOverView.module.css";
import baseUrl from "../../baseUrl";
import axios from "axios";
const BookingManagement = ({ selectedCourtNumber }) => {
  const [bookData, setBookData] = useState([]);

  useEffect(() => {
    const getBookings = async () => {
      try {
        const res = await axios.get(
          `${baseUrl}/api/v1/slot/booked/${selectedCourtNumber}`
        );
        console.log(res);
        setBookData(res.data.data);
      } catch (error) {
        console.log(error);
      }
    };
    getBookings();
  }, [selectedCourtNumber]);

  const calculateDurationFromTimeString = (timeString) => {
    // Example input: "06:15 pm - 07:15 pm"
    const [start, end] = timeString.split(" - ");

    const parseTime = (t) => {
      let [time, modifier] = t.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "pm" && hours !== 12) {
        hours += 12;
      }
      if (modifier === "am" && hours === 12) {
        hours = 0;
      }
      return { hours, minutes };
    };

    const startTime = parseTime(start);
    const endTime = parseTime(end);

    const startDate = new Date(0, 0, 0, startTime.hours, startTime.minutes);
    const endDate = new Date(0, 0, 0, endTime.hours, endTime.minutes);

    let diff = (endDate - startDate) / (1000 * 60); // difference in minutes
    if (diff < 0) {
      diff += 24 * 60; // adjust for next day
    }
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={styles.bookingPageWrapper}>
      <div className={styles.bookingSlotsGrid}>
        {bookData.length === 0 ? (
          <div className={styles.noBookingsMessage}>
            <div className={styles.noBookingsIcon}>📅</div>
            <h3>No bookings for this date</h3>
            <p>Select a different date or court to view bookings</p>
          </div>
        ) : (
          bookData
            .sort((a, b) => a.time.localeCompare(b.time)) // Sorting by 'time' string
            .map((booking) => (
              <div key={booking.slotId} className= {`${styles.bookingSlot} ${styles.booked}`}>
                <div className={styles.bookingInfo}>
                  <div className={styles.playerName}>{booking.bookedBy}</div>
                  <div className={styles.timeRange}>{booking.time}</div>
                  <div className={styles.duration}>
                    {calculateDurationFromTimeString(booking.time)}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default BookingManagement;
