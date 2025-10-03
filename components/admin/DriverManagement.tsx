"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, User, Image as ImageIcon, Edit, Ban, Pencil } from "lucide-react";
import axios from "axios";
import TmofSpinner from "@/components/ui/TmofSpinner";
import { toast } from "react-hot-toast";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  profilePic: string;
}

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardData, setOnboardData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    carModel: "",
    regNumber: "",
    profilePic: "",
    idCopy: null as File | null,
    clearance: null as File | null,
    license: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch drivers from Next.js API route
  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoadingDrivers(true);
      try {
        const response = await axios.get<Driver[]>("/api/admin/drivers/available", {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        setDrivers(response.data);
      } catch (error: any) {
        console.error("Failed to fetch drivers:", error);
        toast.error("Failed to load drivers");
      } finally {
        setIsLoadingDrivers(false);
      }
    };
    fetchDrivers();
  }, []);

  const handleDisable = async (id: string) => {
    try {
      await axios.post(
        "/api/admin/disable-driver",
        { id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` } }
      );
      setDrivers(drivers.map(d => d.id === id ? { ...d, status: "disabled" } : d));
      toast.success("Driver disabled successfully");
    } catch (error: any) {
      console.error("Failed to disable driver:", error);
      toast.error("Failed to disable driver");
    }
  };

  const handleEdit = (id: string) => {
    // Implement edit logic later
    toast("Edit driver " + id);
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", onboardData.firstName);
    formData.append("surname", onboardData.lastName);
    formData.append("email", onboardData.email);
    formData.append("role", "DRIVER");
    formData.append("phone", onboardData.phone);
    formData.append("address", onboardData.address);
    formData.append("carModel", onboardData.carModel);
    formData.append("regNumber", onboardData.regNumber);
    if (onboardData.idCopy) formData.append("idCopy", onboardData.idCopy);
    if (onboardData.clearance) formData.append("clearance", onboardData.clearance);
    if (onboardData.license) formData.append("license", onboardData.license);
    if (fileInputRef.current?.files?.[0]) formData.append("profilePic", fileInputRef.current.files[0]);

    try {
      const response = await axios.post<{ id: string }>("/api/admin/onboard", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });
      const fullName = `${onboardData.firstName} ${onboardData.lastName}`;
      setDrivers([...drivers, {
        id: response.data.id,
        name: fullName,
        email: onboardData.email,
        phone: onboardData.phone,
        status: "active",
        profilePic: onboardData.profilePic,
      }]);
      setShowOnboard(false);
      setOnboardData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        carModel: "",
        regNumber: "",
        profilePic: "",
        idCopy: null,
        clearance: null,
        license: null,
      });
      toast.success("Driver onboarded successfully");
    } catch (error: any) {
      console.error("Onboarding failed:", error);
      toast.error(error.response?.data?.error || "Failed to onboard driver");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setOnboardData(prev => ({ ...prev, profilePic: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <TmofSpinner show={isLoadingDrivers} />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Driver Management & Onboarding</h2>
        <Button 
          onClick={() => setShowOnboard(true)} 
          className="bg-tmof-yellow text-black flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          <span className="sm:inline">Onboard Driver</span>
        </Button>
      </div>
      
      {/* Driver List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Drivers</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Profile</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  {/* <th className="text-center">Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver.id} className="border-b">
                    <td className="py-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {driver.profilePic ? (
                          <img src={driver.profilePic} alt="Profile" className="object-cover w-full h-full" />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td>{driver.name}</td>
                    <td>{driver.email}</td>
                    <td>{driver.phone}</td>
                    <td>{driver.status}</td>
                    {/* <td className="flex gap-2 justify-center items-center py-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(driver.id)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDisable(driver.id)}><Ban className="h-4 w-4" /></Button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {drivers.map(driver => (
              <div key={driver.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {driver.profilePic ? (
                      <img src={driver.profilePic} alt="Profile" className="object-cover w-full h-full" />
                    ) : (
                      <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{driver.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{driver.email}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {driver.status}
                  </span>
                </div>
                <div className="text-xs sm:text-sm space-y-1">
                  <p><span className="font-medium">Phone:</span> {driver.phone}</p>
                </div>
                {/* <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(driver.id)}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDisable(driver.id)}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    <Ban className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Disable
                  </Button>
                </div> */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Onboarding Modal */}
      {showOnboard && (
        <>
          <TmofSpinner show={isLoading} />
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4">
            <form onSubmit={handleOnboard} className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <button 
                type="button" 
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 text-xl sm:text-2xl" 
                onClick={() => setShowOnboard(false)}
              >
                &times;
              </button>
              
              {/* Profile Picture Section */}
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                  {onboardData.profilePic ? (
                    <img src={onboardData.profilePic} alt="Profile" className="object-cover w-full h-full" />
                  ) : (
                    <ImageIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                  )}
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={-1}
                  >
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePicChange}
                  />
                </div>
              </div>
              
              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-sm sm:text-base font-medium">Personal Details</Label>
                  <Input
                    placeholder="First Name"
                    value={onboardData.firstName}
                    onChange={e => setOnboardData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    className="text-sm sm:text-base"
                  />
                  <Input
                    placeholder="Last Name"
                    value={onboardData.lastName}
                    onChange={e => setOnboardData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-sm sm:text-base font-medium">Contact Details</Label>
                  <Input
                    placeholder="Email"
                    type="email"
                    value={onboardData.email}
                    onChange={e => setOnboardData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="text-sm sm:text-base"
                  />
                  <Input
                    placeholder="Phone"
                    value={onboardData.phone}
                    onChange={e => setOnboardData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-sm sm:text-base font-medium">Address Details</Label>
                  <Input
                    placeholder="Address"
                    value={onboardData.address}
                    onChange={e => setOnboardData(prev => ({ ...prev, address: e.target.value }))}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-sm sm:text-base font-medium">Vehicle Details</Label>
                  <Input
                    placeholder="Car Model"
                    value={onboardData.carModel}
                    onChange={e => setOnboardData(prev => ({ ...prev, carModel: e.target.value }))}
                    required
                    className="text-sm sm:text-base"
                  />
                  <Input
                    placeholder="Registration Number"
                    value={onboardData.regNumber}
                    onChange={e => setOnboardData(prev => ({ ...prev, regNumber: e.target.value }))}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-3 sm:space-y-4 lg:col-span-2">
                  <Label className="text-sm sm:text-base font-medium">Attachments</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => setOnboardData(prev => ({ ...prev, idCopy: e.target.files?.[0] || null }))}
                        className="text-xs sm:text-sm"
                      />
                      <span className="text-xs text-gray-500 block">Certified ID Copy</span>
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => setOnboardData(prev => ({ ...prev, clearance: e.target.files?.[0] || null }))}
                        className="text-xs sm:text-sm"
                      />
                      <span className="text-xs text-gray-500 block">Criminal Clearance Certificate</span>
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => setOnboardData(prev => ({ ...prev, license: e.target.files?.[0] || null }))}
                        className="text-xs sm:text-sm"
                      />
                      <span className="text-xs text-gray-500 block">Driver's License</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowOnboard(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-tmof-yellow text-black w-full sm:w-auto" 
                  disabled={isLoading}
                >
                  {isLoading ? "Onboarding..." : "Onboard Driver"}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}