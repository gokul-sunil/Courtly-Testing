// Tabs.js
import React from 'react';
import styles from './AdminDashboard.module.css'; // or use a separate CSS module if needed

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className={styles.tabsContainer}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
