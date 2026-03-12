"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '@/app/components/ThemeProvider';
import supabase from '@/app/lib/supabaseClient';

interface ProfileScreenProps {
  onNavigate: (page: string, service?: string) => void;
  onLogout: () => void;
}

const ProfileScreen = ({ onNavigate, onLogout }: ProfileScreenProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: ""
  });

  const [formData, setFormData] = useState(profileData);

  // fetch profile from DB
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) {
          console.error('Error loading profile:', error);
        } else if (data) {
          const normalized = {
            firstName: data.first_name || '',
            lastName: data.surname || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            bio: data.bio || ''
          };
          setProfileData(normalized);
          setFormData(normalized);
        }
      }
      // Show loading animation for at least 1 second
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };
    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveChanges = async () => {
    setProfileData(formData);
    setIsEditing(false);
    // update DB
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').update({
        first_name: formData.firstName,
        surname: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio
      }).eq('id', user.id);
      if (error) {
        console.error('Error updating profile:', error);
        console.error('Error JSON:', JSON.stringify(error, null, 2));
        // some PostgrestError properties may not exist, so we log the object directly instead of accessing them
        console.error('error details:', error);
      }
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Skeleton */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="px-4 md:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-80 h-5 bg-gray-200 rounded animate-pulse mb-8"></div>

            {/* Profile Card Skeleton */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Form Fields Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i}>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Bio Skeleton */}
              <div className="mt-6">
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-full h-24 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Buttons Skeleton */}
              <div className="flex justify-end space-x-4 mt-8">
                <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Password Section Skeleton */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
              <div className="w-28 h-10 bg-gray-200 rounded animate-pulse mt-6"></div>
            </div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <footer className="bg-gray-200 px-4 md:px-8 py-8 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-48 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div>
              <div className="w-20 h-5 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-14 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-18 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            <div>
              <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-28 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            <div>
              <div className="w-20 h-5 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="flex space-x-4">
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4 flex flex-col md:flex-row items-center justify-between">
            <div className="w-48 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-56 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <Navbar currentPage="profile" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <div className="px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-gray-600 mb-8">Manage your personal information and account preferences</p>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Appearance</h2>
              <p className="text-sm text-gray-600 mt-1">Switch between light and dark mode. Your preference is saved on this device.</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded transition-colors"
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
              {theme === 'light' ? 'Enable Dark Mode' : 'Enable Light Mode'}
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white">
                  <FaUser className="text-4xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-gray-600">{profileData.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="mt-4 md:mt-0 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded transition-colors"
              >
                {isEditing ? "Cancel Editing" : "Edit Profile"}
              </button>
            </div>

            {/* Profile Information */}
            {isEditing ? (
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <FaUser className="text-gray-400 mr-3" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full outline-none text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <FaUser className="text-gray-400 mr-3" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full outline-none text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <FaEnvelope className="text-gray-400 mr-3" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full outline-none text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <FaPhone className="text-gray-400 mr-3" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full outline-none text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <FaMapMarkerAlt className="text-gray-400 mr-3" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full outline-none text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full border border-gray-300 rounded px-4 py-2 text-gray-700 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Save and Cancel Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name Display */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <div className="flex items-center text-gray-700 p-3 bg-gray-50 rounded">
                      <FaUser className="text-gray-400 mr-3" />
                      <span>{profileData.firstName}</span>
                    </div>
                  </div>

                  {/* Last Name Display */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <div className="flex items-center text-gray-700 p-3 bg-gray-50 rounded">
                      <FaUser className="text-gray-400 mr-3" />
                      <span>{profileData.lastName}</span>
                    </div>
                  </div>

                  {/* Email Display */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="flex items-center text-gray-700 p-3 bg-gray-50 rounded">
                      <FaEnvelope className="text-gray-400 mr-3" />
                      <span>{profileData.email}</span>
                    </div>
                  </div>

                  {/* Phone Display */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="flex items-center text-gray-700 p-3 bg-gray-50 rounded">
                      <FaPhone className="text-gray-400 mr-3" />
                      <span>{profileData.phone}</span>
                    </div>
                  </div>

                  {/* Location Display */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                    <div className="flex items-center text-gray-700 p-3 bg-gray-50 rounded">
                      <FaMapMarkerAlt className="text-gray-400 mr-3" />
                      <span>{profileData.location}</span>
                    </div>
                  </div>

                  {/* Bio Display */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                    <div className="text-gray-700 p-3 bg-gray-50 rounded">
                      <p>{profileData.bio}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Security</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Change Password</label>
              <div className="flex items-center border-b border-gray-300 pb-2 mb-6">
                <FaLock className="text-gray-400 mr-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full outline-none text-gray-700 placeholder-gray-400"
                  disabled
                />
              </div>
              <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded transition-colors">
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-200 px-4 md:px-8 py-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gray-400 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-bold text-slate-800">SlickTech</span>
            </div>
            <p className="text-xs text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">COMPANY</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">About Us</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Services</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">CONTACT INFO</h4>
            <ul className="space-y-2">
              <li className="text-xs text-gray-600">Phone: (254)6578900</li>
              <li className="text-xs text-gray-600">Email: company@email.com</li>
              <li className="text-xs text-gray-600">Location: 901 Smart Street, BC</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">FOLLOW US</h4>
            <div className="flex space-x-4">
              <FaFacebook className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" />
              <FaTwitter className="text-blue-400 cursor-pointer hover:scale-110 transition-transform" />
              <FaInstagram className="text-pink-600 cursor-pointer hover:scale-110 transition-transform" />
              <FaLinkedin className="text-blue-700 cursor-pointer hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600">
          <p>© 2026 SlickTech Technologies | All rights reserved</p>
          <p>Created with love by SlickTech Technologies</p>
        </div>
      </footer>
    </div>
  );
};

export default ProfileScreen;
