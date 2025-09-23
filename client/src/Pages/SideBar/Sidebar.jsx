import styles from "./sidebar.module.css";
import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  DollarSign
} from "lucide-react";

function Sidebar({ activeNav, setActiveNav }) {
  const [hoveredNav, setHoveredNav] = useState(null);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Members", icon: Users },
    { name: "Bookings", icon: Calendar },
    { name: "Reports", icon: BarChart3 },
    { name: "Settings", icon: Settings },
    { name: "Payments", icon: DollarSign },
    { name: "Logout", icon: LogOut },

  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <h1 className={styles.logoText}>Courtly</h1>
        <p className={styles.logoSubtext}>Admin</p>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.name;
          const isHovered = hoveredNav === item.name;

          return (
            <button
              key={item.name}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""
                } ${isHovered && !isActive ? styles.navItemHover : ""}`}
              onClick={() => setActiveNav(item.name)}
              onMouseEnter={() => setHoveredNav(item.name)}
              onMouseLeave={() => setHoveredNav(null)}
            >
              <Icon className={styles.navIcon} />
              {item.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;
