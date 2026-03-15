import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AppointmentBooking = ({ doctor, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [consultationMode, setConsultationMode] = useState("in-person");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: select slot, 2: confirm booking
  const [message, setMessage] = useState("");
  // we only need the setter for tracking which months were shown
  const setShownMonths = useState(new Set())[1];
  const [slotsLoading, setSlotsLoading] = useState(false);

  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDate || !consultationMode) return;

    // Check if user is authenticated
    if (!user) {
      console.log("User not authenticated, cannot fetch slots");
      setMessage("Please log in to book appointments");
      setAvailableSlots([]);
      return;
    }

    setSlotsLoading(true);
    console.log("Fetching slots for:", {
      selectedDate,
      consultationMode,
      doctorId: doctor._id,
      userId: user._id,
    });

    // First check if server is running
    try {
      const healthCheck = await axios.get("/api/health");
      console.log("Server health check:", healthCheck.data);
    } catch (healthError) {
      console.error("Server health check failed:", healthError);
      setMessage("Server is not accessible. Please try again later.");
      setAvailableSlots([]);
      setSlotsLoading(false);
      return;
    }

    try {
      // First, try to get existing slots
      console.log("Trying to fetch existing slots...");
      const response = await axios.get(
        `/api/slots/doctor/${doctor._id}?date=${selectedDate}&consultationMode=${consultationMode}`
      );
      console.log("Existing slots response:", response.data);

      if (response.data.slots && response.data.slots.length > 0) {
        // Slots exist, use them
        console.log("Using existing slots:", response.data.slots);
        console.log("First slot structure:", response.data.slots[0]);
        console.log("First slot ID field:", response.data.slots[0].id);
        console.log("First slot _id field:", response.data.slots[0]._id);
        setAvailableSlots(response.data.slots);
      } else {
        // No slots exist, generate them automatically
        console.log("No slots found, generating new slots...");
        const generateResponse = await axios.post(
          "/api/slots/generate-for-patient",
          {
            doctorId: doctor._id,
            date: selectedDate,
            consultationMode,
          }
        );
        console.log("Generated slots response:", generateResponse.data);

        if (
          generateResponse.data.slots &&
          generateResponse.data.slots.length > 0
        ) {
          console.log("Using generated slots:", generateResponse.data.slots);
          console.log(
            "First generated slot structure:",
            generateResponse.data.slots[0]
          );
          console.log(
            "First generated slot ID field:",
            generateResponse.data.slots[0].id
          );
          console.log(
            "First generated slot _id field:",
            generateResponse.data.slots[0]._id
          );
          setAvailableSlots(generateResponse.data.slots);
        } else {
          console.log("No slots generated");
          setAvailableSlots([]);
        }
      }
    } catch (error) {
      console.error("Error fetching/generating slots:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        setMessage("Authentication error. Please log in again.");
        return;
      }

      // If getting slots failed, try to generate them
      try {
        console.log("Trying to generate slots as fallback...");
        const generateResponse = await axios.post(
          "/api/slots/generate-for-patient",
          {
            doctorId: doctor._id,
            date: selectedDate,
            consultationMode,
          }
        );

        if (
          generateResponse.data.slots &&
          generateResponse.data.slots.length > 0
        ) {
          console.log("Fallback slots generated:", generateResponse.data.slots);
          setAvailableSlots(generateResponse.data.slots);
        } else {
          console.log("Fallback failed - no slots generated");
          setMessage("Error generating available slots");
          setAvailableSlots([]);
        }
      } catch (generateError) {
        console.error("Error generating slots:", generateError);
        console.error("Generate error details:", {
          message: generateError.message,
          response: generateError.response?.data,
          status: generateError.response?.status,
        });

        // Check if it's an authentication error
        if (generateError.response?.status === 401) {
          setMessage("Authentication error. Please log in again.");
        } else {
          setMessage("Error fetching available slots");
        }
        setAvailableSlots([]);
      }
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, consultationMode, doctor._id, user]);

  useEffect(() => {
    if (selectedDate && consultationMode) {
      fetchAvailableSlots();
    }
  }, [selectedDate, consultationMode, fetchAvailableSlots]);

  // Reset shown months when consultation mode changes
  useEffect(() => {
    setShownMonths(new Set());

    // Cleanup function
    return () => {
      setShownMonths(new Set());
    };
  }, [consultationMode, setShownMonths]);

  const handleSlotSelect = (slot) => {
    console.log("Slot selected:", slot);
    console.log("Slot ID (id):", slot.id);
    console.log("Slot ID (_id):", slot._id);
    console.log("Slot data structure:", JSON.stringify(slot, null, 2));

    // Ensure we have the correct ID field
    const slotWithId = {
      ...slot,
      id: slot._id || slot.id, // Use _id if id doesn't exist
    };

    console.log("Slot with corrected ID:", slotWithId);
    setSelectedSlot(slotWithId);
    setStep(2);
  };

  const handleLockSlot = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    setMessage(""); // Clear any previous messages

    console.log("Starting slot booking process for slot:", selectedSlot);

    try {
      // Step 1: Lock the slot using real API
      console.log("Step 1: Locking slot with ID:", selectedSlot.id);
      const lockResponse = await axios.post("/api/slots/lock", {
        slotId: selectedSlot.id,
      });
      console.log("Slot locked successfully:", lockResponse.data);

      setMessage("Slot locked successfully! Now booking the slot...");

      // Step 2: Book the locked slot
      console.log("Step 2: Booking locked slot with ID:", selectedSlot.id);
      const bookResponse = await axios.post("/api/slots/book-simple", {
        slotId: selectedSlot.id,
      });
      console.log("Slot booked successfully:", bookResponse.data);

      setMessage("Slot booked successfully! Creating appointment...");

      // Add a small delay to ensure slot status is properly updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: Proceed to create appointment
      console.log("Step 3: Creating appointment for slot ID:", selectedSlot.id);
      await createAppointment();
    } catch (error) {
      console.error("Error in slot booking process:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Unknown error occurred";
      setMessage("Error in slot booking process: " + errorMessage);
      setLoading(false);
    }
  };

  const createAppointment = async () => {
    try {
      console.log("Creating appointment with data:", {
        slotId: selectedSlot.id,
        symptoms,
      });

      // Create appointment using real API
      const appointmentResponse = await axios.post("/api/appointments", {
        slotId: selectedSlot.id,
        symptoms,
      });

      console.log(
        "Appointment created successfully:",
        appointmentResponse.data
      );

      // Success - appointment created in MongoDB
      setMessage("Appointment booked successfully! Redirecting...");
      setTimeout(() => {
        // Call onSuccess before closing
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating appointment:", error);
      console.error(
        "Appointment creation error response:",
        error.response?.data
      );
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Unknown error occurred";
      setMessage("Error creating appointment: " + errorMessage);
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedSlot(null);
    } else {
      onClose();
    }
  };

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();

    // Get dates for the next 30 days (approximately one month)
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const handleDateSelect = (dateString) => {
    setSelectedDate(dateString);
    setMessage(""); // Clear any previous messages
    setSelectedSlot(null); // Reset slot selection when date changes
  };

  // Helper calendars removed: getProperWeeklyCalendar & getCalendarWithMonthBreaks
  // (kept `getCleanMonthSeparatedCalendar` which is used by the component)

  const getCleanMonthSeparatedCalendar = () => {
    const dates = getNextAvailableDates();
    const calendarWeeks = [];
    let currentWeek = [];
    let currentMonth = null;

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const dateMonth = date.getMonth();
      const dateYear = date.getFullYear();
      const monthKey = `${dateMonth}-${dateYear}`;

      // If we're starting a new month, force a new week
      if (currentMonth !== null && currentMonth !== monthKey) {
        // Complete the current week even if it's incomplete
        if (currentWeek.length > 0) {
          // Pad the week to 7 days
          while (currentWeek.length < 7) {
            currentWeek.push(null);
          }
          calendarWeeks.push({
            week: currentWeek,
            month: currentMonth,
            isNewMonth: false,
          });
        }

        // Start completely fresh for the new month
        currentWeek = [];
        currentMonth = monthKey;
      } else if (currentMonth === null) {
        // First month
        currentMonth = monthKey;
      }

      // Add date to current week
      currentWeek.push(date);

      // If week is full (7 days), start a new week
      if (currentWeek.length === 7) {
        calendarWeeks.push({
          week: currentWeek,
          month: monthKey,
          isNewMonth: false,
        });
        currentWeek = [];
      }
    }

    // Add the last week if it has dates
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      calendarWeeks.push({
        week: currentWeek,
        month: currentMonth,
        isNewMonth: false,
      });
    }

    return calendarWeeks;
  };

  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Book Appointment
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Authentication Check */}
            {!user ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Authentication Required
                </h3>
                <p className="text-gray-600 mb-4">
                  You need to be logged in to book appointments. Please log in
                  or register first.
                </p>
                <button
                  onClick={() => (window.location.href = "/login")}
                  className="btn-primary"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                {/* Doctor Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {doctor.name || `${doctor.specialization} Specialist`}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {doctor.specialization} Specialist
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-ayurvedic-500 font-semibold">
                      ₹{doctor.consultationFee}
                    </span>
                    <span className="text-sm text-gray-500">
                      30 min consultation
                    </span>
                  </div>
                </div>

                {message && (
                  <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {message}
                  </div>
                )}

                {/* Consultation Mode Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Consultation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConsultationMode("in-person")}
                      className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 ${
                        consultationMode === "in-person"
                          ? "border-ayurvedic-500 bg-ayurvedic-50 text-ayurvedic-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                      <span>In-person</span>
                    </button>
                    <button
                      onClick={() => setConsultationMode("online")}
                      className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 ${
                        consultationMode === "online"
                          ? "border-ayurvedic-500 bg-ayurvedic-500 text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      <span>Online</span>
                    </button>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Date
                  </label>

                  {/* Date Grid */}
                  <div className="space-y-2">
                    {/* Calendar Weeks */}
                    {getCleanMonthSeparatedCalendar().map(
                      (weekData, weekIndex) => {
                        const { week } = weekData;

                        // Check if this week needs a month header
                        let monthHeader = null;

                        if (week.some((date) => date)) {
                          // Get the first valid date in this week
                          const firstDateInWeek = week.find((date) => date);

                          if (firstDateInWeek) {
                            const currentWeekMonth = firstDateInWeek.getMonth();

                            // Check if previous week exists and has a different month
                            const calendarWeeks =
                              getCleanMonthSeparatedCalendar();
                            const previousWeek =
                              weekIndex > 0
                                ? calendarWeeks[weekIndex - 1]
                                : null;

                            let showMonthHeader = weekIndex === 0; // Always show for first week

                            if (previousWeek && previousWeek.week) {
                              const previousWeekFirstDate =
                                previousWeek.week.find((date) => date);
                              if (previousWeekFirstDate) {
                                const previousWeekMonth =
                                  previousWeekFirstDate.getMonth();
                                // Show header if month changed from previous week
                                if (currentWeekMonth !== previousWeekMonth) {
                                  showMonthHeader = true;
                                }
                              }
                            }

                            if (showMonthHeader) {
                              monthHeader = (
                                <div className="col-span-7 text-center py-2">
                                  <h5 className="text-md font-medium text-gray-700">
                                    {firstDateInWeek.toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "long",
                                        year: "numeric",
                                      }
                                    )}
                                  </h5>
                                </div>
                              );
                            }
                          }
                        }

                        return (
                          <div key={weekIndex}>
                            {monthHeader}
                            <div className="grid grid-cols-7 gap-2">
                              {week.map((date, dayIndex) => {
                                if (!date) {
                                  return <div key={dayIndex} className="p-3" />; // Empty space
                                }

                                const dayName = date.toLocaleDateString(
                                  "en-US",
                                  { weekday: "short" }
                                );
                                const dayNumber = date.getDate();
                                const isToday =
                                  new Date().toDateString() ===
                                  date.toDateString();
                                const dateString = date
                                  .toISOString()
                                  .split("T")[0];
                                const isSunday = date.getDay() === 0;
                                // const isFirstOfMonth = date.getDate() === 1; // unused

                                return (
                                  <button
                                    key={dayIndex}
                                    onClick={() =>
                                      !isSunday && handleDateSelect(dateString)
                                    }
                                    disabled={isSunday}
                                    className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                                      isSunday
                                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : selectedDate === dateString
                                        ? "border-ayurvedic-500 bg-ayurvedic-500 text-white shadow-lg"
                                        : isToday
                                        ? "border-ayurvedic-300 bg-ayurvedic-50 text-ayurvedic-700 hover:border-ayurvedic-400 hover:bg-ayurvedic-100"
                                        : "border-gray-300 hover:border-ayurvedic-400 hover:bg-ayurvedic-50 hover:shadow-md"
                                    }`}
                                    title={
                                      isSunday
                                        ? "Sundays are holidays - no appointments available"
                                        : ""
                                    }
                                  >
                                    <div className="text-xs font-medium">
                                      {dayName}
                                    </div>
                                    <div className="text-lg font-bold">
                                      {dayNumber}
                                    </div>
                                    {isToday && !isSunday && (
                                      <div className="text-xs text-ayurvedic-600 font-medium">
                                        Today
                                      </div>
                                    )}
                                    {isSunday && (
                                      <div className="text-xs text-gray-400 font-medium">
                                        Holiday
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            {monthHeader &&
                              weekIndex <
                                getCleanMonthSeparatedCalendar().length - 1 && (
                                <div className="my-3 border-t border-gray-200"></div>
                              )}
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Sunday Info Box */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-700 font-medium">
                        Sunday Information
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      All Sundays are marked as holidays. You cannot book
                      appointments on Sundays. Please select any other day from
                      Monday to Saturday.
                    </p>
                  </div>

                  {/* Selected Date Display */}
                  {selectedDate && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-700 font-medium">
                          Selected Date
                        </span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        {new Date(selectedDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}

                  {/* Available Time Slots */}
                  {selectedDate && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Available Time Slots
                      </h4>

                      {slotsLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ayurvedic-500 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">
                            Loading available slots...
                          </p>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {availableSlots.map((slot) => {
                            console.log("Rendering slot:", slot);
                            return (
                              <button
                                key={slot._id || slot.id}
                                onClick={() => handleSlotSelect(slot)}
                                className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                                  selectedSlot &&
                                  (selectedSlot.id === slot.id ||
                                    selectedSlot.id === slot._id)
                                    ? "border-ayurvedic-500 bg-ayurvedic-500 text-white"
                                    : "border-gray-300 hover:border-ayurvedic-400 hover:bg-ayurvedic-50"
                                }`}
                              >
                                <div className="font-medium">
                                  {slot.startTime}
                                </div>
                                <div className="text-sm opacity-75">
                                  to {slot.endTime}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">
                            No available slots for this date and consultation
                            mode.
                          </p>
                          <p className="text-xs mt-1">
                            Try selecting a different date or consultation mode.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button onClick={onClose} className="btn-secondary">
                    Cancel
                  </button>
                  {selectedDate && selectedSlot && (
                    <button onClick={() => setStep(2)} className="btn-primary">
                      Continue to Booking
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Confirm Booking
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Confirm Appointment
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {message && (
            <div className="mb-4 p-3 rounded-md bg-green-100 text-green-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {message}
            </div>
          )}

          {/* Appointment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Appointment Details
            </h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {consultationMode === "online" ? (
                  <Video className="w-5 h-5 text-gray-500" />
                ) : (
                  <MapPin className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-gray-700 capitalize">
                  {consultationMode} consultation
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">₹{doctor.consultationFee}</span>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symptoms (Optional)
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe your symptoms or reason for consultation..."
              rows={3}
              className="input-field w-full"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {symptoms.length}/500 characters
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={goBack}
              className="btn-secondary"
              disabled={loading}
            >
              Back
            </button>
            <button
              onClick={handleLockSlot}
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Confirm & Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
