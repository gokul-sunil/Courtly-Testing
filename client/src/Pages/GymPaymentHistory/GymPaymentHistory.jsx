import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Search, MessageCircle, File, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./GymPaymentHistory.module.css";
import baseUrl from "../../baseUrl";
import axios from "axios";
import { Modal } from "antd"
import jsPDF from "jspdf";
import "jspdf-autotable";

function GymPaymentHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [billData, setBillData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState("");
  const [courts, setCourts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);


  // Debounce function for search
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const getAllCourt = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/v1/Court/fetchCourts`);
      if (res.status === 200) {
        setCourts(res.data.data);
      }
    } catch (error) {
      console.log("Error fetching courts:", error);
    }
  };

  // 1. Make getPaymentHistory stable
  const getPaymentHistory = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedCourt) params.append("courtId", selectedCourt);

      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      const url = `${baseUrl}/api/v1/gym/payment-history${params.toString() ? `?${params.toString()}` : ""
        }`;

      const res = await axios.get(url);
      console.log(res);

      if (res.status === 200) {
        setBillData(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalRecords(res.data.totalRecords || 0);
      }
    } catch (error) {
      console.log("Error fetching payment history:", error);
      setBillData([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, startDate, endDate, selectedCourt, currentPage, itemsPerPage]);

  // 2. Memoize the debounced function
  const debouncedGetPaymentHistory = useMemo(
    () => debounce(getPaymentHistory, 500),
    [getPaymentHistory]
  );

  // 3. Call inside useEffect
  useEffect(() => {
    debouncedGetPaymentHistory();

    return () => {
      debouncedGetPaymentHistory.cancel?.();
    };
  }, [debouncedGetPaymentHistory]);


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDateChange = (e) => {
    setStartDate(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleEndDate = (e) => {
    setEndDate(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleCourtChange = (e) => {
    setSelectedCourt(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };



  // Action handlers
  // const handleDelete = (memberId) => {
  //   alert(`Delete member with ID: ${memberId}`);
  // };

  // const handleWhatsApp = (memberName) => {
  //   alert(`Open WhatsApp for ${memberName}`);
  // };

  const handleView = (member) => {
    setSelectedMember(member);
    setIsViewModalOpen(true);
  };

  // Load courts on component mount
  useEffect(() => {
    getAllCourt();
  }, []);

  // Fetch payment history when filters change
  useEffect(() => {
    debouncedGetPaymentHistory();

    return () => {
      debouncedGetPaymentHistory.cancel?.();
    };
  }, [debouncedGetPaymentHistory]);


  const handleDownload = (member) => {
    const doc = new jsPDF();

    // Extract details
    const fullName =
      member.userId?.name?.charAt(0).toUpperCase() +
      member.userId?.name?.slice(1).toLowerCase() || "";
    const phoneNumber = member.userId?.phoneNumber || "";
    const whatsAppNumber = member.userId?.whatsAppNumber || "";
    const subscriptionMonths = member.subscriptionMonths || "";
    const paymentMethod = member.modeOfPayment
      ? member.modeOfPayment.charAt(0).toUpperCase() +
      member.modeOfPayment.slice(1).toLowerCase()
      : "";
    const amount = member.amount || 0;
    const gst = member.gst || 0;
    const isGst = member.isGst || false;
    const paymentDate = member.createdAt
      ? new Date(member.createdAt).toLocaleDateString("en-IN")
      : "";

    // Currency formatter (₹ symbol with commas)
    const formatCurrency = (num) => {
      return `INR ${Number(num).toLocaleString("en-IN")}`;
    };

    const totalAmount = isGst ? amount + gst : amount;

    // ====== PDF Styles ======
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = 40;
    const lineHeight = 10;

    // Title
    doc.setFontSize(16);
    doc.setTextColor("#007bff");
    doc.setFont("helvetica", "bold");
    doc.text("Gym Payment Bill", pageWidth / 2, 20, { align: "center" });

    // Separator line
    doc.setDrawColor("#007bff");
    doc.setLineWidth(0.5);
    doc.line(20, 25, pageWidth - 20, 25);

    // Detail box background
    doc.setFillColor("#f8f9fa");
    doc.roundedRect(
      15,
      startY - 5,
      pageWidth - 30,
      lineHeight * (isGst ? 9 : 7) + 10,
      6,
      6,
      "F"
    );

    // Function to draw label and value with spacing
    const drawItem = (
      label,
      value,
      y,
      labelColor = "#666",
      valueColor = "#333",
      boldValue = false
    ) => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(labelColor);
      doc.text(`${label}:`, 20, y);

      doc.setFont("helvetica", boldValue ? "bold" : "normal");
      doc.setTextColor(valueColor);
      doc.text(`${value}`, 85, y); // shifted for alignment
    };

    // Add details
    drawItem("Name", fullName, startY);
    drawItem("Phone", phoneNumber, startY + lineHeight);
    drawItem("WhatsApp", whatsAppNumber, startY + lineHeight * 2);
    drawItem("Subscription Months", subscriptionMonths, startY + lineHeight * 3);
    drawItem("Payment Method", paymentMethod, startY + lineHeight * 4);
    drawItem("Base Amount", formatCurrency(amount), startY + lineHeight * 5);

    if (isGst) {
      drawItem("GST", formatCurrency(gst), startY + lineHeight * 6);
      drawItem("Total Paid", formatCurrency(totalAmount), startY + lineHeight * 7, "#007bff", "#007bff", true);
      drawItem("Payment Date", paymentDate, startY + lineHeight * 8);
    } else {
      drawItem("Total Paid", formatCurrency(totalAmount), startY + lineHeight * 6, "#007bff", "#007bff", true);
      drawItem("Payment Date", paymentDate, startY + lineHeight * 7);
    }

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor("#999");
    doc.text(
      "Thank you for your payment!",
      pageWidth / 2,
      startY + lineHeight * (isGst ? 10 : 9),
      { align: "center" }
    );

    // Save PDF
    doc.save(`${fullName.replace(" ", "_")}_Gym_Bill.pdf`);
  };








  // helper (put near top of file or in utils)
  const normalizeWhatsApp = (raw) => {
    if (raw === undefined || raw === null) return null;

    // If it's an object like { number: '...' } try to get the number field
    if (typeof raw === "object") {
      if (raw.number) raw = raw.number;
      else return null;
    }

    // convert to string and strip non-digits
    const digits = String(raw).trim().replace(/\D/g, "");

    if (!digits) return null;

    // If number looks local (10 digits) assume India (91) — change as needed
    if (digits.length === 10) return "91" + digits;

    // otherwise return as-is (already contains country code)
    return digits;
  };

  // open whatsapp with optional pre-filled message
  const openWhatsApp = (rawNumber, name = "") => {
    const phone = normalizeWhatsApp(rawNumber);
    if (!phone) {
      alert("No valid WhatsApp number provided.");
      return;
    }

    const message = `Hi ${name || "there"}, I wanted to check in about your membership.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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
            placeholder="Start Date"
          />
          <span style={{ margin: "0 10px" }}>To</span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDate}
            className={styles.formInput}
            placeholder="End Date"
          />

          {/* Court Dropdown */}
          <select
            style={{
              padding: "8px",
              borderRadius: "8px",
              marginLeft: "10px",
              border: "none",
            }}
            value={selectedCourt}
            onChange={handleCourtChange}
          >
            <option value="">All Courts</option>
            {courts.map((court) => (
              <option key={court._id} value={court._id}>
                {court.courtName || ""}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}

        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          Loading...
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Booking Date</th>
              <th className={styles.th}>Subscription</th>
              <th className={styles.th}>Payment Method</th>
              <th className={styles.th}>Amount</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {billData?.length > 0 ? (
              billData.map((member, index) => (
                <tr key={member._id || index} className={styles.bodyRow}>
                  <td className={styles.td}>
                    {member.userId?.name || ""} {member.userId?.lastName || ""}
                  </td>
                  <td className={styles.td}>
                    {member.createdAt ?
                      new Date(member.createdAt).toLocaleDateString() :
                      ""
                    }
                  </td>
                  <td className={styles.td}>
                    {member.subscriptionMonths}
                  </td>
                  <td className={styles.td}>{member.modeOfPayment || ""}</td>

                  <td className={styles.td}>{member.amount}</td>
                  <td className={styles.td}>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.actionButton} ${styles.whatsappButton}`}
                        onClick={() => openWhatsApp(member.userId.whatsAppNumber, member.userId?.name)}
                        title="WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleView(member)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDownload(member)}
                        title="Download Bill"
                      >
                        <File size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  {loading ? "Loading..." : "No records found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      {isViewModalOpen && selectedMember && (
        <Modal
          title="Payment Details"
          open={isViewModalOpen}
          onCancel={() => setIsViewModalOpen(false)}
          footer={null}
          centered
          width={500}
        >
          <div className="flex flex-col gap-2">
            <p><strong>Name:</strong> {selectedMember.userId?.name.charAt(0).toUpperCase() + selectedMember.userId?.name.slice(1).toLowerCase() || ""}</p>
            <p><strong>Phone:</strong> {selectedMember.userId?.phoneNumber || ""}</p>
            <p><strong>WhatsApp:</strong> {selectedMember.userId?.whatsAppNumber || ""}</p>
            <p><strong>Subscription Months:</strong> {selectedMember.subscriptionMonths || ""}</p>
            <p><strong>Payment Method:</strong> {selectedMember.modeOfPayment.charAt(0).toUpperCase() + selectedMember.modeOfPayment.slice(1).toLowerCase() || ""}</p>
            <p><strong>Amount Paid:</strong> ₹{selectedMember.amount || ""}</p>
            <p><strong>Payment Date:</strong> {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : ""}</p>
          </div>
        </Modal>
      )}


    </div>
  );
}

export default GymPaymentHistory