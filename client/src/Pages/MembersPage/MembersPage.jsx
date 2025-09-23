import React, { useEffect, useState } from "react";
import {
  Search,
  X,
  MessageCircle,
  Eye,
  Trash2,
  Calendar,
  Clock,
  CreditCard,
  User,
  Phone,
} from "lucide-react";
import styles from "./MembersPage.module.css";
import axios from "axios";
import baseUrl from "../../baseUrl";
import { toast } from "react-toastify";

function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState([]);
  const [showRenewalPopup, setShowRenewalPopup] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState(null);
  const [slot, setSlotid] = useState(null);
  const [deletePopup, setDeletePopup] = useState(false);
  const [renewalData, setRenewalData] = useState({
    courtId: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    amount: "",
    isGst: false,
    gst: "",
    gstNumber: "",
    modeOfPayment: "cash",
  });

  // Fetch members on component mount
  useEffect(() => {
    // Initial fetch
    getMembers();

    // Polling every 2 minutes (120000 ms)
    const intervalId = setInterval(() => {
      getMembers();
    }, 120000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);


  // Fetch all members/bookings
  const getMembers = async () => {
    setLoadingMembers(true);
    setError(null);
    try {
      const res = await axios.get(`${baseUrl}/api/v1/bookings/latest-booking`);
      setMembers(res.data.data || []);
      console.log(res);
    } catch (error) {
      console.error("Error fetching members:", error);
      setError("Failed to load members. Please try again.");
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch courts for the renewal popup
  const fetchCourts = async () => {
    setLoadingCourts(true);
    setError(null);
    try {
      const response = await axios.get(`${baseUrl}/api/v1/Court/fetchCourts`);
      console.log(response);
      setCourts(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching courts:", error);
      setError("Failed to load courts. Please try again.");
    } finally {
      setLoadingCourts(false);
    }
  };

  // Handle input changes in the renewal form
  const handleRenewalInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRenewalData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission for renewal
  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic form validation
    if (
      !renewalData.courtId ||
      !renewalData.startDate ||
      !renewalData.endDate ||
      !renewalData.startTime ||
      !renewalData.endTime ||
      !renewalData.amount ||
      !renewalData.modeOfPayment
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (
      renewalData.isGst &&
      (!renewalData.gst || !renewalData.gstNumber)
    ) {
      setError("GST value and number are required when GST is enabled.");
      return;
    }

    try {
      const renewalPayload = {
        ...renewalData,
        memberId: selectedMember?._id || "",
        userId: selectedMember?.user?._id || "",
      };

      // Remove GST fields if GST is not applicable
      if (!renewalData.isGst) {
        delete renewalPayload.gst;
        delete renewalPayload.gstNumber;
      }

      const response = await axios.post(
        `${baseUrl}/api/v1/slot/renew/${slot}`,
        renewalPayload
      );
      console.log(response);

      toast.success("Renewal successful!");
      setShowRenewalPopup(false);
      getMembers(); // Refresh member list
    } catch (error) {
      console.error("Renewal error:", error);
      setError("Renewal failed. Please try again.");
    }
  };

  // Close renewal popup and reset form
  const closeRenewalPopup = () => {
    setShowRenewalPopup(false);
    setSelectedMember(null);
    setCourts([]);
    setRenewalData({
      courtId: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      amount: "",
      isGst: false,
      gst: "",
      gstNumber: "",
      modeOfPayment: "cash",
    });
    setError(null);
  };

  // Close view popup
  const closeViewPopup = () => {
    setShowViewPopup(false);
    setSelectedMember(null);
  };

  // Handle renew button click
  const handleRenew = async (member) => {
    setSelectedMember(member);
    setSlotid(member.bookingId || "");
    setRenewalData({
      courtId: member.courtId || "",
      startDate: member.startDate || "",
      endDate: member.endDate || "",
      startTime: member.startTime || "",
      endTime: member.endTime || "",
      amount: member.amount || "",
      isGst: member.isGst || false,
      gst: member.gst || "",
      gstNumber: member.gstNumber || "",
      modeOfPayment: member.modeOfPayment || "cash",
    });

    await fetchCourts();
    setShowRenewalPopup(true);
  };

  const handleDelete = (member) => {
    setSelectedMember(member);
    setDeletePopup(true);
  };

  const onDelete = async () => {
    try {
      const res = await axios.delete(
        `${baseUrl}/api/v1/user/delete/${selectedMember._id}`
      );
      if (res.status === 200) {
        toast.success("Member deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      setError("Failed to delete member. Please try again.");
      toast.error("Failed to delete member. Please try again.");
    } finally {
      setDeletePopup(false);
      setSelectedMember(null);
      getMembers();
    }
  };

  const onCancel = () => {
    setDeletePopup(false);
    setSelectedMember(null);
  };

  // Enhanced WhatsApp handler with subscription reminder
  const handleWhatsApp = (member) => {
    const phone = member.whatsAppNumber || member.phoneNumber;
    if (phone) {
      let message = "";

      if (member.status === "expired") {
        // Expired subscription message
        message = `Hello ${member.firstName || "Member"
          },\n\nYour subscription has expired on ${member.endDate || "N/A"
          }.\n\nTo continue enjoying our services, please renew your subscription at your earliest convenience.\n\nCourt: ${member.courtName || "N/A"
          }\nLast booking period: ${member.startDate || "N/A"} to ${member.endDate || "N/A"
          }\n\nFor renewal, please contact us or visit our facility.\n\nThank you!`;
      } else if (member.status === "upcoming") {
        // Active subscription message
        message = `Hello ${member.firstName || "Member"
          },\n\nYour subscription is active until ${member.endDate || "N/A"
          }.\n\nCourt: ${member.courtName || "N/A"}\nBooking period: ${member.startDate || "N/A"
          } to ${member.endDate || "N/A"
          }\n\nEnjoy your sessions! Contact us if you have any questions.\n\nThank you!`;
      } else {
        // General message
        message = `Hello ${member.firstName || "Member"
          },\n\nThank you for being a valued member. If you have any questions or need assistance, please feel free to contact us.\n\nThank you!`;
      }

      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
    } else {
      toast.error("No WhatsApp number available.");
    }
  };

  // Handle view button click
  const handleView = (member) => {
    setSelectedMember(member);
    setShowViewPopup(true);
  };

  console.log(selectedMember);

  // Filter members based on search term
 const filteredMembers = members.filter((member) => {
  const phone = member.phoneNumber?.toString() || "";
  const whatsapp = member.whatsAppNumber?.toString() || "";
  return (
    member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phone.includes(searchTerm) ||
    whatsapp.includes(searchTerm)
  );
});

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format time for display
  // const formatTime = (timeString) => {
  //   if (!timeString) return "N/A";

  //   const [hourStr, minuteStr] = timeString.split(":");
  //   if (!hourStr || !minuteStr) return timeString;

  //   let hour = parseInt(hourStr, 10);
  //   const minute = parseInt(minuteStr, 10);
  //   const ampm = hour >= 12 ? "PM" : "AM";
  //   hour = hour % 12 || 12;

  //   return `${hour.toString().padStart(2, "0")}:${minute
  //     .toString()
  //     .padStart(2, "0")} ${ampm}`;
  // };

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search members by name or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            aria-label="Search members"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Members Table */}
      <div className={styles.tableWrapper}>
        {loadingMembers ? (
          <div>Loading members...</div>
        ) : filteredMembers.length === 0 ? (
          <div>No members found.</div>
        ) : (
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
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => (
                <tr key={member._id || index} className={styles.bodyRow}>
                  <td className={styles.td}>
                    {member.firstName || "N/A"} {member.lastName}
                  </td>
                  <td className={styles.td}>{member.phoneNumber || "N/A"}</td>
                  <td className={styles.td}>
                    {member.whatsAppNumber || "N/A"}
                  </td>
                  <td className={styles.td}>{member.startDate || "N/A"}</td>
                  <td className={styles.td}>{member.endDate || "N/A"}</td>
                  <td className={styles.td}>{member.courtName || "N/A"}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.status} ${member.status === "expired"
                          ? styles.statusExpired
                          : styles.statusActive
                        }`}
                    >
                      {member.status || "N/A"}
                    </span>
                  </td>
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
                        title="View member details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDelete(member)}
                        title="Delete member"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Member Details View Popup */}
      {showViewPopup && selectedMember && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.viewModalContent}`}>
            <div className={styles.modalHeader}>
              <h2>
                <User size={20} style={{ marginRight: "8px" }} />
                Member Details
              </h2>
              <button
                className={styles.closeButton}
                onClick={closeViewPopup}
                aria-label="Close view popup"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.memberDetailsContent}>
              {/* Personal Information */}
              <div className={styles.detailsSection}>
                <h3>Personal Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Name:</span>
                    <span className={styles.detailValue}>
                      {selectedMember.firstName || "N/A"}{" "}
                      {selectedMember.lastName}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Phone Number:</span>
                    <span className={styles.detailValue}>
                      <Phone size={14} style={{ marginRight: "4px" }} />
                      {selectedMember.phoneNumber || "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>WhatsApp Number:</span>
                    <span className={styles.detailValue}>
                      <MessageCircle size={14} style={{ marginRight: "4px" }} />
                      {selectedMember.whatsAppNumber || "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Member ID:</span>
                    <span className={styles.detailValue}>
                      {selectedMember._id || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className={styles.detailsSection}>
                <h3>Booking Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Court Name:</span>
                    <span className={styles.detailValue}>
                      {selectedMember.courtName || "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Start Date:</span>
                    <span className={styles.detailValue}>
                      <Calendar size={14} style={{ marginRight: "4px" }} />
                      {formatDate(selectedMember.startDate)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>End Date:</span>
                    <span className={styles.detailValue}>
                      <Calendar size={14} style={{ marginRight: "4px" }} />
                      {formatDate(selectedMember.endDate)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Start Time:</span>
                    <span className={styles.detailValue}>
                      <Clock size={14} style={{ marginRight: "4px" }} />
                      {(selectedMember.startTime)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>End Time:</span>
                    <span className={styles.detailValue}>
                      <Clock size={14} style={{ marginRight: "4px" }} />
                      {(selectedMember.endTime)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      Subscription Status:
                    </span>
                    <span
                      className={`${styles.detailValue} ${styles.statusBadge} ${selectedMember.status === "upcoming"
                          ? styles.statusActive
                          : styles.statusExpired
                        }`}
                    >
                      {selectedMember.status || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className={styles.detailsSection}>
                <h3>Payment Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Amount:</span>
                    <span className={styles.detailValue}>
                      <CreditCard size={14} style={{ marginRight: "4px" }} />₹
                      {selectedMember.amount || "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Payment Mode:</span>
                    <span className={styles.detailValue}>
                      {selectedMember.modeOfPayment || "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>GST Applied:</span>
                    <span className={styles.detailValue}>
                      {selectedMember.isGst ? "Yes" : "No"}
                    </span>
                  </div>
                  {selectedMember.isGst && (
                    <>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>GST Value:</span>
                        <span className={styles.detailValue}>
                          {selectedMember.gst || "N/A"}%
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>GST Number:</span>
                        <span className={styles.detailValue}>
                          {selectedMember.gstNumber || "N/A"}
                        </span>
                      </div>
                    </>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Booking ID:</span>
                    <span className={styles.detailValue}>
                      {selectedMember.bookingId || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={`${styles.actionButton} ${styles.whatsappButton}`}
                onClick={() => handleWhatsApp(selectedMember)}
                style={{ marginRight: "10px" }}
              >
                <MessageCircle size={16} style={{ marginRight: "5px" }} />
                Send WhatsApp
              </button>
              {/* <button
                type="button"
                onClick={closeViewPopup}
                className={styles.cancelButton}
              >
                Close
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* Renewal Popup */}
      {showRenewalPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>
                Renew Booking for{" "}
                {selectedMember?.firstName + selectedMember?.lastName ||
                  "Member"}
              </h2>
              <button
                className={styles.closeButton}
                onClick={closeRenewalPopup}
                aria-label="Close renewal popup"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRenewalSubmit} className={styles.renewalForm}>
              <div className={styles.formGrid}>
                {/* Court Dropdown */}
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

                {/* Start Date */}
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

                {/* End Date */}
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

                {/* Start Time */}
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

                {/* End Time */}
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

                {/* Amount */}
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

                {/* GST Dropdown */}
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

                {/* GST Value */}
                {renewalData.isGst && (
                  <div className={styles.formGroup}>
                    <label htmlFor="gst">GST Value (%)</label>
                    <input
                      type="number"
                      id="gst"
                      name="gst"
                      value={renewalData.gst}
                      onChange={handleRenewalInputChange}
                      className={styles.formInput}
                      min="0"
                      max="100"
                      step="0.01"
                      required
                    />
                  </div>
                )}

                {/* GST Number */}
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

                {/* Mode of Payment */}
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
                    {/* <option value="card">Card</option> */}
                    <option value="upi">UPI</option>
                  </select>
                </div>
              </div>

              {/* Form Error Message */}
              {error && <div className={styles.errorMessage}>{error}</div>}

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
      )}

      {/* Delete Confirmation Popup */}
      {deletePopup && (
        <div className={styles.overlay || styles.modalOverlay}>
          <div className={styles.popup || styles.modalContent}>
            <h3>Are you sure?</h3>
            <p>
              This action cannot be undone. Do you want to delete{" "}
              {selectedMember?.firstName}?
            </p>
            <div className={styles.actions || styles.modalActions}>
              <button
                onClick={onCancel}
                className={styles.cancelBtn || styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className={styles.deleteBtn || styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembersPage;
