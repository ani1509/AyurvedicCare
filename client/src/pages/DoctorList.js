import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Search, Star, MapPin, Clock, Video, User } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import AppointmentBooking from "../components/AppointmentBooking";

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialization: "",
    consultationMode: "",
    city: "",
    minRating: "",
    maxFee: "",
    sortBy: "rating",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDoctors: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const specializations = [
    "General Ayurveda",
    "Panchakarma",
    "Rasayana",
    "Kayachikitsa",
    "Shalya Tantra",
    "Shalakya Tantra",
    "Prasuti Tantra",
    "Kaumara Bhritya",
    "Agada Tantra",
    "Vajikarana",
  ];

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchDoctors = useCallback(async (page = 1, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Only include non-empty filter values
      const activeFilters = {};
      Object.keys(filtersRef.current).forEach((key) => {
        if (filtersRef.current[key] && filtersRef.current[key] !== "") {
          activeFilters[key] = filtersRef.current[key];
        }
      });

      const params = new URLSearchParams({
        page,
        limit: 9,
        ...activeFilters,
      });

      console.log("Fetching doctors with params:", params.toString());
      const response = await axios.get(`/api/doctors?${params}`);
      console.log("Received response:", response.data);

      console.log("Setting doctors:", response.data.doctors);
      console.log("Setting pagination:", response.data.pagination);
      setDoctors(response.data.doctors);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load of all doctors
  useEffect(() => {
    fetchDoctors(1, true); // Show loading for initial load
  }, [fetchDoctors]);

  // Auto-apply filters for dropdowns immediately
  useEffect(() => {
    // Only fetch when we have actual filter values, not empty strings
    const hasActiveFilters = Object.values(filters).some(
      (value) => value && value !== ""
    );
    if (hasActiveFilters) {
      fetchDoctors(1, false);
    }
  }, [filters, fetchDoctors]);

  // Separate debounced effect for city filter
  useEffect(() => {
    if (filters.city !== "") {
      const timer = setTimeout(() => {
        fetchDoctors(1, false);
      }, 800); // Longer delay for city typing

      return () => clearTimeout(timer);
    }
  }, [filters.city, fetchDoctors]);

  // State to track if city filter is being processed (removed unused variables)

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Debounced city filter to prevent excessive API calls
  const handleCityChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      city: value,
    }));
  };

  const handlePageChange = (page) => {
    fetchDoctors(page, false);
  };

  const clearFilters = () => {
    setFilters({
      specialization: "",
      consultationMode: "",
      city: "",
      minRating: "",
      maxFee: "",
      sortBy: "rating",
      sortOrder: "desc",
    });
    // Fetch all doctors when filters are cleared
    setTimeout(() => {
      fetchDoctors(1, false);
    }, 100);
  };

  // Don't show full page loading for filter changes
  if (loading && doctors.length === 0) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Ayurvedic Doctors
        </h1>
        <p className="text-gray-600">
          Connect with qualified Ayurvedic practitioners for personalized
          consultations
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Specialization */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <select
              value={filters.specialization}
              onChange={(e) =>
                handleFilterChange("specialization", e.target.value)
              }
              className="input-field"
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Consultation Mode */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consultation Mode
            </label>
            <select
              value={filters.consultationMode}
              onChange={(e) =>
                handleFilterChange("consultationMode", e.target.value)
              }
              className="input-field"
            >
              <option value="">All Modes</option>
              <option value="online">Online</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>

          {/* City */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleCityChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                placeholder="Enter city"
                className="input-field pr-8"
              />
              {filters.city && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-ayurvedic-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Min Rating */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Rating
            </label>
            <select
              value={filters.minRating}
              onChange={(e) => handleFilterChange("minRating", e.target.value)}
              className="input-field"
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>

          {/* Max Fee */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Fee (₹)
            </label>
            <input
              type="number"
              value={filters.maxFee}
              onChange={(e) => handleFilterChange("maxFee", e.target.value)}
              placeholder="Max fee"
              className="input-field"
            />
          </div>

          {/* Sort By */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="input-field"
            >
              <option value="rating">Rating</option>
              <option value="experience">Experience</option>
              <option value="consultationFee">Fee</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex-1 min-w-[100px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              className="input-field"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button onClick={clearFilters} className="btn-secondary">
            Clear Filters
          </button>
          <span className="text-sm text-gray-600">
            {pagination.totalDoctors} doctors found
          </span>
        </div>
      </div>

      {/* Loading Indicator for Filter Changes */}
      {loading && doctors.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-ayurvedic-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ayurvedic-500 mr-2"></div>
            Updating results...
          </div>
        </div>
      )}

      {/* Doctors Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor._id} className="card-hover">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-ayurvedic-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-ayurvedic-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {doctor.name || `${doctor.specialization} Specialist`}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {doctor.specialization} Specialist
                </p>

                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {doctor.rating.average.toFixed(1)} ({doctor.rating.count})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 ml-1">
                      {doctor.experience} years
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  {doctor.consultationModes.map((mode) => (
                    <span
                      key={mode}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {mode === "online" ? (
                        <Video className="w-3 h-3 mr-1" />
                      ) : (
                        <MapPin className="w-3 h-3 mr-1" />
                      )}
                      {mode}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-ayurvedic-500">
                    ₹{doctor.consultationFee}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedDoctor(doctor)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-ayurvedic-500 rounded-md hover:bg-ayurvedic-600 transition-colors"
                    >
                      Book
                    </button>
                    <Link
                      to={`/doctors/${doctor._id}`}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === pagination.currentPage
                      ? "bg-ayurvedic-500 text-white"
                      : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* No Results */}
      {doctors.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No doctors found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or search criteria
          </p>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {selectedDoctor && (
        <AppointmentBooking
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onSuccess={() => {
            // Navigate to appointments page to see the booked appointment
            window.location.href = "/appointments";
          }}
        />
      )}
    </div>
  );
};

export default DoctorList;
