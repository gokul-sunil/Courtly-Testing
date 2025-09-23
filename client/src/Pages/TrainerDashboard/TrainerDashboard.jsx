import React, { useEffect, useState } from "react";
import styles from "./TrainerDashboard.module.css";
import { useParams } from "react-router-dom";
import axios from "axios";
import baseUrl from "../../baseUrl";

function TrainerDashboard() {
  const { id } = useParams();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const getClients = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/v1/trainer/assigned-users/${id}`
      );
      console.log(response);
      
      if (response.status === 200) {
        setClients(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };
    getClients();
  }, [ id]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Dashboard</h1>
      </div>

      <div className={styles.courtsGrid}>
        <p>Hello trainer</p>
      </div>

      <div className={styles.statsGrid}>
        <div
          className={styles.statCard}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.1)";
          }}
        >
          <p className={styles.statLabel}>Total Clients</p>
          <h2 className={styles.statValue}>{clients.totalCount || ""}</h2>
        </div>
      </div>
    </div>
  );
}

export default TrainerDashboard;
