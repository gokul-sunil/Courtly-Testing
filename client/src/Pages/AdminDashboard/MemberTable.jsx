import React, { useCallback, useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./MemberTable.module.css";
import axios from "axios";
import baseUrl from "../../baseUrl";

const MemberTable = (selectedCourtNumber) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingHistory, setBookingHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [itemsPerPage] = useState(10);
  // const [slot, setSlotid] = useState(null);

  // Renewal popup state
  // const [showRenewalPopup, setShowRenewalPopup] = useState(false);
  // const [selectedMember, setSelectedMember] = useState(null);
  // const [courts, setCourts] = useState([]);
  // const [loadingCourts, setLoadingCourts] = useState(false);
  // const [renewalData, setRenewalData] = useState({
  //   courtId: "",
  //   startDate: "",
  //   endDate: "",
  //   startTime: "",
  //   endTime: "",
  //   amount: "",
  //   isGst: false,
  //   gst: 0,
  //   gstValue: "",
  //   gstNumber: "",
  //   modeOfPayment: "cash",
  // });

  // const handleDelete = (memberName) => {
  //   alert(`Delete ${memberName}`);
  // };

  // const handleWhatsApp = (memberName) => {
  //   alert(`Open WhatsApp for ${memberName}`);
  // };

  // const handleView = (memberName) => {
  //   alert(`View details for ${memberName}`);
  // };

  // Fetch courts list
  // const fetchCourts = async () => {
  //   setLoadingCourts(true);
  //   try {
  //     const response = await axios.get(`${baseUrl}/api/v1/Court/fetchCourts`); // Adjust API endpoint as needed
  //     setCourts(response.data.data || response.data || []);
  //   } catch (error) {
  //     console.error("Error fetching courts:", error);
  //     setCourts([]);
  //   } finally {
  //     setLoadingCourts(false);
  //   }
  // };

  // Handle renewal button click
  // const handleRenew = async (member) => {
  //   setSelectedMember(member);
  //   setSlotid(member._id || "");
  //   // Bind previous booking data to form
  //   setRenewalData({
  //     courtId: member.courtId || selectedCourtNumber.selectedCourtNumber || "",
  //     startDate: member.startDate || "",
  //     endDate: member.endDate || "",
  //     startTime: member.startTime || "",
  //     endTime: member.endTime || "",
  //     amount: member.amount || "",
  //     isGst: member.isGst || false,
  //     gst: member.gstValue || 0,
  //     gstNumber: member.gstNumber || "",
  //     modeOfPayment: member.modeOfPayment || "cash",
  //   });

  //   // Fetch courts when opening popup
  //   await fetchCourts();
  //   setShowRenewalPopup(true);
  // };

  // Handle renewal form input changes
  // const handleRenewalInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setRenewalData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  // Handle renewal form submission
  // const handleRenewalSubmit = async (e) => {
  //   e.preventDefault();

  //   try {
  //     const renewalPayload = {
  //       ...renewalData,
  //       memberId: selectedMember._id,
  //       userId: selectedMember.user._id,
  //     };

  //     if (renewalData.isGst === false) {
  //       delete renewalPayload.gstValue;
  //       delete renewalPayload.gstNumber;
  //     }

  //     console.log("Renewal payload:", renewalPayload);

  //     const response = await axios.post(
  //       `${baseUrl}/api/v1/slot/renew/${slot}`,
  //       renewalPayload
  //     );
  //     console.log(response, "Renewal response");

  //     alert("Renewal successful!");
  //     setShowRenewalPopup(false);

  //     fetchBookingHistory(currentPage, searchTerm);
  //   } catch (error) {
  //     console.error("Renewal error:", error);
  //     alert("Renewal failed. Please try again.");
  //   }
  // };

  // Close renewal popup
  // const closeRenewalPopup = () => {
  //   setShowRenewalPopup(false);
  //   setSelectedMember(null);
  //   setCourts([]);
  //   setRenewalData({
  //     courtId: "",
  //     startDate: "",
  //     endDate: "",
  //     startTime: "",
  //     endTime: "",
  //     amount: "",
  //     isGst: false,
  //     gst: "no",
  //     gstValue: "",
  //     gstNumber: "",
  //     modeOfPayment: "cash",
  //   });
  // };



  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    setStartDate(value);
    setCurrentPage(1);
  };

  const handleEndDate = (e) => {
    const value = e.target.value;
    setEndDate(value);
    setCurrentPage(1);
  };
  const fetchBookingHistory = useCallback(
    async (page = 1, search = "") => {
      setLoading(true);
      try {
        const params = {
          courtId: selectedCourtNumber.selectedCourtNumber,
          page,
          limit: itemsPerPage,
        };

        if (search.trim().length >= 3) {
          params.search = search.trim();
        }

        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const res = await axios.get(`${baseUrl}/api/v1/bookings/full-booking`, {
          params,
        });

        setBookingHistory(res.data.bookings);
        setTotalPages(
          res.data.totalPages || Math.ceil(res.data.total / itemsPerPage)
        );
        setTotalRecords(res.data.total || res.data.bookings.length);
      } catch (error) {
        console.error(error);
        setBookingHistory([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedCourtNumber, startDate, endDate, itemsPerPage] // ✅ dependencies
  );

  useEffect(() => {

    setCurrentPage(1);
    const fetchBookingHistory = async (page = 1, search) => {
      setLoading(true);
      try {
        const params = {
          courtId: selectedCourtNumber.selectedCourtNumber,
          page: page,
          limit: itemsPerPage,
        };
        if (search && search.trim().length >= 2) {
          params.search = search.trim();
        }

        if (startDate) {
          params.startDate = startDate;
        }
        if (endDate) {
          params.endDate = endDate;
        }

        const res = await axios.get(`${baseUrl}/api/v1/bookings/full-booking`, {
          params: params,
        });

        setBookingHistory(res.data.bookings);
        setTotalPages(
          res.data.totalPages || Math.ceil(res.data.total / itemsPerPage)
        );
        setTotalRecords(res.data.total || res.data.bookings.length);
      } catch (error) {
        console.log(error);
        setBookingHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingHistory(1, searchTerm);

  }, [searchTerm, endDate, startDate, selectedCourtNumber, itemsPerPage]);


  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (selectedCourtNumber) {
        fetchBookingHistory(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, fetchBookingHistory, selectedCourtNumber]);

  useEffect(() => {
    if (selectedCourtNumber) {
      fetchBookingHistory(1, searchTerm, startDate, endDate);
    }
  }, [startDate, endDate, fetchBookingHistory, searchTerm, selectedCourtNumber]);

  useEffect(() => {
    if (selectedCourtNumber) {
      fetchBookingHistory(currentPage, searchTerm);
    }

    const intervalId = setInterval(() => {
      fetchBookingHistory(currentPage, searchTerm);
    }, 120000); // 2 minutes in milliseconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [currentPage, fetchBookingHistory, searchTerm, selectedCourtNumber]);

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={styles.container}>
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
            placeholder="Filter by date"
          />
          <span style={{ marginLeft: "10px", marginRight: "10px" }}>To</span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDate}
            className={styles.formInput}
            placeholder="Filter by date"
          />
        </div>
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>Loading...</div>
        </div>
      )}

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
              <th className={styles.th}>Subscription</th>
              {/* <th className={styles.th}>Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {bookingHistory.length === 0 && !loading ? (
              <tr>
                <td colSpan="8" className={styles.noData}>
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
                  <td
                    className={styles.td}
                  >{`${member.startTime}-${member.endTime}`}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.status} ${member.status === "upcoming"
                        ? styles.statusActive
                        : styles.statusExpired
                        }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  {/* <td className={styles.td}>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.actionButton} ${styles.whatsappButton}`}
                        onClick={() => handleWhatsApp(member.userId?.firstName)}
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleView(member.userId?.firstName)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDelete(member.userId?.firstName)}
                      >
                        <Trash2 size={16} />
                      </button>
                      {member.status === "expired" && (
                        <button
                          className={styles.renewButton}
                          onClick={() => handleRenew(member)}
                        >
                          Renew
                        </button>
                      )}
                    </div>
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
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
              <ChevronLeft size={16} />
              Previous
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
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Renewal Popup Modal */}
      {/* {showRenewalPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Renew Booking</h2>
              <button
                className={styles.closeButton}
                onClick={closeRenewalPopup}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRenewalSubmit} className={styles.renewalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="courtId">Select Court</label>
                  <select
                    id="courtId"
                    name="courtId"
                    value={renewalData.courtId}
                    onChange={handleRenewalInputChange}
                    className={styles.formInput}
                    required
                    disabled={loadingCourts}
                  >
                    <option value="">
                      {loadingCourts ? "Loading courts..." : "Select a court"}
                    </option>
                    {courts.map((court) => (
                      <option
                        key={court._id || court.id}
                        value={court._id || court.id}
                      >
                        {court.name ||
                          court.courtName ||
                          `Court ${court.courtNumber}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={renewalData.startDate}
                    onChange={handleRenewalInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={renewalData.endDate}
                    onChange={handleRenewalInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={renewalData.startTime}
                    onChange={handleRenewalInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="endTime">End Time</label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={renewalData.endTime}
                    onChange={handleRenewalInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="amount">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={renewalData.amount}
                    onChange={handleRenewalInputChange}
                    className={styles.formInput}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="gst">GST</label>
                  <select
                    id="gst"
                    name="isGst"
                    value={renewalData.isGst ? "yes" : "no"}
                    onChange={(e) =>
                      setRenewalData((prev) => ({
                        ...prev,
                        isGst: e.target.value === "yes",
                      }))
                    }
                    className={styles.formInput}
                    required
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                {renewalData.isGst && (
                  <div className={styles.formGroup}>
                    <label htmlFor="gstValue">GST Value (%)</label>
                    <input
                      type="number"
                      id="gstValue"
                      name="gstValue"
                      value={renewalData.gstValue}
                      onChange={handleRenewalInputChange}
                      className={styles.formInput}
                      min="0"
                      max="100"
                      step="0.01"
                      required
                    />
                  </div>
                )}

                {renewalData.isGst && (
                  <div className={styles.formGroup}>
                    <label htmlFor="gstNumber">GST Number</label>
                    <input
                      type="text"
                      id="gstNumber"
                      name="gstNumber"
                      value={renewalData.gstNumber}
                      onChange={handleRenewalInputChange}
                      className={styles.formInput}
                      required
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="modeOfPayment">Mode of Payment</label>
                  <select
                    id="modeOfPayment"
                    name="modeOfPayment"
                    value={renewalData.modeOfPayment}
                    onChange={handleRenewalInputChange}
                    className={styles.formInput}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeRenewalPopup}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.renewSubmitButton}>
                  Renew Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default MemberTable;
