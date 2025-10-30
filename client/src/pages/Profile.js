import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Profile = () => {
  const { user, loading, updateProfile, changePassword, logout } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    avatar: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      const initialAvatar = user.avatar || "";
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        avatar: initialAvatar,
      });
      setAvatarPreview(
        initialAvatar ||
          "https://api.dicebear.com/7.x/initials/svg?seed=" +
            encodeURIComponent(user.name || user.email)
      );
    }
  }, [user]);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    setAvatarError("");
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxBytes = 1.5 * 1024 * 1024; // 1.5 MB

    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Please upload a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > maxBytes) {
      setAvatarError("Image is too large. Max size is 1.5 MB.");
      return;
    }

    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

    try {
      const dataUrl = await toBase64(file);
      setProfileForm({ ...profileForm, avatar: dataUrl });
      setAvatarPreview(dataUrl);
    } catch (err) {
      setAvatarError("Failed to read image. Please try another file.");
    }
  };

  const handleRemoveAvatarImmediate = async () => {
    if (!user?.avatar && !profileForm.avatar) return;
    setRemovingAvatar(true);
    try {
      await updateProfile({ avatar: "" });
      setProfileForm({ ...profileForm, avatar: "" });
      setAvatarPreview(
        "https://api.dicebear.com/7.x/initials/svg?seed=" +
          encodeURIComponent(user.name || user.email)
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setRemovingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (avatarError) return;
    setProfileSaving(true);
    try {
      await updateProfile(profileForm);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } finally {
      setPasswordSaving(false);
    }
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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            You are not logged in
          </h1>
          <p className="text-gray-600 mb-4">
            Please login to view your profile.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const initialsFallback =
    "https://api.dicebear.com/7.x/initials/svg?seed=" +
    encodeURIComponent(user.name || user.email);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Profile</h1>

      {/* Profile header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center">
          <div className="relative">
            <img
              src={user.avatar || initialsFallback}
              alt="avatar"
              className="w-16 h-16 rounded-full mr-4 border object-cover"
            />
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">
              {user.name}
            </div>
            <div className="text-gray-600 text-sm">{user.email}</div>
            <div className="text-gray-600 text-sm capitalize">
              Role: {user.role}
            </div>
            <button
              type="button"
              onClick={handleRemoveAvatarImmediate}
              disabled={removingAvatar || !user.avatar}
              className="mt-2 text-xs px-2 py-1 rounded-md border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              {removingAvatar ? "Removing..." : "Remove Photo"}
            </button>
          </div>
          <div className="ml-auto">
            <button
              onClick={logout}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Edit profile */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Edit Details
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                pattern="^[0-9]{10}$"
                placeholder="10-digit phone number"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image
              </label>
              <div className="flex items-center space-x-4">
                <img
                  src={avatarPreview || initialsFallback}
                  alt="preview"
                  className="w-14 h-14 rounded-full border object-cover"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarFileChange}
                  className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {avatarError && (
                <p className="text-xs text-red-500 mt-1">{avatarError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                JPEG/PNG/WEBP up to 1.5 MB.
              </p>
            </div>
            <button
              type="submit"
              disabled={profileSaving || !!avatarError}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {profileSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                minLength={6}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                minLength={6}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full px-4 py-2 bg-ayurvedic-600 text-white rounded-md hover:bg-ayurvedic-700 disabled:opacity-50"
            >
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Account meta */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Email</div>
            <div className="text-gray-900">{user.email}</div>
          </div>
          <div>
            <div className="text-gray-500">Role</div>
            <div className="text-gray-900 capitalize">{user.role}</div>
          </div>
          <div>
            <div className="text-gray-500">Verified</div>
            <div className="text-gray-900">
              {user.isVerified ? "Yes" : "No"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Active</div>
            <div className="text-gray-900">{user.isActive ? "Yes" : "No"}</div>
          </div>
          <div>
            <div className="text-gray-500">Last Login</div>
            <div className="text-gray-900">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Member Since</div>
            <div className="text-gray-900">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
