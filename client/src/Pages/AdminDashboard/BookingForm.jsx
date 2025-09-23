import React, { useState } from "react";
import styles from "./AdminDashboard.module.css";
import Tabs from "./Tabs";
import MemberTable from "./MemberTable";
import PaymentHistory from "./PaymentHistory";
import baseUrl from "../../baseUrl";
import axios from "axios";
import BookingOverView from "./BookingOverview";
import { toast } from "react-toastify";
const BookingForm = ({ selectedCourt, onBack, selectedCourtNumber }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    whatsAppNumber: "",
    address: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    amount: 0,
    isGst: false,
    gst: 0,
    gstNumber: "",
    modeOfPayment: "cash",
    courtId: selectedCourtNumber,
  });

  const tabs = [
    { id: "members", label: "Members" },
    { id: "details", label: "Book Now" },
    { id: "booking-overview", label: "Booking Overview" },
    { id: "payment-history", label: "Payment History" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "isGst" ? value === "yes" : value,
    }));
  };
  const validateForm = () => {
    const newErrors = {};

    // Names
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    // Phone numbers (basic length check for India)
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Enter a valid 10-digit phone number";
    }

    if (!formData.whatsAppNumber) {
      newErrors.whatsAppNumber = "WhatsApp number is required";
    } else if (!/^\d{10}$/.test(formData.whatsAppNumber)) {
      newErrors.whatsAppNumber = "Enter a valid 10-digit WhatsApp number";
    }

    // Address
    if (!formData.address.trim()) newErrors.address = "Address is required";

    // Booking details
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (!formData.endTime) newErrors.endTime = "End time is required";

    // Billing
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = "Enter a valid amount";
    }

    if (formData.isGst) {
      if (!formData.gst || Number(formData.gst) <= 0) {
        newErrors.gst = "GST amount is required";
      }
      if (!formData.gstNumber.trim()) {
        newErrors.gstNumber = "GST number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // ✅ true if no errors
  };

  const handleSubmit = async () => {
  console.log(formData);

  try {
    if (validateForm()) {
      // convert phone numbers to Number
      const payload = {
        ...formData,
        phoneNumber: Number(formData.phoneNumber),
        whatsAppNumber: Number(formData.whatsAppNumber),
      };

      const res = await axios.post(`${baseUrl}/api/v1/slot/book`, payload);
      console.log(res);
      console.log("Form submitted successfully", payload);

      if (res.status === 201) {
        toast.success("Booking Successful");
      }

      setFormData({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        whatsAppNumber: "",
        address: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        amount: 0,
        isGst: false,
        gst: 0,
        gstNumber: "",
        modeOfPayment: "cash",
        courtId: selectedCourtNumber,
      });
    } else {
      console.log("Validation failed");
    }
  } catch (error) {
    console.log(error);
    setFormData({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      whatsAppNumber: "",
      address: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      amount: 0,
      isGst: false,
      gst: 0,
      gstNumber: "",
      modeOfPayment: "cash",
      courtId: selectedCourtNumber,
    });
    toast.error(
      "Booking Failed. Please try again. " +
        (error?.response?.data?.message || error.message)
    );
  }
};


  return (
    <div className={styles.bookingContainer}>
      <div className={styles.bookingForm}>
        <div className={styles.formHeader}>
          <div className={styles.headerLeft}>
            <button onClick={onBack} className={styles.backButton}>
              ← Back
            </button>
            <h1 className={styles.formTitle}>Details - {selectedCourt}</h1>
          </div>
          {/* <button onClick={handleSubmit} className={styles.updateButton}>
            Update
          </button> */}
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "details" && (
          <div className={styles.formContent}>
            <div className={styles.detailsHeader}>
              <h2>Details</h2>
            </div>

            <div className={styles.formGrid}>
              {/* Name Inputs */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>User Member Name</label>
                <div className={styles.nameInputs}>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={styles.formInput}
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.nameInputs}>
                  <div className="">
                    {errors.firstName && (
                      <span id="firstNameError" className={styles.errorMessage}>
                        {errors.firstName}
                      </span>
                    )}
                  </div>

                  <div className="">
                    {errors.lastName && (
                      <span id="lastNameError" className={styles.errorMessage}>
                        {errors.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className={styles.nameInputs}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Enter Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Eg:9847634XXX"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    className={styles.formInput}
                  />
                  {errors.phoneNumber && (
                    <span id="phoneNumberError" className={styles.errorMessage}>
                      {errors.phoneNumber}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Enter WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Eg:9847634XXX"
                    value={formData.whatsAppNumber}
                    onChange={(e) =>
                      handleInputChange("whatsAppNumber", e.target.value)
                    }
                    className={styles.formInput}
                  />
                  {errors.whatsAppNumber && (
                    <span
                      id="whatsAppNumberError"
                      className={styles.errorMessage}
                    >
                      {errors.whatsAppNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Enter Address</label>
                <textarea
                  placeholder="Home / Office"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={3}
                  className={styles.textareaInput}
                />
                {errors.address && (
                  <span id="addressError" className={styles.errorMessage}>
                    {errors.address}
                  </span>
                )}
              </div>

              {/* Booking Details */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Enter Booking Details
                </label>
                <div className={styles.bookingInputs}>
                  <div className="">
                    <label
                      className={styles.formLabel}
                      style={{ marginRight: "10px" }}
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className={styles.formInput}
                      placeholder="Start Date"
                    />
                    {errors.startDate && (
                      <span id="startDateError" className={styles.errorMessage}>
                        {errors.startDate}
                      </span>
                    )}
                  </div>
                  <div className="">
                    <label
                      className={styles.formLabel}
                      style={{ marginRight: "10px" }}
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleInputChange("endDate", e.target.value)
                      }
                      className={styles.formInput}
                      placeholder="End Date"
                    />
                    {errors.endDate && (
                      <span id="endDateError" className={styles.errorMessage}>
                        {errors.endDate}
                      </span>
                    )}
                  </div>
                  <div className="">
                    <label
                      className={styles.formLabel}
                      style={{ marginRight: "10px" }}
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      placeholder="Start Time"
                      value={formData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                      className={styles.formInput}
                    />
                    {errors.startTime && (
                      <span id="startTimeError" className={styles.errorMessage}>
                        {errors.startTime}
                      </span>
                    )}
                  </div>
                  <div className="">
                    <label
                      className={styles.formLabel}
                      style={{ marginRight: "10px" }}
                    >
                      End Time
                    </label>
                    <input
                      type="time"
                      placeholder="End Time"
                      value={formData.endTime}
                      onChange={(e) =>
                        handleInputChange("endTime", e.target.value)
                      }
                      className={styles.formInput}
                    />
                    {errors.endTime && (
                      <span id="endTimeError" className={styles.errorMessage}>
                        {errors.endTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Billing</label>
                <div className={styles.billingInputs}>
                  {/* Amount field - always shown */}
                  <div className="">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                      className={styles.formInput}
                    />
                    {errors.amount && (
                      <span id="amountError" className={styles.errorMessage}>
                        {errors.amount}
                      </span>
                    )}
                  </div>
                  {/* GST Applicable dropdown */}
                  <div className="">
                    <select
                      value={formData.isGst ? "yes" : "no"}
                      onChange={(e) =>
                        handleInputChange("isGst", e.target.value)
                      }
                      className={styles.formInput}
                    >
                      <option value="no">GST: No</option>
                      <option value="yes">GST: Yes</option>
                    </select>
                  </div>

                  {/* Conditionally show GST fields */}
                  {formData.isGst && (
                    <>
                      <div className="">
                        <input
                          type="text"
                          placeholder="GST %"
                          value={formData.gst}
                          onChange={(e) =>
                            handleInputChange("gst", e.target.value)
                          }
                          className={styles.formInput}
                        />
                        {errors.gst && (
                          <span id="gstError" className={styles.errorMessage}>
                            {errors.gst}
                          </span>
                        )}
                      </div>
                      <div className="">
                        <input
                          type="text"
                          placeholder="GST Number"
                          value={formData.gstNumber}
                          onChange={(e) =>
                            handleInputChange("gstNumber", e.target.value)
                          }
                          className={styles.formInput}
                        />
                        {errors.gstNumber && (
                          <span
                            id="gstNumberError"
                            className={styles.errorMessage}
                          >
                            {errors.gstNumber}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Payment Type dropdown */}
                  <select
                    value={formData.modeOfPayment}
                    onChange={(e) =>
                      handleInputChange("modeOfPayment", e.target.value)
                    }
                    className={styles.formInput}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <div className={styles.buttonContainer}>
                  <button className={styles.button} onClick={handleSubmit}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <MemberTable
            selectedCourt={selectedCourt}
            selectedCourtNumber={selectedCourtNumber}
          />
        )}
        {activeTab === "payment-history" && (
          <PaymentHistory
            selectedCourt={selectedCourt}
            selectedCourtNumber={selectedCourtNumber}
          />
        )}
        {activeTab === "booking-overview" && (
          <BookingOverView
            selectedCourt={selectedCourt}
            selectedCourtNumber={selectedCourtNumber}
          />
        )}
      </div>
    </div>
  );
};

export default BookingForm;
