import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";

const SlotManager = ({ doctorId }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    startTime: "09:00",
    endTime: "09:30",
    consultationMode: "in-person",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const timeSlots = [
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
    "18:00",
    "18:30",
  ];

  const fetchSlots = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/slots/doctor/${doctorId}?date=${selectedDate}`
      );
      setSlots(response.data.slots);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  }, [doctorId, selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate, fetchSlots]);

  const handleAddSlot = async () => {
    if (!selectedDate || !newSlot.startTime || !newSlot.endTime) {
      setMessage("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/slots/create", {
        doctorId,
        date: selectedDate,
        slots: [newSlot],
        consultationMode: newSlot.consultationMode,
      });

      setMessage("Slot created successfully!");
      setNewSlot({
        startTime: "09:00",
        endTime: "09:30",
        consultationMode: "in-person",
      });
      fetchSlots();
    } catch (error) {
      setMessage(
        "Error creating slot: " + error.response?.data?.error || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (window.confirm("Are you sure you want to delete this slot?")) {
      try {
        await axios.delete(`/api/slots/${slotId}`);
        setMessage("Slot deleted successfully!");
        fetchSlots();
      } catch (error) {
        setMessage(
          "Error deleting slot: " + error.response?.data?.error || error.message
        );
      }
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        Manage Time Slots
      </h3>

      {message && (
        <div
          className={`fixed bottom-4 left-4 z-50 p-3 rounded-md shadow-lg border max-w-sm ${
            message.includes("Error")
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-green-100 text-green-700 border-green-200"
          }`}
        >
          <span className="text-sm">{message}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Add New Slot */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Add New Slot</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="input-field w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <select
                value={newSlot.startTime}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, startTime: e.target.value })
                }
                className="input-field w-full"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <select
                value={newSlot.endTime}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, endTime: e.target.value })
                }
                className="input-field w-full"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consultation Mode
            </label>
            <select
              value={newSlot.consultationMode}
              onChange={(e) =>
                setNewSlot({ ...newSlot, consultationMode: e.target.value })
              }
              className="input-field w-full"
            >
              <option value="in-person">In-person</option>
              <option value="online">Online</option>
            </select>
          </div>

          <button
            onClick={handleAddSlot}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Slot
          </button>
        </div>

        {/* Existing Slots */}
        <div>
          <h4 className="font-medium text-gray-700 mb-4">
            Existing Slots for {selectedDate}
          </h4>

          {selectedDate ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {slots.length > 0 ? (
                slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          slot.consultationMode === "online"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {slot.consultationMode}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  No slots available for this date
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Select a date to view slots</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlotManager;
