import React, { useEffect, useState } from "react";
import { Search, Trash2, MessageCircle, Eye } from "lucide-react";
import styles from "./Gym.module.css";
import axios from "axios";
import baseUrl from "../../baseUrl";
import { Modal } from "antd";
import { toast } from "react-toastify";


const Gym = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("members");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("");
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);
  const [subscriptionFilter, setSubscriptionFilter] = useState("");
  const [combinedFilter, setCombinedFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setEditModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewMember, setViewMember] = useState({});
  const [order, setOrder] = useState("");

  const showModal = (member) => {
    setUserId(member._id);
    setFormData((prev) => ({ 
      ...prev,
      phoneNumber: member.phoneNumber, // pre-fill phone number
      trainerId: member.trainer?._id || "", // optional: pre-fill trainer
      userType: member.userType || "", // ✅ pre-fill userType
    }));
    setIsModalOpen(true);
  };

  const viewModal = (id) => {
    setIsViewModalOpen(true);

    const viewMember = async (id) => {
      try {
        const viewDetails = await axios.get(
          `${baseUrl}/api/v1/gym/single-user/${id}`
        );
        setViewMember(viewDetails.data.data);
        console.log("view", viewDetails);
      } catch (error) {
        console.log(error);
      }
    };
    viewMember(id);
  };

  const getFileUrl = (fileName) => {
    return `${baseUrl}/${fileName}`;
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleViewCancel = () => {
    setIsViewModalOpen(false);
  };

  const edithandleOk = (id) => {
    setEditModal(false);
  };
  const edithandleCancel = () => {
    setEditModal(false);
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phoneNumber: "",
    whatsAppNumber: "",
    notes: "",
    trainerId: "",
    amount: "",
    isGst: false,
    gst: "",
    gstNumber: "",
    modeOfPayment: "",
    subscriptionMonths: 1,
    startDate: "",
    userType: "athlete",
    profilePicture: null,
    // dietPdf: null,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      for (const key in formData) {
        if (
          formData[key] !== null &&
          formData[key] !== "" &&
          !["gst", "gstNumber", "isGst"].includes(key)
        ) {
          // Convert numbers where needed
          if (
            [
              "phoneNumber",
              "whatsAppNumber",
              "subscriptionMonths",
              "amount",
            ].includes(key)
          ) {
            let numValue = Number(formData[key]);
            if (isNaN(numValue)) numValue = 0; // fallback
            data.append(key, numValue);
          } else {
            data.append(key, formData[key]);
          }
        }
      }

      // include GST fields only if isGst is true
      if (formData.isGst) {
        const gstValue = Number(formData.gst);
        if (isNaN(gstValue) || gstValue < 0) {
          toast.error("Please enter a valid non-negative GST amount");
          return; // stop submission
        }
        data.append("gst", gstValue); // number, not string
        data.append("gstNumber", formData.gstNumber || "");
      }

      for (let [key, value] of data.entries()) {
        console.log(key, typeof value);
      }

      const res = await axios.post(`${baseUrl}/api/v1/gym/user`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("user register gym", res);
      if (res.status === 201) {
        toast.success("Member added succesfully");
      }

      setFormData({
        name: "",
        address: "",
        phoneNumber: "",
        whatsAppNumber: "",
        notes: "",
        trainerId: "",
        amount: "",
        isGst: false,
        gst: "",
        gstNumber: "",
        modeOfPayment: "",
        subscriptionMonths: 1,
        startDate: "",
        userType: "athlete",
        profilePicture: null,
        // dietPdf: null,
      });
      fetchMembers();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // Fetch members with filters & pagination
  const fetchMembers = async () => {
    try {
      const params = { page, limit, search: searchTerm };

      if (userTypeFilter) params.userType = userTypeFilter;
      if (subscriptionFilter) params.status = subscriptionFilter;
      if (trainerFilter) params.trainerName = trainerFilter;
      if (order) params.order = order;

      const res = await axios.get(`${baseUrl}/api/v1/gym/all-users`, {
        params,
      });
      console.log(res);
      setMembers(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // No users found
        setMembers([]);
        setTotalPages(1);
      } else {
        console.error("Error fetching members:", error);
      }
    }
  };

  // Fetch trainers for dropdown
  const fetchTrainers = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/v1/trainer/all-trainers`);
      console.log("train", res);
      setTrainers(res.data.trainers);
    } catch (error) {
      setTrainers([]);
      console.error("Error fetching trainers:", error);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  // Refetch when page, searchTerm, or userTypeFilter changes
  useEffect(() => {
    fetchMembers();
  }, [
    page,
    searchTerm,
    userTypeFilter,
    subscriptionFilter,
    trainerFilter,
    order,
  ]);

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${year}/${month}/${day}`;
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
      toast.error("No valid WhatsApp number provided.");
      return;
    }

    const message = `Hi ${
      name || "there"
    }, I wanted to check in about your membership.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleRenewSubscription = async () => {
    try {
      const payload = {
        phoneNumber: formData.phoneNumber,
        trainerId: formData.trainerId,
        amount: formData.amount,
        modeOfPayment: formData.modeOfPayment,
        subscriptionMonths: formData.subscriptionMonths,
        startDate: formData.startDate,
        userType: formData.userType, // ✅ pass userType
      };

      if (formData.isGst) {
        const gstValue = Number(formData.gst);
        if (isNaN(gstValue) || gstValue < 0) {
          toast.error("Please enter a valid non-negative GST amount");
          return; // stop submission
        }
        payload.isGst = true;
        payload.gst = gstValue;
        payload.gstNumber = formData.gstNumber || "";
      }

      console.log("📤 Sending payload:", payload);

      const res = await axios.post(`${baseUrl}/api/v1/gym/user`, payload);
      if (res.status === 200) {
        toast.success("Form Submit Successfully");
      }
      fetchMembers();
      handleCancel();
    } catch (err) {
      console.error("❌ Error:", err.response?.data);
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`${baseUrl}/api/v1/gym/delete/${id}`);
      fetchMembers();
      if (res.status === 200) {
        toast.success("Deleted Successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      // always close modal after delete attempt
      setIsDeleteModalOpen(false);
      setDeleteUserId(null);
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Members</h1>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.contentContainer}>
            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                onClick={() => setActiveTab("members")}
                className={`${styles.tab} ${
                  activeTab === "members"
                    ? styles.tabActive
                    : styles.tabInactive
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setActiveTab("addMembers")}
                className={`${styles.tab} ${
                  activeTab === "addMembers"
                    ? styles.tabActive
                    : styles.tabInactive
                }`}
              >
                Add Members
              </button>
            </div>

            {/* Content based on active tab */}
            {activeTab === "members" ? (
              <>
                <div className={styles.searchselect}>
                  {/* Search Bar */}
                  <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search members"
                      className={styles.searchInput}
                      value={searchTerm}
                      onChange={(e) => {
                        setPage(1);
                        setSearchTerm(e.target.value);
                      }}
                    />
                  </div>
                  <div className={styles.selectmembers}>
                    <select
                      value={combinedFilter}
                      onChange={(e) => {
                        setPage(1);
                        const value = e.target.value;
                        setCombinedFilter(value);

                        // Reset both filters first
                        setUserTypeFilter("");
                        setSubscriptionFilter("");
                        setOrder("");

                        // Apply filter based on selection
                        if (
                          [
                            "athlete",
                            "non-athlete",
                            "personal-trainer",
                          ].includes(value)
                        ) {
                          setUserTypeFilter(value);
                        } else if (["active", "expired"].includes(value)) {
                          setSubscriptionFilter(value);
                        } else if (value === "asc") {
                          setOrder("asc"); // 🔹 new state for sorting
                        }
                      }}
                    >
                      <option className={styles.selectoption} value="">
                        Select
                      </option>
                      <option className={styles.selectoption} value="athlete">
                        Athlete
                      </option>
                      <option
                        className={styles.selectoption}
                        value="non-athlete"
                      >
                        Non Athlete
                      </option>
                      <option
                        className={styles.selectoption}
                        value="personal-trainer"
                      >
                        Personal Trainer
                      </option>
                      <option className={styles.selectoption} value="active">
                        Active Members
                      </option>
                      <option className={styles.selectoption} value="expired">
                        Inactive Members
                      </option>
                      <option className={styles.selectoption} value="asc">
                        Oldest First
                      </option>
                    </select>
                  </div>
                  <div className={styles.selectmembers}>
                    <select
                      value={trainerFilter}
                      onChange={(e) => {
                        setPage(1);
                        setTrainerFilter(e.target.value);
                      }}
                    >
                      <option value="">All Trainers</option>
                      {Array.isArray(trainers) &&
                        trainers.map((trainer) => (
                          <option key={trainer._id} value={trainer.trainerName}>
                            {trainer.trainerName}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th className={styles.tableHeaderCell}>Name</th>
                        <th className={styles.tableHeaderCell}>Phone Number</th>
                        <th className={styles.tableHeaderCell}>
                          WhatsApp Number
                        </th>
                        <th className={styles.tableHeaderCell}>Joining date</th>
                        <th className={styles.tableHeaderCell}>Ended Date</th>
                        <th className={styles.tableHeaderCell}>Actions</th>
                        <th className={styles.tableHeaderCell}>
                          Subscription Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member, index) => (
                        <tr key={index} className={styles.tableRow}>
                          <td
                            className={`${styles.tableCell} ${styles.tableCellName}`}
                          >
                            {member.name}
                          </td>
                          <td className={styles.tableCell}>
                            {member.phoneNumber}
                          </td>
                          <td className={styles.tableCell}>
                            {member.whatsAppNumber}
                          </td>
                          <td className={styles.tableCell}>
                            {formatDate(member.subscription.startDate)}
                          </td>
                          <td className={styles.tableCell}>
                            {formatDate(member.subscription.endDate)}
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.actionButtons}>
                              <button
                                className={`${styles.actionButton} ${styles.actionButtonMessage}`}
                                onClick={() =>
                                  openWhatsApp(
                                    member.whatsAppNumber,
                                    member.name
                                  )
                                }
                              >
                                <MessageCircle
                                  color="green"
                                  className="w-4 h-4"
                                />
                              </button>
                              {/* <button className={`${styles.editButton} ${styles.actionButtonEdit}`}
                                                                onClick={() => editModal()}
                                                            >
                                                                <Edit color='#000' className="w-4 h-4" />
                                                            </button> */}
                              <button
                                className={`${styles.deleteButton} ${styles.actionButtonDelete}`}
                                onClick={() => {
                                  setDeleteUserId(member._id);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                <Trash2 color="red" className="w-4 h-4" />
                              </button>
                              <button
                                className={`${styles.actionButton} ${styles.actionButtonView}`}
                                onClick={() => viewModal(member._id)}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.statusContainer}>
                              <span
                                className={`${styles.statusBadge} ${
                                  member.subscription.status === "active"
                                    ? styles.statusActive
                                    : styles.statusExpired
                                }`}
                              >
                                {member.subscription.status.toUpperCase()}
                              </span>
                              {member.subscription.status === "expired" && (
                                <button
                                  className={styles.renewButton}
                                  onClick={() => showModal(member)}
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
                </div>

                {/* Pagination */}
                <div className={styles.pagination}>
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <span>
                    {" "}
                    Page {page} of {totalPages}{" "}
                  </span>
                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.formWrapper}>
                <div className={styles.formContainer}>
                  <h2 className={styles.formTitle}>Add Members</h2>
                  <form className={styles.form} onSubmit={handleSubmit}>
                    {/* Name */}
                    <div className={styles.formSection}>
                      <label className={styles.sectionLabel}>Full Name</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Full Name"
                        required
                      />
                    </div>

                    {/* Phone & WhatsApp */}
                    <div className={styles.formSection}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.sectionLabel}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            className={styles.formInput}
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="eg:9847634XXX"
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.sectionLabel}>
                            WhatsApp Number
                          </label>
                          <input
                            type="tel"
                            className={styles.formInput}
                            name="whatsAppNumber"
                            value={formData.whatsAppNumber}
                            onChange={handleInputChange}
                            placeholder="eg:9847634XXX"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className={styles.formSection}>
                      <label className={styles.sectionLabel}>Address</label>
                      <textarea
                        className={styles.formTextarea}
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Home/Office"
                        required
                      />
                    </div>

                    {/* Notes */}
                    <div className={styles.formSection}>
                      <label className={styles.sectionLabel}>
                        Health Notes
                      </label>
                      <textarea
                        className={styles.formTextarea}
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Enter your health information"
                      />
                    </div>

                    {/* User Type */}
                    <div className={styles.formSection}>
                      <label className={styles.sectionLabel}>User Type</label>
                      <select
                        className={styles.formSelect}
                        name="userType"
                        value={formData.userType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="athlete">Athlete</option>
                        <option value="non-athlete">Non Athlete</option>
                        <option value="personal-trainer">
                          Personal Trainer
                        </option>
                      </select>
                    </div>

                    {/* Trainer */}
                    <div className={styles.formSection}>
                      <label className={styles.sectionLabel}>
                        Assign Trainer
                      </label>
                      <select
                        className={styles.formSelect}
                        name="trainerId"
                        value={formData.trainerId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Trainer</option>
                        {trainers.map((trainer) => (
                          <option key={trainer._id} value={trainer._id}>
                            {trainer.trainerName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subscription */}
                    <div className={styles.formSection}>
                      <label className={styles.sectionLabel}>
                        Subscription
                      </label>
                      <div className={styles.billingRow}>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className={styles.formInput}
                          required
                        />
                        <input
                          type="number"
                          name="subscriptionMonths"
                          min={1}
                          max={12}
                          value={formData.subscriptionMonths}
                          onChange={handleInputChange}
                          className={styles.formInput}
                          placeholder="Months"
                          required
                        />
                      </div>
                    </div>

                    {/* Billing */}
                    <div className={styles.formSection}>
                      <label className={styles.sectionLabel}>Billing</label>
                      <div className={styles.billingRow}>
                        {formData.isGst && (
                          <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className={styles.formInput}
                            placeholder="Amount"
                            required
                          />
                        )}
                        {!formData.isGst && (
                          <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className={styles.formInput}
                            placeholder="Amount"
                          />
                        )}
                        <select
                          name="modeOfPayment"
                          className={styles.formSelect}
                          value={formData.modeOfPayment}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="upi">UPI</option>
                        </select>
                        <div>
                          <label>
                            <input
                              type="checkbox"
                              name="isGst"
                              checked={formData.isGst}
                              onChange={handleInputChange}
                            />{" "}
                            GST
                          </label>
                        </div>
                        {formData.isGst && (
                          <>
                            <input
                              type="number"
                              name="gst"
                              value={formData.gst}
                              onChange={handleInputChange}
                              className={styles.formInput}
                              placeholder="GST Amount"
                              min={0}
                            />
                            <input
                              type="text"
                              name="gstNumber"
                              value={formData.gstNumber}
                              onChange={handleInputChange}
                              className={styles.formInput}
                              placeholder="GST Number"
                            />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Files */}
                    <div className={styles.formSection}>
                      <label className={styles.sectionLabel}>
                        Profile Picture
                      </label>
                      <input
                        type="file"
                        name="profilePicture"
                        onChange={handleInputChange}
                        className={styles.formInput}
                      />
                    </div>
                    {/* <div className={styles.formSection}>
                                            <label className={styles.sectionLabel}>Diet PDF</label>
                                            <input
                                                type="file"
                                                name="dietPdf"
                                                onChange={handleInputChange}
                                                className={styles.formInput}
                                            />
                                        </div> */}

                    <div className={styles.formButtons}>
                      <button type="submit" className={styles.submitButton}>
                        Add Member
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        title="Renew Subscriptions"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onOk={handleRenewSubscription}
        onCancel={handleCancel}
        width={1000}
      >
        {/* Billing Section */}
        <div className={styles.formSection}>
          <label className={styles.sectionLabel}>Billing</label>
          <div className={styles.billingRow}>
            <input
              type="date"
              className={styles.formInput}
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              className={styles.formInput}
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter Amount for Booking"
              required
            />
            <select
              className={styles.formSelect}
              name="modeOfPayment"
              value={formData.modeOfPayment}
              onChange={handleInputChange}
              required
            >
              <option value="">Select</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>
        </div>

        {/* Phone & Trainer */}
        <div className={styles.billingRow}>
          <label className={styles.sectionLabel}>Phone Number</label>
          <input
            type="tel"
            className={styles.formInput}
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="eg:9847634XXX"
            required
          />

          <label className={styles.sectionLabel}>Assign Trainer</label>
          <select
            className={styles.formSelect}
            name="trainerId"
            value={formData.trainerId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Trainer</option>
            {trainers.map((trainer) => (
              <option key={trainer._id} value={trainer._id}>
                {trainer.trainerName}
              </option>
            ))}
          </select>
        </div>

        {/* Subscription Months */}
        <div className={styles.billingRow}>
          <label className={styles.sectionLabel}>Subscription Months</label>
          <input
            type="number"
            className={styles.formInput}
            name="subscriptionMonths"
            min="1"
            max="12"
            value={formData.subscriptionMonths}
            onChange={handleInputChange}
          />
        </div>

        {/* GST Section */}
        <div className={styles.billingRow}>
          <label>
            <input
              type="checkbox"
              name="isGst"
              checked={formData.isGst}
              onChange={handleInputChange}
            />{" "}
            Apply GST
          </label>
        </div>

        {formData.isGst && (
          <div className={styles.billingRow}>
            <input
              type="number"
              className={styles.formInput}
              name="gst"
              value={formData.gst}
              onChange={handleInputChange}
              placeholder="Enter GST %"
              required
            />
            <input
              type="text"
              className={styles.formInput}
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleInputChange}
              placeholder="Enter GST Number"
              required
            />
          </div>
        )}

        {/* Submit */}
        <div className={styles.formButtons}>
          <button
            type="submit"
            className={styles.submitButton}
            onClick={handleRenewSubscription}
          >
            Submit
          </button>
        </div>
      </Modal>

      <Modal
        title="Edit Gym User"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isEditModal}
        onOk={edithandleOk}
        onCancel={edithandleCancel}
        width={800}
      >
        <div className={styles.editModal}>
          <div>
            <label className={styles.sectionLabel}>Enter Your Name</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className={styles.sectionLabel}>Enter Phone Number</label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="eg: 9847634XXX"
            />
          </div>
        </div>

        <div className={styles.editModal}>
          <div>
            <label className={styles.sectionLabel}>Enter Whatsapp Number</label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="eg: 9847634XXX"
            />
          </div>
          <div>
            <label className={styles.sectionLabel}>Enter Phone Number</label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="eg: 9847634XXX"
            />
          </div>
        </div>

        <div className={styles.editModal}>
          <div>
            <label className={styles.sectionLabel}>Enter Phone Number</label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="eg:9847634XXX"
            />
          </div>
          <div>
            <label className={styles.sectionLabel}>Enter Phone Number</label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="eg:9847634XXX"
            />
          </div>
        </div>

        <div className={styles.editModal}>
          <div>
            <label className={styles.sectionLabel}>Enter Phone Number</label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="eg:9847634XXX"
            />
          </div>
          <div>
            <label className={styles.sectionLabel}>Enter Phone Number</label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="eg:9847634XXX"
            />
          </div>
        </div>
        <div className={styles.formButtons}>
          <button type="submit" className={styles.submitButton}>
            Edit
          </button>
        </div>
      </Modal>

      <Modal
        title="Confirm Delete"
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        footer={[
          <button
            key="cancel"
            className={styles.cancelButton}
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancel
          </button>,
          <button
            key="delete"
            className={styles.deleteButton}
            onClick={() => handleDelete(deleteUserId)}
          >
            Delete
          </button>,
        ]}
      >
        <p>
          Are you sure you want to delete this member? This action cannot be
          undone.
        </p>
      </Modal>

      <Modal
        title="Member Profile"
        open={isViewModalOpen}
        onCancel={handleViewCancel}
        footer={null}
        centered
        width={500}
      >
        <div className="flex flex-col items-center">
          {/* Profile Header */}
          <div className="flex items-center gap-4 w-full border-b pb-4">
            {/* Profile Picture */}
            {viewMember.profilePicture ? (
              <img
                src={getFileUrl(viewMember.profilePicture)}
                alt={viewMember.name}
                className={styles.modalimage}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}

            {/* User Info */}
            <div>
              <h2 className="text-lg font-semibold">
                <strong>Name:</strong> {viewMember.name}
              </h2>
              <p className="text-gray-600">
                <strong>UserType:</strong>{" "}
                {viewMember.userType
                  ? viewMember.userType.charAt(0).toUpperCase() +
                    viewMember.userType.slice(1).toLowerCase()
                  : ""}
              </p>
              <p className="text-gray-500 text-sm">
                <strong>Location:</strong> {viewMember.address}
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full mt-4 space-y-2 text-gray-700">
            <p>
              <strong>Phone:</strong> {viewMember.phoneNumber}
            </p>
            <p>
              <strong>WhatsApp:</strong> {viewMember.whatsAppNumber}
            </p>
            {viewMember.notes && (
              <p>
                <strong>Notes:</strong> {viewMember.notes}
              </p>
            )}
            {viewMember.trainer && (
              <p>
                <strong>Trainer:</strong> {viewMember.trainer.trainerName} (
                {viewMember.trainer.phoneNumber})
              </p>
            )}
            {viewMember.subscription && (
              <p>
                <strong>Subscription:</strong>{" "}
                {new Date(
                  viewMember.subscription.startDate
                ).toLocaleDateString()}{" "}
                -{" "}
                {new Date(viewMember.subscription.endDate).toLocaleDateString()}{" "}
                <span
                  className={
                    viewMember.subscription.status === "active"
                      ? styles.successstatus
                      : styles.expiredstatus
                  }
                >
                  {viewMember.subscription.status.charAt(0).toUpperCase() +
                    viewMember.subscription.status.slice(1).toLowerCase()}
                </span>
              </p>
            )}
            <div className="mt-3">
              <strong>Upload Diet : </strong>
              <input
                type="file"
                accept="application/pdf"
                className={styles.fileupload}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("userId", viewMember._id);
                  formData.append("dietPdf", file);

                  try {
                    const res = await axios.post(
                      `${baseUrl}/api/v1/trainer/assign-diet-plan`,
                      formData,
                      {
                        headers: {
                          "Content-Type": "multipart/form-data",
                        },
                      }
                    );

                    toast.success(res.data.message);
                    setIsViewModalOpen(false);
                  } catch (error) {
                    toast.error(
                      error.response?.data?.message || "Failed to upload"
                    );
                  }
                }}
              />
            </div>
            {viewMember.dietPdfs && viewMember.dietPdfs.length > 0 && (
              <div>
                <strong>Diet PDFs:</strong>
                <ul className={`${styles.pdfList} list-none ml-0 mt-1`}>
                  {viewMember.dietPdfs.map((pdf, idx) => (
                    <li key={idx} className={styles.pdfListItem}>
                      <div className={styles.pdfCard}>
                        <a
                          href={getFileUrl(pdf)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.pdfLink} flex-1`}
                        >
                          PDF {idx + 1}
                        </a>
                        <button
                          onClick={async () => {
                            try {
                              const res = await axios.delete(
                                `${baseUrl}/api/v1/trainer/delete-diet-plan`,
                                {
                                  data: { userId: viewMember._id, index: idx },
                                }
                              );
                              toast.success(res.data.message);
                              // Update state to remove deleted PDF
                              setViewMember((prev) => ({
                                ...prev,
                                dietPdfs: prev.dietPdfs.filter(
                                  (_, i) => i !== idx
                                ),
                              }));
                            } catch (err) {
                              toast.error(
                                err.response?.data?.message ||
                                  "Failed to delete PDF"
                              );
                            }
                          }}
                          className={styles.deleteButton}
                        >
                          <Trash2 className={styles.deletediet} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Gym;
