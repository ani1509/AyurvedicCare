import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [message, setMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [appointmentToModify, setAppointmentToModify] = useState(null);
  const [modifyFormData, setModifyFormData] = useState({
    date: "",
    time: "",
    consultationMode: "",
    symptoms: "",
  });
  const [modifyLoading, setModifyLoading] = useState(false);
  const [dateValidationError, setDateValidationError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Store timeout IDs for cleanup
  const timeoutRefs = useRef([]);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);

      // Call real MongoDB Atlas API to get appointments
      const params = new URLSearchParams();
      if (selectedStatus) {
        params.append("status", selectedStatus);
      }

      const response = await axios.get(`/api/appointments?${params}`);

      // Sort: upcoming future appointments first, then completed, then others/cancelled
      const now = new Date();
      const getStartDateTime = (apt) => {
        const d = new Date(apt.appointmentDate);
        const [h, m] = String(apt.startTime || "00:00")
          .split(":")
          .map((n) => parseInt(n, 10));
        d.setHours(h || 0, m || 0, 0, 0);
        return d;
      };
      const priority = (apt) => {
        const start = getStartDateTime(apt);
        if (apt.status === "cancelled") return 3; // always last
        if (start > now) return 0; // upcoming
        if (apt.status === "completed") return 1; // past completed
        return 2; // past pending/confirmed/no-show
      };
      const sortedAppointments = (response.data.appointments || [])
        .slice()
        .sort((a, b) => {
          const pa = priority(a);
          const pb = priority(b);
          if (pa !== pb) return pa - pb;
          const aStart = getStartDateTime(a).getTime();
          const bStart = getStartDateTime(b).getTime();
          // For upcoming, earlier first; for others, later first
          if (pa === 0) return aStart - bStart;
          return bStart - aStart;
        });

      setAppointments(sortedAppointments);

      // Debug logging
      console.log(
        "Fetched appointments from MongoDB:",
        response.data.appointments
      );
      console.log("Number of appointments:", response.data.appointments.length);
      if (response.data.appointments.length > 0) {
        console.log(
          "First appointment structure:",
          response.data.appointments[0]
        );
        console.log(
          "First appointment doctor data:",
          response.data.appointments[0].doctor
        );
        console.log(
          "First appointment doctorId:",
          response.data.appointments[0].doctorId
        );
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      setMessage("Error loading appointments. Please try again.");

      // Auto-hide error messages after 5 seconds
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 5000);
      timeoutRefs.current.push(timeoutId);

      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  // Refresh appointments when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAppointments();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchAppointments]);

  // Force refresh when page loads
  useEffect(() => {
    // Force refresh appointments when page loads
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts to prevent memory leaks
      timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutRefs.current = [];
    };
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedStatus, fetchAppointments]);

  const handleCancelAppointment = async (appointmentId, reason) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}/cancel`, { reason });
      setMessage("Appointment cancelled successfully!");

      // Auto-hide the success message after 3 seconds
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);

      fetchAppointments(); // Refresh the list
    } catch (error) {
      setMessage(
        "Error cancelling appointment: " + error.response?.data?.error ||
          error.message
      );

      // Auto-hide error messages after 5 seconds
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 5000);
      timeoutRefs.current.push(timeoutId);
    }
  };

  const showCancelConfirmation = (appointment) => {
    setAppointmentToCancel(appointment);
    setShowCancelConfirm(true);
  };

  const confirmCancellation = async () => {
    if (appointmentToCancel) {
      await handleCancelAppointment(
        appointmentToCancel.id,
        "Cancelled by patient"
      );
      setShowCancelConfirm(false);
      setAppointmentToCancel(null);

      // Auto-hide the success message after 3 seconds
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
    }
  };

  const closeCancelConfirmation = () => {
    setShowCancelConfirm(false);
    setAppointmentToCancel(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "pending":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if appointment can be modified (up to 24 hours before)
  const canModifyAppointment = (appointmentDate) => {
    const appointmentDateObj = new Date(appointmentDate);
    const today = new Date();
    const twentyFourHoursBefore = new Date(appointmentDateObj);
    twentyFourHoursBefore.setHours(appointmentDateObj.getHours() - 24);

    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    twentyFourHoursBefore.setHours(0, 0, 0, 0);

    return today <= twentyFourHoursBefore;
  };

  // Check if a date is within the valid booking range (24 hours - 30 days from today)
  const isDateInValidRange = (dateString) => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    const twentyFourHoursFromNow = new Date(today);
    twentyFourHoursFromNow.setHours(today.getHours() + 24);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Reset time to start of day for accurate comparison
    selectedDate.setHours(0, 0, 0, 0);
    twentyFourHoursFromNow.setHours(0, 0, 0, 0);
    thirtyDaysFromNow.setHours(0, 0, 0, 0);

    return (
      selectedDate >= twentyFourHoursFromNow &&
      selectedDate <= thirtyDaysFromNow
    );
  };

  // Validate selected date and show real-time feedback
  const validateSelectedDate = (dateString) => {
    if (!dateString) {
      setDateValidationError("");
      return;
    }

    const selectedDate = new Date(dateString);
    const today = new Date();
    const twentyFourHoursFromNow = new Date(today);
    twentyFourHoursFromNow.setHours(today.getHours() + 24);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Reset time to start of day for accurate comparison
    selectedDate.setHours(0, 0, 0, 0);
    twentyFourHoursFromNow.setHours(0, 0, 0, 0);
    thirtyDaysFromNow.setHours(0, 0, 0, 0);

    if (selectedDate < twentyFourHoursFromNow) {
      setDateValidationError("Date must be at least 24 hours from today");
    } else if (selectedDate > thirtyDaysFromNow) {
      setDateValidationError("Date cannot be more than 30 days from today");
    } else {
      setDateValidationError("");
    }
  };

  // Validate the entire form
  const validateForm = () => {
    const errors = {};

    if (!modifyFormData.date || modifyFormData.date.trim() === "") {
      errors.date = "Date is required";
    }

    if (!modifyFormData.time || modifyFormData.time.trim() === "") {
      errors.time = "Time slot is required";
    }

    if (dateValidationError) {
      errors.dateValidation = dateValidationError;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return (
      modifyFormData.date &&
      modifyFormData.date.trim() !== "" &&
      modifyFormData.time &&
      modifyFormData.time.trim() !== "" &&
      !dateValidationError
    );
  };

  // Get available time slots for modification
  const getAvailableTimeSlots = () => {
    return [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
    ];
  };

  // Show modify appointment modal
  const showModifyAppointment = (appointment) => {
    console.log("Opening modify modal for appointment:", appointment);
    console.log("Appointment ID:", appointment.id);
    console.log("Appointment doctorId:", appointment.doctorId);
    console.log("Appointment status:", appointment.status);
    console.log("Appointment structure:", JSON.stringify(appointment, null, 2));

    // Check if appointment can be modified based on status
    if (appointment.status === "cancelled") {
      setMessage("Cannot modify a cancelled appointment.");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    if (appointment.status === "completed") {
      setMessage("Cannot modify a completed appointment.");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    // Check if appointment has required fields - improved doctor ID resolution
    const doctorId =
      appointment.doctorId || appointment.doctor?._id || appointment.doctor?.id;
    if (!doctorId) {
      console.error("Doctor ID not found in appointment:", appointment);
      console.error("Available fields:", Object.keys(appointment));
      console.error("Doctor object:", appointment.doctor);
      setMessage(
        "Cannot modify appointment: Doctor information is missing. Please contact support."
      );
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 5000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    // Check if appointment can be modified based on time (24 hours before)
    if (!canModifyAppointment(appointment.appointmentDate)) {
      const appointmentDate = new Date(appointment.appointmentDate);
      const today = new Date();
      const hoursUntilAppointment = Math.floor(
        (appointmentDate - today) / (1000 * 60 * 60)
      );

      if (hoursUntilAppointment < 0) {
        setMessage(
          "Cannot modify appointment: The appointment time has already passed."
        );
      } else if (hoursUntilAppointment < 24) {
        setMessage(
          `Cannot modify appointment: It's less than 24 hours before the scheduled time (${hoursUntilAppointment} hours remaining).`
        );
      } else {
        setMessage(
          "Appointments can only be modified up to 24 hours before the scheduled date."
        );
      }

      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 8000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    setAppointmentToModify(appointment);
    setModifyFormData({
      date: appointment.appointmentDate,
      time: appointment.startTime || "",
      consultationMode: appointment.consultationMode || "in-person",
      symptoms: appointment.symptoms || "",
    });
    setDateValidationError(""); // Clear any previous validation errors
    setFormErrors({}); // Clear any previous form errors
    setShowModifyModal(true);
  };

  // Handle appointment modification
  const handleModifyAppointment = async () => {
    console.log("Starting appointment modification process...");
    console.log("Appointment to modify:", appointmentToModify);
    console.log("Modify form data:", modifyFormData);

    // Validate the entire form first
    if (!validateForm()) {
      setMessage("Please fix all validation errors before proceeding.");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    // Double-check that all required fields are filled
    if (!appointmentToModify) {
      setMessage("No appointment selected for modification.");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    // Validate appointment ID format
    if (!appointmentToModify.id || typeof appointmentToModify.id !== "string") {
      setMessage("Invalid appointment ID format.");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    // Check if appointment has required doctor information
    const doctorId =
      appointmentToModify.doctorId ||
      appointmentToModify.doctor?._id ||
      appointmentToModify.doctor?.id;
    if (!doctorId) {
      setMessage("Cannot modify appointment: Doctor information is missing.");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    if (!modifyFormData.date || modifyFormData.date.trim() === "") {
      setMessage("Please select an appointment date.");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    if (!modifyFormData.time || modifyFormData.time.trim() === "") {
      setMessage("Please select a time slot.");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    // Check for date validation errors
    if (dateValidationError) {
      setMessage("Please fix the date validation errors before proceeding.");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    // Additional validation: Check if selected date is at least 24 hours from today
    const selectedDate = new Date(modifyFormData.date);
    const today = new Date();
    const twentyFourHoursFromNow = new Date(today);
    twentyFourHoursFromNow.setHours(today.getHours() + 24);

    if (selectedDate < twentyFourHoursFromNow) {
      setMessage(
        "Appointments must be scheduled at least 24 hours in advance."
      );
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 5000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    // Additional validation: Check if selected date is not more than 30 days from today
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (selectedDate > thirtyDaysFromNow) {
      setMessage(
        "Appointments cannot be scheduled more than 30 days in advance."
      );
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 5000);
      timeoutRefs.current.push(timeoutId);
      return;
    }

    // If we reach here, all validations passed
    setModifyLoading(true);
    try {
      console.log(
        "Step 1: Cancelling existing appointment with ID:",
        appointmentToModify.id
      );
      console.log(
        "Appointment status before cancellation:",
        appointmentToModify.status
      );

      // Check if appointment is still in a modifiable state
      if (!["pending", "confirmed"].includes(appointmentToModify.status)) {
        throw new Error(
          `Cannot modify appointment with status: ${appointmentToModify.status}`
        );
      }

      // Verify appointment still exists in database
      try {
        const verifyResponse = await axios.get(
          `/api/appointments/${appointmentToModify.id}`
        );
        console.log(
          "Appointment verification successful:",
          verifyResponse.data
        );

        if (
          verifyResponse.data.appointment.status !== appointmentToModify.status
        ) {
          throw new Error(
            `Appointment status has changed from ${appointmentToModify.status} to ${verifyResponse.data.appointment.status}`
          );
        }

        // Check if appointment belongs to current user
        if (
          verifyResponse.data.appointment.patientId !==
          appointmentToModify.patientId
        ) {
          throw new Error("Appointment does not belong to current user");
        }
      } catch (verifyError) {
        console.error("Appointment verification failed:", verifyError);
        console.error(
          "Verification error response:",
          verifyError.response?.data
        );
        console.error(
          "Verification error status:",
          verifyError.response?.status
        );

        if (verifyError.response?.status === 404) {
          throw new Error("Appointment not found - it may have been deleted");
        } else if (verifyError.response?.status === 403) {
          throw new Error("Not authorized to modify this appointment");
        } else if (verifyError.response?.status === 500) {
          throw new Error("Failed to verify appointment status - server error");
        }

        // If it's not a critical error, we can proceed but log the warning
        console.warn(
          "Proceeding with modification despite verification warning:",
          verifyError.message
        );
      }

      // First, cancel the existing appointment
      let cancelResponse;
      try {
        console.log("Attempting to cancel appointment with data:", {
          appointmentId: appointmentToModify.id,
          reason: "Modified by patient",
        });

        cancelResponse = await axios.put(
          `/api/appointments/${appointmentToModify.id}/cancel`,
          {
            reason: "Modified by patient",
          }
        );
        console.log("Appointment cancelled successfully:", cancelResponse.data);
      } catch (cancelError) {
        console.error("Appointment cancellation failed:", cancelError);
        console.error(
          "Cancellation error response:",
          cancelError.response?.data
        );
        console.error(
          "Cancellation error status:",
          cancelError.response?.status
        );

        // If cancellation fails, try to get more details about why
        if (cancelError.response?.status === 400) {
          const errorDetail =
            cancelError.response?.data?.error || "Unknown cancellation error";
          throw new Error(`Appointment cancellation failed: ${errorDetail}`);
        } else if (cancelError.response?.status === 404) {
          throw new Error("Appointment not found during cancellation");
        } else if (cancelError.response?.status === 403) {
          throw new Error("Not authorized to cancel this appointment");
        } else if (cancelError.response?.status === 500) {
          const serverError =
            cancelError.response?.data?.error ||
            cancelError.response?.data?.message;
          throw new Error(
            `Appointment cancellation failed - server error: ${
              serverError || "Unknown server error"
            }`
          );
        } else {
          throw new Error(
            `Appointment cancellation failed: ${cancelError.message}`
          );
        }
      }

      // Wait a moment for the cancellation to be processed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a new appointment with the modified details using the direct endpoint
      const newAppointmentData = {
        doctorId:
          appointmentToModify.doctorId ||
          appointmentToModify.doctor?._id ||
          appointmentToModify.doctor?.id,
        appointmentDate: modifyFormData.date,
        startTime: modifyFormData.time,
        endTime: getEndTime(modifyFormData.time),
        consultationMode: modifyFormData.consultationMode,
        symptoms: modifyFormData.symptoms,
      };

      console.log(
        "Step 2: Creating new appointment with data:",
        newAppointmentData
      );
      console.log("Doctor ID resolved as:", newAppointmentData.doctorId);

      // Validate that we have a valid doctorId
      if (!newAppointmentData.doctorId) {
        throw new Error("Could not determine doctor ID from appointment data");
      }

      try {
        const createResponse = await axios.post(
          "/api/appointments/direct",
          newAppointmentData
        );
        console.log(
          "New appointment created successfully:",
          createResponse.data
        );
      } catch (createError) {
        console.error("New appointment creation failed:", createError);
        console.error("Creation error response:", createError.response?.data);
        console.error("Creation error status:", createError.response?.status);

        if (createError.response?.status === 400) {
          const errorDetail =
            createError.response?.data?.error || "Bad request";
          throw new Error(`Failed to create new appointment: ${errorDetail}`);
        } else if (createError.response?.status === 409) {
          throw new Error(
            "Time slot conflict - the selected time may not be available"
          );
        } else if (createError.response?.status === 500) {
          const serverError =
            createError.response?.data?.error ||
            createError.response?.data?.message;
          throw new Error(
            `Failed to create new appointment - server error: ${
              serverError || "Unknown server error"
            }`
          );
        } else {
          throw new Error(
            `Failed to create new appointment: ${createError.message}`
          );
        }
      }

      setMessage("Appointment modified successfully!");
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 3000);
      timeoutRefs.current.push(timeoutId);

      // Close modal and refresh appointments
      setShowModifyModal(false);
      setAppointmentToModify(null);
      setModifyFormData({
        date: "",
        time: "",
        consultationMode: "",
        symptoms: "",
      });
      setFormErrors({});
      fetchAppointments();
    } catch (error) {
      console.error("Error modifying appointment:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);
      console.error("Full error object:", error);

      let errorMessage = "Unknown error occurred";

      if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.error ||
          "Bad request - please check your input";
      } else if (error.response?.status === 404) {
        errorMessage = "Appointment not found - it may have been deleted";
      } else if (error.response?.status === 500) {
        // Provide more specific error information for server errors
        const serverError =
          error.response?.data?.error || error.response?.data?.message;
        if (serverError) {
          errorMessage = `Server error: ${serverError}`;
        } else {
          errorMessage =
            "Server error - please try again later. If the problem persists, contact support.";
        }
      } else if (error.response?.status === 403) {
        errorMessage = "Not authorized to modify this appointment";
      } else if (error.response?.status === 409) {
        errorMessage =
          "Appointment conflict - the selected time slot may not be available";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage("Error modifying appointment: " + errorMessage);
      const timeoutId = setTimeout(() => {
        setMessage("");
      }, 8000); // Show error longer for debugging
      timeoutRefs.current.push(timeoutId);
    } finally {
      setModifyLoading(false);
    }
  };

  // Get end time based on start time (30-minute slots)
  const getEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + 30, 0, 0);
    return endDate.toTimeString().slice(0, 5);
  };

  // Get minimum date for modification (24 hours from today)
  const getMinModifyDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setHours(today.getHours() + 24);
    return minDate.toISOString().split("T")[0];
  };

  // Get maximum date for modification (30 days from today)
  const getMaxModifyDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    return maxDate.toISOString().split("T")[0];
  };

  // Close modify modal
  const closeModifyModal = () => {
    setShowModifyModal(false);
    setAppointmentToModify(null);
    setModifyFormData({
      date: "",
      time: "",
      consultationMode: "",
      symptoms: "",
    });
    setDateValidationError(""); // Clear validation error
    setFormErrors({}); // Clear form errors
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ayurvedic-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            My Appointments
          </h1>

          {/* Status Filter */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setSelectedStatus("")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedStatus === ""
                  ? "bg-ayurvedic-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus("pending")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedStatus === "pending"
                  ? "bg-ayurvedic-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setSelectedStatus("confirmed")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedStatus === "confirmed"
                  ? "bg-ayurvedic-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setSelectedStatus("completed")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedStatus === "completed"
                  ? "bg-ayurvedic-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setSelectedStatus("cancelled")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedStatus === "cancelled"
                  ? "bg-ayurvedic-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Cancelled
            </button>
          </div>

          {message && (
            <div className="fixed bottom-4 left-4 z-50 p-3 rounded-md bg-blue-100 text-blue-700 flex items-center shadow-lg border border-blue-200 max-w-sm">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{message}</span>
            </div>
          )}
        </div>

        {/* Appointments List */}
        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(appointment.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.doctor?.name ||
                          "Doctor Name Not Available"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {appointment.doctor?.specialization ||
                          "Specialization Not Available"}
                      </p>
                      {/* Show modification availability indicator */}
                      {(appointment.status === "pending" ||
                        appointment.status === "confirmed") && (
                        <div className="flex items-center space-x-2 mt-1">
                          {canModifyAppointment(appointment.appointmentDate) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Modifiable
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⚠ Cannot Modify
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1)}
                  </span>
                </div>

                {/* Appointment Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">
                      {formatDate(appointment.appointmentDate)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">
                      {appointment.startTime && appointment.endTime
                        ? `${appointment.startTime} - ${appointment.endTime}`
                        : appointment.time || "Time not specified"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {appointment.consultationMode === "online" ? (
                      <Video className="w-5 h-5 text-gray-500" />
                    ) : (
                      <MapPin className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="text-gray-700 capitalize">
                      {appointment.consultationMode}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-ayurvedic-500">
                      ₹
                      {appointment.consultationFee ||
                        appointment.doctor?.consultationFee ||
                        "Fee not specified"}
                    </span>
                  </div>
                </div>

                {/* Symptoms */}
                {appointment.symptoms && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Symptoms:
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {appointment.symptoms}
                    </p>
                  </div>
                )}

                {/* Rating */}
                {appointment.rating && appointment.rating.stars && (
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-sm text-gray-700">Your rating:</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= appointment.rating.stars
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {appointment.rating.comment && (
                      <span className="text-sm text-gray-600 ml-2">
                        "{appointment.rating.comment}"
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col space-y-2 mt-4">
                  {/* Cancel button for pending and confirmed appointments */}
                  {(appointment.status === "pending" ||
                    appointment.status === "confirmed") && (
                    <button
                      onClick={() => showCancelConfirmation(appointment)}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors duration-200"
                    >
                      Cancel Appointment
                    </button>
                  )}

                  {/* Modify button for pending and confirmed appointments (up to 24 hours before) */}
                  {(appointment.status === "pending" ||
                    appointment.status === "confirmed") &&
                    canModifyAppointment(appointment.appointmentDate) && (
                      <button
                        onClick={() => showModifyAppointment(appointment)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors duration-200"
                      >
                        Modify Appointment
                      </button>
                    )}

                  {/* Show note when modification is not allowed */}
                  {(appointment.status === "pending" ||
                    appointment.status === "confirmed") &&
                    !canModifyAppointment(appointment.appointmentDate) && (
                      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-md border border-gray-200">
                        Cannot modify (within 24 hours)
                      </div>
                    )}

                  {/* Cancel button for confirmed appointments (existing logic) */}
                  {appointment.canBeCancelled &&
                    appointment.status === "confirmed" && (
                      <button
                        onClick={() => showCancelConfirmation(appointment)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                      >
                        Cancel
                      </button>
                    )}

                  {appointment.status === "completed" &&
                    !appointment.rating && (
                      <button
                        onClick={() => {
                          // TODO: Implement rating modal
                          alert("Rating functionality coming soon!");
                        }}
                        className="px-4 py-2 text-sm font-medium text-ayurvedic-600 bg-ayurvedic-100 rounded-md hover:bg-ayurvedic-200"
                      >
                        Rate
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-600">
              {selectedStatus
                ? `You don't have any ${selectedStatus} appointments.`
                : "You don't have any appointments yet. Book your first consultation with our Ayurvedic doctors!"}
            </p>
            {!selectedStatus && (
              <button
                onClick={() => (window.location.href = "/doctors")}
                className="mt-4 btn-primary"
              >
                Find Doctors
              </button>
            )}
          </div>
        )}

        {showCancelConfirm && appointmentToCancel && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-8 border w-96 shadow-lg rounded-md bg-white">
              <div className="text-center">
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Confirm Cancellation
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to cancel this appointment? This
                    action cannot be undone.
                  </p>

                  {/* Appointment Details */}
                  <div className="mt-4 text-left bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-600 font-medium">
                      Appointment Details:
                    </p>
                    <p className="text-sm text-gray-800">
                      {appointmentToCancel.doctor?.name ||
                        "Doctor Name Not Available"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDate(appointmentToCancel.appointmentDate)} •{" "}
                      {appointmentToCancel.startTime &&
                      appointmentToCancel.endTime
                        ? `${appointmentToCancel.startTime} - ${appointmentToCancel.endTime}`
                        : "Time not specified"}
                    </p>
                  </div>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={confirmCancellation}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Cancel Appointment
                  </button>
                  <button
                    onClick={closeCancelConfirmation}
                    className="mt-3 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    No, Keep Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modify Appointment Modal */}
        {showModifyModal && appointmentToModify && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
              {/* Modal Header */}
              <div className="text-center mb-6">
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-lg border-2 border-blue-200 shadow-lg">
                  <h3
                    className="text-2xl font-extrabold text-gray-900"
                    style={{
                      color: "#111827 !important",
                      fontWeight: "800",
                      textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      WebkitTextFillColor: "#111827",
                      filter: "contrast(1.3)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Modify Appointment
                  </h3>
                </div>
                {/* Fallback title for maximum visibility */}
                <div className="mt-2">
                  <span className="text-lg font-bold text-black bg-yellow-200 px-3 py-1 rounded border-2 border-black">
                    MODIFY APPOINTMENT
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="text-left space-y-4">
                {/* Doctor Info */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600 font-medium">Doctor:</p>
                  <p className="text-sm text-gray-800">
                    {appointmentToModify.doctor?.name ||
                      "Doctor Name Not Available"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {appointmentToModify.doctor?.specialization ||
                      "Specialization Not Available"}
                  </p>
                </div>

                {/* Validation Errors Summary */}
                {Object.keys(formErrors).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      Please fix the following errors:
                    </p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {Object.values(formErrors).map((error, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={modifyFormData.date}
                    onChange={(e) => {
                      setModifyFormData({
                        ...modifyFormData,
                        date: e.target.value,
                      });
                      validateSelectedDate(e.target.value);
                    }}
                    min={getMinModifyDate()}
                    max={getMaxModifyDate()}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !modifyFormData.date
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {!modifyFormData.date && (
                    <p className="text-xs text-red-500 mt-1">
                      Date is required
                    </p>
                  )}
                  {dateValidationError && (
                    <p className="text-xs text-red-500 mt-1">
                      {dateValidationError}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Valid range: {getMinModifyDate()} to {getMaxModifyDate()}
                  </p>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modifyFormData.time}
                    onChange={(e) =>
                      setModifyFormData({
                        ...modifyFormData,
                        time: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !modifyFormData.time
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Select a time slot</option>
                    {getAvailableTimeSlots().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {!modifyFormData.time && (
                    <p className="text-xs text-red-500 mt-1">
                      Time slot is required
                    </p>
                  )}
                </div>

                {/* Consultation Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setModifyFormData({
                          ...modifyFormData,
                          consultationMode: "in-person",
                        })
                      }
                      className={`p-2 rounded-md border-2 text-sm ${
                        modifyFormData.consultationMode === "in-person"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      In-Person
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setModifyFormData({
                          ...modifyFormData,
                          consultationMode: "online",
                        })
                      }
                      className={`p-2 rounded-md border-2 text-sm ${
                        modifyFormData.consultationMode === "online"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      Online
                    </button>
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms (Optional)
                  </label>
                  <textarea
                    value={modifyFormData.symptoms}
                    onChange={(e) =>
                      setModifyFormData({
                        ...modifyFormData,
                        symptoms: e.target.value,
                      })
                    }
                    placeholder="Describe your symptoms or reason for consultation..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {modifyFormData.symptoms.length}/500 characters
                  </p>
                </div>

                {/* Note about modification */}
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> Modifying an appointment will cancel
                    the current one and create a new one. You can only modify
                    appointments up to 24 hours before the scheduled date. The
                    new appointment must be at least 24 hours from today and
                    cannot be more than 30 days in advance.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModifyModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-base font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                  style={{ textShadow: "0 1px 1px rgba(0,0,0,0.05)" }}
                >
                  <span className="font-semibold">Cancel</span>
                </button>
                <button
                  onClick={handleModifyAppointment}
                  disabled={modifyLoading || !isFormValid()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-base font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-600 transition-colors duration-200"
                  style={{
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    color: "white !important",
                    fontWeight: "600",
                    letterSpacing: "0.025em",
                    WebkitTextFillColor: "white",
                    filter: "contrast(1.2)",
                    border: "2px solid #1d4ed8",
                    backgroundColor: "#2563eb",
                  }}
                >
                  {modifyLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span
                        className="font-semibold"
                        style={{
                          color: "white !important",
                          WebkitTextFillColor: "white",
                          filter: "contrast(1.2)",
                        }}
                      >
                        Modifying...
                      </span>
                    </div>
                  ) : (
                    <span
                      className="font-semibold"
                      style={{
                        color: "white !important",
                        WebkitTextFillColor: "white",
                        filter: "contrast(1.2)",
                      }}
                    >
                      Modify Appointment
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          // </div>
        )}
      </div>
    </>
  );
};

export default Appointments;
