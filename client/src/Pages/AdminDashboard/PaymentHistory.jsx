import React, { useEffect, useState } from "react";
import { MessageCircle, File, Eye, X } from "lucide-react";
import jsPDF from "jspdf";
import styles from "./PaymentHistory.module.css";
import baseUrl from "../../baseUrl";
import axios from "axios";

function PaymentHistory({ selectedCourtNumber }) {
  const [billData, setBillData] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPopup, setShowPopup] = useState(false);



  const handleWhatsApp = (member) => {
    const firstName = member.userId?.firstName || "";
    const lastName = member.userId?.lastName || "";
    const phoneNumber = member.userId?.phoneNumber || "";
    const amount = member.amount || 0;
    const startDate = member.bookingId?.startDate || "";
    const endDate = member.bookingId?.endDate || "";
    const startTime = member.bookingId?.startTime || "";
    const endTime = member.bookingId?.endTime || "";
    const modeOfPayment = member.bookingId?.modeOfPayment || "";

    const message = `Hello ${firstName},

Here are your booking details:
💰 Amount: ₹${amount}
👤 Name: ${firstName} ${lastName}
📞 Phone: ${phoneNumber}
💳 Payment Method: ${modeOfPayment}
📅 Start: ${startDate} at ${startTime}
📅 End: ${endDate} at ${endTime}

Thank you for your booking!`;

    const whatsappNumber = member.userId?.phoneNumber || phoneNumber;
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappURL, "_blank");
  };

  const handleView = (member) => {
    setSelectedMember(member);
    setShowPopup(true);
  };

  const handleDownload = (member) => {
    const firstName = String(member.userId?.firstName || "User");
    const lastName = String(member.userId?.lastName || "");
    const phoneNumber = String(member.userId?.phoneNumber || "N/A");
    const bookingId = String(
      member.bookingId?._id || member.bookingId || "N/A"
    );
    const amount = String(member.amount || 0);
    const startDate = String(member.bookingId?.startDate || "N/A");
    const endDate = String(member.bookingId?.endDate || "N/A");
    const startTime = String(member.bookingId?.startTime || "N/A");
    const endTime = String(member.bookingId?.endTime || "N/A");
    const paymentMethod = String(member.bookingId?.modeOfPayment || "N/A");
    const userId = String(member.userId?._id || "N/A");

    // Create new PDF document
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 123, 255); // Blue color
    doc.text("BOOKING RECEIPT", 105, 25, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102); // Gray color
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 35, {
      align: "center",
    });

    // Draw header line
    doc.setDrawColor(0, 123, 255);
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    let yPosition = 55;

    // Customer Information Section
    doc.setFontSize(14);
    doc.setTextColor(0, 123, 255);
    doc.text("CUSTOMER INFORMATION", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51); // Dark gray

    const customerInfo = [
      ["Full Name:", `${firstName} ${lastName}`.trim()],
      ["Phone Number:", phoneNumber],
      ["Customer ID:", userId],
    ];

    customerInfo.forEach(([label, value]) => {
      doc.text(String(label), 25, yPosition);
      doc.text(String(value), 90, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Booking Details Section
    doc.setFontSize(14);
    doc.setTextColor(0, 123, 255);
    doc.text("BOOKING DETAILS", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);

    const bookingInfo = [
      ["Booking ID:", bookingId],
      ["Start Date:", startDate],
      ["Start Time:", startTime],
      ["End Date:", endDate],
      ["End Time:", endTime],
    ];

    bookingInfo.forEach(([label, value]) => {
      doc.text(String(label), 25, yPosition);
      doc.text(String(value), 90, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Payment Information Section
    doc.setFontSize(14);
    doc.setTextColor(0, 123, 255);
    doc.text("PAYMENT INFORMATION", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);

    doc.text("Payment Method:", 25, yPosition);
    doc.text(String(paymentMethod).toUpperCase(), 90, yPosition);
    yPosition += 10;

    // Amount in a box
    doc.setFillColor(248, 249, 250); // Light gray background
    doc.rect(20, yPosition - 5, 170, 15, "F");
    doc.setDrawColor(0, 123, 255);
    doc.rect(20, yPosition - 5, 170, 15);

    doc.setFontSize(12);
    doc.setTextColor(40, 167, 69); // Green color for amount
    doc.text("Total Amount:", 25, yPosition + 5);
    doc.setFontSize(14);
    doc.text(`₹${amount}`, 160, yPosition + 5, { align: "right" });

    yPosition += 25;

    // Footer
    doc.setDrawColor(0, 123, 255);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text("Thank you for your booking!", 105, yPosition, {
      align: "center",
    });
    doc.text("This is a computer-generated receipt.", 105, yPosition + 7, {
      align: "center",
    });

    // Add page border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 180, 267);

    // Save the PDF
    const fileName = `Booking_Receipt_${firstName}_${lastName}_${Date.now()}.pdf`;
    doc.save(fileName);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedMember(null);
  };

  useEffect(() => {
    const getPaymentHistory = async () => {
      try {
        const res = await axios.get(
          `${baseUrl}/api/v1/billings/court-payment-history/${selectedCourtNumber}`
        );
        console.log(res);
        setBillData(res.data.billings || []);
      } catch (error) {
        console.log(error);
      }
    };
    getPaymentHistory();
  }, [selectedCourtNumber]);

  return (
    <div className={styles.container}>
      {billData && billData.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.headerRow}>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Booking Date</th>
                <th className={styles.th}>Ended Date</th>
                <th className={styles.th}>Payment Method</th>
                <th className={styles.th}>Amount</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {billData.map((member, index) => (
                <tr key={index} className={styles.bodyRow}>
                  <td className={styles.td}>
                    {member.userId?.firstName || ""}{" "}
                    {member.userId?.lastName || ""}
                  </td>
                  <td className={styles.td}>
                    {member.bookingId?.startDate || ""}
                  </td>
                  <td className={styles.td}>
                    {member.bookingId?.endDate || ""}
                  </td>
                  <td className={styles.td}>
                    {member.bookingId?.modeOfPayment || ""}
                  </td>
                  <td className={styles.td}>₹{member.amount || 0}</td>
                  <td className={styles.td}>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.actionButton} ${styles.whatsappButton}`}
                        onClick={() => handleWhatsApp(member)}
                        title="Send WhatsApp message"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleView(member)}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.fileButton}`}
                        onClick={() => handleDownload(member)}
                        title="Download details"
                      >
                        <File size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.noDataContainer}>
           <div className={styles.noBookingsMessage}>
            <div className={styles.noBookingsIcon}>📅</div>
            <h3>No Payment History</h3>
          </div>
        </div>
      )}

      {/* Popup Modal */}
      {showPopup && selectedMember && (
        <div className={styles.modalOverlay} onClick={closePopup}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Booking Details</h2>
              <button className={styles.closeButton} onClick={closePopup}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h3>Customer Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Name:</span>
                    <span className={styles.value}>
                      {selectedMember.userId?.firstName || ""}{" "}
                      {selectedMember.userId?.lastName || ""}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Phone:</span>
                    <span className={styles.value}>
                      {selectedMember.userId?.phoneNumber || ""}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>User ID:</span>
                    <span className={styles.value}>
                      {selectedMember.userId?._id ||
                        selectedMember.userId ||
                        ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Booking Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Booking ID:</span>
                    <span className={styles.value}>
                      {selectedMember.bookingId?._id ||
                        selectedMember.bookingId ||
                        ""}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Start Date:</span>
                    <span className={styles.value}>
                      {selectedMember.bookingId?.startDate || ""}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Start Time:</span>
                    <span className={styles.value}>
                      {selectedMember.bookingId?.startTime || ""}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>End Date:</span>
                    <span className={styles.value}>
                      {selectedMember.bookingId?.endDate || ""}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>End Time:</span>
                    <span className={styles.value}>
                      {selectedMember.bookingId?.endTime || ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Payment Details</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Amount:</span>
                    <span className={styles.value}>
                      ₹{selectedMember.amount || 0}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Payment Method:</span>
                    <span className={styles.value}>
                      {selectedMember.bookingId?.modeOfPayment || ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.downloadBtn}
                onClick={() => handleDownload(selectedMember)}
              >
                <File size={16} />
                Download Details
              </button>
              <button
                className={styles.whatsappBtn}
                onClick={() => handleWhatsApp(selectedMember)}
              >
                <MessageCircle size={16} />
                Send WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;
