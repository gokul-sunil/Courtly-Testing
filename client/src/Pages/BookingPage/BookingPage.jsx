import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import baseUrl from "../../baseUrl";
import styles from "./BookingManagement.module.css";

const BookingManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingHistory, setBookingHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [itemsPerPage] = useState(10);
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState("");



  // const handleView = (memberName) => {
  //   alert(`View details for ${memberName}`);
  // };

  const fetchBookingHistory = useCallback(
    async (page = 1, search = "") => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: itemsPerPage,
        };

        if (search.trim()) params.search = search;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (selectedCourt) params.courtId = selectedCourt;

        const res = await axios.get(`${baseUrl}/api/v1/bookings/full-booking`, {
          params,
        });

        setBookingHistory(res.data.bookings || []);
        setTotalPages(
          res.data.totalPages || Math.ceil(res.data.total / itemsPerPage)
        );
        setTotalRecords(res.data.total || res.data.bookings?.length || 0);
      } catch (error) {
        console.log(error);
        setBookingHistory([]);
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage, startDate, endDate, selectedCourt] // ✅ dependencies
  );

  // ✅ Fetch courts for dropdown
  const getAllCourt = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/v1/Court/fetchCourts`);
      if (res.status === 200) {
        setCourts(res.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  // Search handler
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Date filter handlers
  const handleDateChange = (e) => {
    setStartDate(e.target.value);
    setCurrentPage(1);
  };
  const handleEndDate = (e) => {
    setEndDate(e.target.value);
    setCurrentPage(1);
  };

  // Pagination numbers
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // ✅ Effects
  useEffect(() => {
    getAllCourt();
  }, []);

  // Load data initially & when selectedCourt changes
  useEffect(() => {
    fetchBookingHistory(1, searchTerm);
    setCurrentPage(1);
  }, [selectedCourt, fetchBookingHistory, searchTerm]);

  useEffect(() => {
    fetchBookingHistory(currentPage, searchTerm);
    // Set interval to fetch every 2 minutes (120000 ms)
    const intervalId = setInterval(() => {
      fetchBookingHistory(currentPage, searchTerm);
    }, 120000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [currentPage, fetchBookingHistory, searchTerm]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchBookingHistory(1, searchTerm);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, fetchBookingHistory]);

  useEffect(() => {
    fetchBookingHistory(1, searchTerm);
  }, [startDate, endDate, fetchBookingHistory, searchTerm]);

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search members"
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.dateFilterWrapper}>
          <input
            type="date"
            value={startDate}
            onChange={handleDateChange}
            className={styles.formInput}
          />
          <span style={{ margin: "0 10px" }}>To</span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDate}
            className={styles.formInput}
          />

          {/* Court Dropdown */}
          <select
            style={{ padding: "8px", borderRadius: "8px", marginLeft: "10px", border: "none" }}
            value={selectedCourt}
            onChange={(e) => setSelectedCourt(e.target.value)}
          >
            <option value="">All Courts</option>
            {courts.map((court) => (
              <option key={court._id} value={court._id}>
                {court.courtName || ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>Loading...</div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Phone Number</th>
              <th className={styles.th}>WhatsApp Number</th>
              <th className={styles.th}>Booking Date</th>
              <th className={styles.th}>Ended Date</th>
              <th className={styles.th}>Booking Slots</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Court</th>
            </tr>
          </thead>
          <tbody>
            {bookingHistory.length === 0 && !loading ? (
              <tr>
                <td colSpan="9" className={styles.noData}>
                  No bookings found
                </td>
              </tr>
            ) : (
              bookingHistory.map((member, index) => (
                <tr key={member._id || index} className={styles.bodyRow}>
                  <td className={styles.td}>{member.user?.firstName}</td>
                  <td className={styles.td}>{member.user?.phoneNumber}</td>
                  <td className={styles.td}>{member.user?.whatsAppNumber}</td>
                  <td className={styles.td}>{member.startDate}</td>
                  <td className={styles.td}>{member.endDate}</td>
                  <td className={styles.td}>
                    {member.startTime}-{member.endTime}
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.status} ${member.status === "expired"
                          ? styles.statusExpired
                          : styles.statusActive
                        }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className={styles.td}>{member.court?.courtName}</td>
                  {/* <td className={styles.td}>
                    <div className={styles.actionButtons}> */}
                  {/* <button
                        className={`${styles.actionButton} ${styles.whatsappButton}`}
                        onClick={() => handleWhatsApp(member.user?.whatsAppNumber,"this is a renew message")}
                      >
                        <MessageCircle size={16} />
                      </button> */}
                  {/* <button
                        className={styles.actionButton}
                        onClick={() => handleView(member.user?.firstName)}
                      >
                        <Eye size={16} />
                      </button> */}
                  {/* {member.status === "expired" && (
                        <button className={styles.renewButton}>Renew</button>
                      )} */}
                  {/* </div>
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalRecords)} of{" "}
            {totalRecords} entries
          </div>
          <div className={styles.paginationControls}>
            <button
              className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ""
                }`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <div className={styles.pageNumbers}>
              {generatePageNumbers().map((page, index) => (
                <button
                  key={index}
                  className={`${styles.pageButton} ${page === currentPage ? styles.activePage : ""
                    } ${page === "..." ? styles.ellipsis : ""}`}
                  onClick={() => page !== "..." && handlePageChange(page)}
                  disabled={page === "..."}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ""
                }`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
