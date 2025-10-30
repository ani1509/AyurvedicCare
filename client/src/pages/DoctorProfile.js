import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  User,
  Calendar,
  Star,
  MapPin,
  Video,
  Edit,
  Save,
  X,
} from "lucide-react";
import SlotManager from "../components/SlotManager";

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    specialization: "",
    experience: "",
    consultationFee: "",
    consultationDuration: "",
    languages: "",
    consultationModes: [],
  });

  const fetchDoctorProfile = useCallback(async () => {
    try {
      const response = await axios.get("/api/doctors/profile");
      setDoctor(response.data.doctor);
      setFormData({
        specialization: response.data.doctor.specialization || "",
        experience: response.data.doctor.experience || "",
        consultationFee: response.data.doctor.consultationFee || "",
        consultationDuration: response.data.doctor.consultationDuration || "",
        languages: response.data.doctor.languages?.join(", ") || "",
        consultationModes: response.data.doctor.consultationModes || [],
      });
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
      setMessage("Error loading profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctorProfile();
  }, [fetchDoctorProfile]);

  const handleSave = async () => {
    try {
      const updateData = {
        ...formData,
        languages: formData.languages
          .split(",")
          .map((lang) => lang.trim())
          .filter((lang) => lang),
      };

      await axios.put("/api/doctors/profile", updateData);
      setMessage("Profile updated successfully!");
      setEditing(false);
      fetchDoctorProfile(); // Refresh the profile
    } catch (error) {
      setMessage(
        "Error updating profile: " + error.response?.data?.error ||
          error.message
      );
    }
  };

  const handleCancel = () => {
    setEditing(false);
    fetchDoctorProfile(); // Reset form data
  };

  const toggleConsultationMode = (mode) => {
    setFormData((prev) => ({
      ...prev,
      consultationModes: prev.consultationModes.includes(mode)
        ? prev.consultationModes.filter((m) => m !== mode)
        : [...prev.consultationModes, mode],
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ayurvedic-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Doctor Profile Not Found
          </h1>
          <p className="text-gray-600">
            You need to register as a doctor first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Profile</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="fixed bottom-4 left-4 z-50 p-3 rounded-md bg-blue-100 text-blue-700 shadow-lg border border-blue-200 max-w-sm">
          <span className="text-sm">{message}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Basic Information
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={doctor.name || "Not set"}
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={doctor.email || "Not set"}
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="Enter specialization"
                  />
                ) : (
                  <input
                    type="text"
                    value={doctor.specialization || "Not set"}
                    disabled
                    className="input-field bg-gray-50"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (years)
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                    className="input-field"
                    placeholder="Enter experience"
                    min="0"
                  />
                ) : (
                  <input
                    type="text"
                    value={
                      doctor.experience
                        ? `${doctor.experience} years`
                        : "Not set"
                    }
                    disabled
                    className="input-field bg-gray-50"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee (₹)
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consultationFee: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="Enter consultation fee"
                    min="0"
                  />
                ) : (
                  <input
                    type="text"
                    value={
                      doctor.consultationFee
                        ? `₹${doctor.consultationFee}`
                        : "Not set"
                    }
                    disabled
                    className="input-field bg-gray-50"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Duration (minutes)
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.consultationDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consultationDuration: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="Enter duration"
                    min="15"
                    step="15"
                  />
                ) : (
                  <input
                    type="text"
                    value={
                      doctor.consultationDuration
                        ? `${doctor.consultationDuration} minutes`
                        : "Not set"
                    }
                    disabled
                    className="input-field bg-gray-50"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Consultation Modes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Consultation Modes
            </h2>

            {editing ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="in-person"
                    checked={formData.consultationModes.includes("in-person")}
                    onChange={() => toggleConsultationMode("in-person")}
                    className="w-4 h-4 text-ayurvedic-500 border-gray-300 rounded focus:ring-ayurvedic-500"
                  />
                  <label
                    htmlFor="in-person"
                    className="flex items-center text-gray-700"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    In-person Consultation
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="online"
                    checked={formData.consultationModes.includes("online")}
                    onChange={() => toggleConsultationMode("online")}
                    className="w-4 h-4 text-ayurvedic-500 border-gray-300 rounded focus:ring-ayurvedic-500"
                  />
                  <label
                    htmlFor="online"
                    className="flex items-center text-gray-700"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Online Consultation
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                {doctor.consultationModes?.map((mode) => (
                  <span
                    key={mode}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-ayurvedic-100 text-ayurvedic-800"
                  >
                    {mode === "online" ? (
                      <Video className="w-4 h-4 mr-1" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-1" />
                    )}
                    {mode}
                  </span>
                )) || "Not set"}
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Languages
            </h2>

            {editing ? (
              <input
                type="text"
                value={formData.languages}
                onChange={(e) =>
                  setFormData({ ...formData, languages: e.target.value })
                }
                className="input-field"
                placeholder="Enter languages (comma-separated)"
              />
            ) : (
              <p className="text-gray-700">
                {doctor.languages?.join(", ") || "Not set"}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Statistics
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rating</span>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium">
                    {doctor.rating?.average?.toFixed(1) || "N/A"} (
                    {doctor.rating?.count || 0})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Consultations</span>
                <span className="font-medium">
                  {doctor.totalConsultations || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doctor.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {doctor.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>

            <div className="space-y-2">
              <button
                onClick={() =>
                  document
                    .getElementById("slot-manager")
                    .scrollIntoView({ behavior: "smooth" })
                }
                className="w-full btn-secondary flex items-center justify-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Manage Slots
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slot Management Section */}
      <div id="slot-manager" className="mt-8">
        <SlotManager doctorId={doctor._id} />
      </div>
    </div>
  );
};

export default DoctorProfile;
