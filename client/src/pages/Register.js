import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Stethoscope,
  Heart,
} from "lucide-react";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  const password = watch("password");

  // Sync selectedRole with form state
  useEffect(() => {
    if (selectedRole) {
      setValue("role", selectedRole);
    }
  }, [selectedRole, setValue]);

  // const onSubmit = async (data) => {
  //   setIsLoading(true);
  //   try {
  //     const result = await registerUser(data);
  //     if (result.success) {
  //       navigate("/");
  //     }
  //   } catch (error) {
  //     console.error("Registration error:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const result = await registerUser(data);

      if (result.success) {
        navigate("/appointments", { replace: true });

        // ensure navbar + auth state updates
        window.location.reload();
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h2>
          <p className="text-gray-600">
            Join AyurvedicCare and start your wellness journey
          </p>
        </div>

        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                    maxLength: {
                      value: 50,
                      message: "Name cannot exceed 50 characters",
                    },
                  })}
                  className="input-field pl-10"
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Please enter a valid 10-digit phone number",
                    },
                  })}
                  className="input-field pl-10"
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`relative cursor-pointer border-2 rounded-lg p-4 text-center transition-all duration-200 ${
                    selectedRole === "patient"
                      ? "border-ayurvedic-500 bg-ayurvedic-50"
                      : "border-gray-200 hover:border-ayurvedic-300"
                  }`}
                  onClick={() => setSelectedRole("patient")}
                >
                  <input
                    type="radio"
                    value="patient"
                    {...register("role", {
                      required: "Please select your role",
                    })}
                    className="sr-only"
                    checked={selectedRole === "patient"}
                    onChange={() => setSelectedRole("patient")}
                  />
                  <Heart
                    className={`h-8 w-8 mx-auto mb-2 ${
                      selectedRole === "patient"
                        ? "text-ayurvedic-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      selectedRole === "patient"
                        ? "text-ayurvedic-700"
                        : "text-gray-700"
                    }`}
                  >
                    Patient
                  </span>
                </div>

                <div
                  className={`relative cursor-pointer border-2 rounded-lg p-4 text-center transition-all duration-200 ${
                    selectedRole === "doctor"
                      ? "border-ayurvedic-500 bg-ayurvedic-500 text-white"
                      : "border-gray-200 hover:border-ayurvedic-300"
                  }`}
                  onClick={() => setSelectedRole("doctor")}
                >
                  <input
                    type="radio"
                    value="doctor"
                    {...register("role", {
                      required: "Please select your role",
                    })}
                    className="sr-only"
                    checked={selectedRole === "doctor"}
                    onChange={() => setSelectedRole("doctor")}
                  />
                  <Stethoscope
                    className={`h-8 w-8 mx-auto mb-2 ${
                      selectedRole === "doctor" ? "text-white" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      selectedRole === "doctor" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    Doctor
                  </span>
                </div>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className="input-field pl-10 pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                  className="input-field pl-10 pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-ayurvedic-500 hover:text-ayurvedic-600"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            By creating an account, you agree to our{" "}
            <Link
              to="/terms"
              className="text-ayurvedic-500 hover:text-ayurvedic-600"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-ayurvedic-500 hover:text-ayurvedic-600"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
