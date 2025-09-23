import React, { useEffect, useState, useRef } from 'react';
import { Search, Edit, Trash2, MessageCircle, Eye, Upload, X, RefreshCw } from 'lucide-react';
import styles from './GymMembers.module.css';
import axios from "axios"
import baseUrl from "../../baseUrl"
import { useParams } from 'react-router-dom';
import { Modal } from 'antd';
import { toast } from "react-toastify";

const GymMembers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [members, setMembers] = useState([])
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const [combinedFilter, setCombinedFilter] = useState("");
  const [uploadingMembers, setUploadingMembers] = useState(new Set());
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewMember, setViewMember] = useState({});
  const [deletingPdfs, setDeletingPdfs] = useState(new Set());
  const [refreshingModal, setRefreshingModal] = useState(false);
  const { id } = useParams()

  // File upload refs - one for each member (specifically for diet PDFs)
  const fileInputRefs = useRef({});

  const getFileUrl = (fileName) => {
    return `${baseUrl}/${fileName}`;
  };

  // Fetch members with filters & pagination
  const fetchMembers = async () => {
    try {
      const params = { page, limit, search: searchTerm };
      if (userTypeFilter) params.userType = userTypeFilter;
      if (subscriptionFilter) params.status = subscriptionFilter;

      const res = await axios.get(
        `${baseUrl}/api/v1/trainer/assigned-users/${id}`,
        { params }
      );
      console.log("Members data:", res.data);
      setMembers(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  // Fetch single member details for modal
  const fetchSingleMember = async (memberId) => {
    try {
      const res = await axios.get(`${baseUrl}/api/v1/gym/single-user/${memberId}`);
      console.log("Single member data:", res.data);
      setViewMember(res.data.data);
      return res.data.data; // Return the data for use in other functions
    } catch (error) {
      console.error("Error fetching single member:", error);
      return null; // Return null on error
    }
  };

  // Manual refresh for modal data
  const refreshModalData = async () => {
    if (!viewMember._id) return;

    setRefreshingModal(true);
    try {
      await fetchSingleMember(viewMember._id);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshingModal(false);
    }
  };

  // Refetch when page, searchTerm, or userTypeFilter changes
  useEffect(() => {
    const interval = setInterval(() => {
    
      fetchMembers();
    }, 120000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [page, searchTerm, userTypeFilter, subscriptionFilter]);

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

    const message = `Hi ${name || "there"}, I wanted to check in about your membership.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Handle view modal - fetch fresh data
  const viewModal = async (memberId) => {
    setIsViewModalOpen(true);
    await fetchSingleMember(memberId);
  };

  const handleViewCancel = () => {
    setIsViewModalOpen(false);
    setViewMember({});
  };

  // Handle diet plan upload button click
  const handleDietUploadClick = (memberId) => {
    if (fileInputRefs.current[memberId]) {
      fileInputRefs.current[memberId].click();
    }
  };

  // Handle diet plan file selection and upload
  const handleDietFileChange = async (event, member) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type - only PDF allowed for diet plans
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file for the diet plan.');
      event.target.value = '';
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      event.target.value = '';
      return;
    }

    // Set loading state
    setUploadingMembers(prev => new Set([...prev, member._id]));

    try {
      const formData = new FormData();
      formData.append('dietPdf', file);
      formData.append('userId', member._id);
      formData.append('trainerId', id); // Add trainer ID to form data

      console.log("Uploading file for member:", member._id, "trainer:", id);

      // Upload diet plan using the correct endpoint (without trainer ID in URL)
      const response = await axios.post(
        `${baseUrl}/api/v1/trainer/assign-diet-plan`, // Remove /${id} from URL
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log("Upload response:", response.data);
      toast.success(`Diet plan uploaded successfully for ${member.name}`);

      // Refresh members data to show updated info
      await fetchMembers();

      // If modal is open for this member, refresh the modal data
      if (isViewModalOpen && viewMember._id === member._id) {
        setTimeout(async () => {
          await fetchSingleMember(member._id);
        }, 500);
      }

    } catch (error) {
      console.error('Full error details:', error);
      console.error('Error response:', error.response);

      // Handle different error scenarios
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid request. Please check your inputs.');
      } else if (error.response?.status === 403) {
        toast.error('You are not authorized to assign diet plans to this member.');
      } else if (error.response?.status === 404) {
        toast.error('API endpoint not found. Please check your backend configuration.');
      } else {
        toast.error(`Upload failed: ${error.message}`);
      }
    } finally {
      // Reset loading state and clear input
      setUploadingMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(member._id);
        return newSet;
      });
      event.target.value = '';
    }
  };

  // Simplified handleDeleteIndividualPdf - validation done before calling
  const handleDeleteIndividualPdf = async (pdfFileName, memberId, pdfIndex) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this PDF? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    // Create unique key for this specific PDF deletion
    const pdfKey = `${memberId}-${pdfFileName}`;
    setDeletingPdfs(prev => new Set([...prev, pdfKey]));

    try {
      console.log("=== FINAL DELETE ATTEMPT ===");
      console.log("- Member ID:", memberId);
      console.log("- PDF filename:", pdfFileName);
      console.log("- Index to delete:", pdfIndex);
      console.log("- API endpoint:", `${baseUrl}/api/v1/trainer/delete-diet-plan`);

      const response = await axios.delete(
        `${baseUrl}/api/v1/trainer/delete-diet-plan`,
        {
          data: {
            userId: memberId,
            index: pdfIndex
          },
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log("Delete response:", response.data);
      toast.success('PDF deleted successfully');

      // Refresh members data
      await fetchMembers();

      // Update viewMember if modal is open - with a small delay to ensure backend is updated
      if (isViewModalOpen && viewMember._id === memberId) {
        setTimeout(async () => {
          await fetchSingleMember(memberId);
        }, 500);
      }

    } catch (error) {
      console.error('=== DELETE ERROR ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid request.');
      } else if (error.response?.status === 403) {
        toast.error('You are not authorized to delete this PDF.');
      } else if (error.response?.status === 404) {
        if (error.response?.data?.message) {
          const errorMsg = error.response.data.message;
          if (errorMsg === "User not found") {
            toast.error('Member not found. Please refresh the page.');
          } else if (errorMsg === "Invalid diet plan index") {
            toast.error('PDF index is invalid. The PDF may have been deleted already.');
          } else {
            toast.error(`Backend error: ${errorMsg}`);
          }
        } else {
          toast.error('API endpoint not found. Please check your backend route configuration.');
        }
      } else {
        toast.error('Failed to delete PDF. Please try again.');
      }
    } finally {
      // Reset loading state for this specific PDF
      setDeletingPdfs(prev => {
        const newSet = new Set(prev);
        newSet.delete(pdfKey);
        return newSet;
      });
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

                    // Apply filter based on selection
                    if (value === "athlete" || value === "non-athlete") {
                      setUserTypeFilter(value);
                    } else if (value === "active" || value === "expired") {
                      setSubscriptionFilter(value);
                    }
                  }}
                >
                  <option className={styles.selectoption} value="">Select</option>
                  <option className={styles.selectoption} value="athlete">Athlete</option>
                  <option className={styles.selectoption} value="non-athlete">Non Athlete</option>
                  <option className={styles.selectoption} value="active">Active Members</option>
                  <option className={styles.selectoption} value="expired">Inactive Members</option>
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
                    <th className={styles.tableHeaderCell}>WhatsApp Number</th>
                    <th className={styles.tableHeaderCell}>Joining date</th>
                    <th className={styles.tableHeaderCell}>Ended Date</th>
                    <th className={styles.tableHeaderCell}>Subscription Status</th>
                    <th className={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr key={index} className={styles.tableRow}>
                      <td className={`${styles.tableCell} ${styles.tableCellName}`}>{member.name}</td>
                      <td className={styles.tableCell}>{member.phoneNumber}</td>
                      <td className={styles.tableCell}>{member.whatsAppNumber}</td>
                      <td className={styles.tableCell}>{formatDate(member.subscription.startDate)}</td>
                      <td className={styles.tableCell}>{formatDate(member.subscription.endDate)}</td>
                      <td className={styles.tableCell}>
                        <div className={styles.statusContainer}>
                          <span className={`${styles.statusBadge} ${member.subscription.status === 'active'
                            ? styles.statusActive
                            : styles.statusExpired
                            }`}>
                            {member.subscription.status}
                          </span>
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.actionButtons}>
                          {/* WhatsApp Message Button */}
                          <button
                            className={`${styles.actionButton} ${styles.actionButtonMessage}`}
                            onClick={() => openWhatsApp(member.whatsAppNumber, member.name)}
                            title={`Message ${member.name} on WhatsApp`}
                          >
                            <MessageCircle color='green' className="w-4 h-4" />
                          </button>

                          {/* Upload Diet Plan Button */}
                          <button
                            className={`${styles.actionButton} ${styles.actionButtonUpload}`}
                            onClick={() => handleDietUploadClick(member._id)}
                            title={`Upload diet plan for ${member.name}`}
                            disabled={uploadingMembers.has(member._id)}
                          >
                            {uploadingMembers.has(member._id) ? (
                              <div className={styles.uploadingSpinner}></div>
                            ) : (
                              <Upload color='blue' className="w-4 h-4" />
                            )}
                          </button>

                          {/* View Member Details Button */}
                          <button
                            className={`${styles.actionButton} ${styles.actionButtonView}`}
                            onClick={() => viewModal(member._id)}
                            title={`View details and PDFs for ${member.name}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Hidden file input for PDF upload */}
                          <input
                            ref={el => fileInputRefs.current[member._id] = el}
                            type="file"
                            style={{ display: 'none' }}
                            accept=".pdf"
                            onChange={(e) => handleDietFileChange(e, member)}
                          />
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
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <span> Page {page} of {totalPages} </span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* View Member Modal - Shows only uploaded PDFs */}
      <Modal
        title="Member Profile & Diet Plans"
        open={isViewModalOpen}
        onCancel={handleViewCancel}
        footer={null}
        centered
        width={700}
      >
        <div className={styles.modalContainer}>
          {/* Profile Header */}
          <div className={styles.profileHeader}>
            {/* Profile Picture */}
            {viewMember.profilePicture ? (
              <img
                src={getFileUrl(viewMember.profilePicture)}
                alt={viewMember.name}
                className={styles.modalimage}
              />
            ) : (
              <div className={styles.noProfileImage}>
                No Image
              </div>
            )}

            {/* User Info */}
            <div className={styles.userInfo}>
              <h2 className={styles.userName}><strong>Name:</strong> {viewMember.name}</h2>
              <p className={styles.userType}><strong>UserType:</strong> {viewMember.userType ? viewMember.userType.charAt(0).toUpperCase() + viewMember.userType.slice(1).toLowerCase() : ""}</p>
              <p className={styles.userLocation}><strong>Location:</strong> {viewMember.address}</p>
            </div>
          </div>

          {/* Details Section */}
          <div className={styles.detailsSection}>
            <p><strong>Phone:</strong> {viewMember.phoneNumber}</p>
            <p><strong>WhatsApp:</strong> {viewMember.whatsAppNumber}</p>
            {viewMember.notes && <p><strong>Notes:</strong> {viewMember.notes}</p>}
            {viewMember.trainer && (
              <p>
                <strong>Trainer:</strong> {viewMember.trainer.trainerName} ({viewMember.trainer.phoneNumber})
              </p>
            )}
            {viewMember.subscription && (
              <p>
                <strong>Subscription:</strong>{" "}
                {new Date(viewMember.subscription.startDate).toLocaleDateString()} -{" "}
                {new Date(viewMember.subscription.endDate).toLocaleDateString()} {" "}
                <span
                  className={
                    viewMember.subscription.status === "active"
                      ? styles.successstatus
                      : styles.expiredstatus
                  }
                >
                  {viewMember.subscription.status.charAt(0).toUpperCase() + viewMember.subscription.status.slice(1).toLowerCase()}
                </span>
              </p>
            )}
          </div>

          {/* Diet PDFs Section - Only show uploaded PDFs */}
          <div className={styles.pdfSection}>
            {/* Header with refresh button */}
            <div className={styles.pdfSectionHeader}>
              <h3 className={styles.pdfSectionTitle}>Uploaded Diet Plans:</h3>
              <button
                onClick={refreshModalData}
                disabled={refreshingModal}
                className={styles.refreshButton}
                title="Refresh PDF list"
              >
                {refreshingModal ? (
                  <div className={styles.refreshSpinner}></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Debug info - you can remove this after fixing */}
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              Debug: {viewMember.dietPdfs ? `${viewMember.dietPdfs.length} PDFs found` : 'No PDFs array'}
              {viewMember.dietPdf ? ', Single PDF exists' : ', No single PDF'}
            </div>

            {/* Show dietPdfs array if it exists */}
            {viewMember.dietPdfs && viewMember.dietPdfs.length > 0 ? (
              <div className={styles.pdfList}>
                {viewMember.dietPdfs.map((pdf, idx) => (
                  <div key={`${pdf}-${idx}`} className={styles.pdfItem}>
                    <div className={styles.pdfHeader}>
                      <span className={styles.pdfTitle}>Diet Plan {idx + 1}</span>
                      <button
                        onClick={async () => {
                          // Force refresh before delete to ensure accurate data
                          console.log("=== PRE-DELETE REFRESH ===");
                          const freshData = await fetchSingleMember(viewMember._id);
                          if (freshData && freshData.dietPdfs && freshData.dietPdfs.includes(pdf)) {
                            console.log("PDF still exists after refresh, proceeding with delete");
                            handleDeleteIndividualPdf(pdf, viewMember._id, idx);
                          } else {
                            console.log("PDF no longer exists after refresh");
                            toast.info('This PDF has already been deleted. Refreshing the view...');
                            // The fetchSingleMember already updated the viewMember state
                          }
                        }}
                        disabled={deletingPdfs.has(`${viewMember._id}-${pdf}`)}
                        className={styles.deleteButton}
                        title="Delete this PDF"
                      >
                        {deletingPdfs.has(`${viewMember._id}-${pdf}`) ? (
                          <div className={styles.deletingSpinner}></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <a
                      href={getFileUrl(pdf)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.pdfLink}
                    >
                      View PDF
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              // Also check for single dietPdf (backward compatibility)
              viewMember.dietPdf ? (
                <div className={styles.pdfItem}>
                  <div className={styles.pdfHeader}>
                    <span className={styles.pdfTitle}>Diet Plan</span>
                    <button
                      onClick={async () => {
                        // Force refresh before delete for single PDF too
                        console.log("=== PRE-DELETE REFRESH (Single PDF) ===");
                        const freshData = await fetchSingleMember(viewMember._id);
                        if (freshData && freshData.dietPdf === viewMember.dietPdf) {
                          console.log("Single PDF still exists after refresh, proceeding with delete");
                          handleDeleteIndividualPdf(viewMember.dietPdf, viewMember._id, 0);
                        } else {
                          console.log("Single PDF no longer exists after refresh");
                          toast.info('This PDF has already been deleted. Refreshing the view...');
                        }
                      }}
                      disabled={deletingPdfs.has(`${viewMember._id}-${viewMember.dietPdf}`)}
                      className={styles.deleteButton}
                      title="Delete this PDF"
                    >
                      {deletingPdfs.has(`${viewMember._id}-${viewMember.dietPdf}`) ? (
                        <div className={styles.deletingSpinner}></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <a
                    href={getFileUrl(viewMember.dietPdf)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.pdfLink}
                  >
                    View PDF
                  </a>
                </div>
              ) : (
                <p className={styles.noPdfsMessage}>
                  No diet plans uploaded yet. Use the upload button in the table to add diet plans.
                </p>
              )
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GymMembers;