import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../ReportPage/report.css";
import "../BookingPage/BookingManagement.module.css";
import axios from "axios";
import baseUrl from "../../baseUrl";

function GymReport() {
  const [data, setData] = useState([]);
  const [fullData, setFullData] = useState([]);
  // Sample booking data
  // const data = [
  //   { month: "Jan", bookings: 400 },
  //   { month: "Feb", bookings: 300 },
  //   { month: "Mar", bookings: 450 },
  //   { month: "Apr", bookings: 320 },
  //   { month: "May", bookings: 500 },
  //   { month: "Jun", bookings: 200 },
  //   { month: "Jul", bookings: 350 },
  // ];
  const reportData = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/v1/gym/full-statistics`);
      console.log(res);

      if (res.status === 200) {
        setData(res.data.monthlyRevenue);
        setFullData(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    reportData();
  }, []);
  return (
    <div className="reportsPageContainer">
      <div className="reportsCourtHeader"></div>

      {/* Booking Overview */}
      <div className="reportsOverviewSection">
        <h3>Booking Overview</h3>
        <div className="reportsOverviewCards">
          <div className="reportsCard">
            <p>Total Bookings</p>
            <h2>{fullData.totalBookings || ""}</h2>
          </div>
          <div className="reportsCard">
            <p>Total Revenue</p>
            <h2>{fullData.totalRevenue || ""}</h2>
          </div>
        </div>
      </div>

      {/* Booking Trends */}
      <div className="reportsTrendsSection">
        <h3>Booking Trends</h3>
        
        

        <div className="reportsChartWrapper">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <XAxis dataKey="month" />
              <YAxis hide />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 4, fill: "#059669" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GymReport