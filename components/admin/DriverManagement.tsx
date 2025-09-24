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
  name: string; // Concatenated full name for display
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

  // Fetch drivers from backend
  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoadingDrivers(true);
      try {
        const response = await axios.get<Driver[]>("http://localhost:8080/api/admin/drivers", {
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
        "http://localhost:8080/api/admin/disable-driver",
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
      const response = await axios.post<{ id: string }>("http://localhost:3000/api/admin/onboard", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });
      // Concatenate first and last name for display in driver list
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
    <div className="space-y-8">
      <TmofSpinner show={isLoadingDrivers} />
      <div className="flex justify-between items-center mt-6 mb-2">
        <h2 className="text-2xl font-bold">Driver Management & Onboarding</h2>
        <Button onClick={() => setShowOnboard(true)} className="bg-tmof-yellow text-black flex items-center gap-2 mt-2">
          <Plus />Onboard Driver
        </Button>
      </div>
      <div className="mt-6" />
      {/* Driver List */}
      <Card>
        <CardHeader>
          <CardTitle>Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
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
                  <td className="flex gap-2 justify-center items-center py-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(driver.id)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDisable(driver.id)}><Ban className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {/* Onboarding Modal */}
      {showOnboard && (
        <>
          <TmofSpinner show={isLoading} />
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <form onSubmit={handleOnboard} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl relative">
              <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={() => setShowOnboard(false)}>&times;</button>
              <div className="flex justify-end mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                  {onboardData.profilePic ? (
                    <img src={onboardData.profilePic} alt="Profile" className="object-cover w-full h-full" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  )}
                  <button
                    type="button"
                    className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={-1}
                  >
                    <Pencil className="h-4 w-4 text-gray-600" />
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
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div className="space-y-4">
                  <Label>Personal Details</Label>
                  <Input
                    placeholder="First Name"
                    value={onboardData.firstName}
                    onChange={e => setOnboardData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Last Name"
                    value={onboardData.lastName}
                    onChange={e => setOnboardData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-4">
                  <Label>Contact Details</Label>
                  <Input
                    placeholder="Email"
                    value={onboardData.email}
                    onChange={e => setOnboardData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Phone"
                    value={onboardData.phone}
                    onChange={e => setOnboardData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-4">
                  <Label>Address Details</Label>
                  <Input
                    placeholder="Address"
                    value={onboardData.address}
                    onChange={e => setOnboardData(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-4">
                  <Label>Vehicle Details</Label>
                  <Input
                    placeholder="Car Model"
                    value={onboardData.carModel}
                    onChange={e => setOnboardData(prev => ({ ...prev, carModel: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Registration Number"
                    value={onboardData.regNumber}
                    onChange={e => setOnboardData(prev => ({ ...prev, regNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-4 col-span-2">
                  <Label>Attachments</Label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => setOnboardData(prev => ({ ...prev, idCopy: e.target.files?.[0] || null }))}
                      />
                      <span className="text-xs text-gray-500">Certified ID Copy</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => setOnboardData(prev => ({ ...prev, clearance: e.target.files?.[0] || null }))}
                      />
                      <span className="text-xs text-gray-500">Criminal Clearance Certificate</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => setOnboardData(prev => ({ ...prev, license: e.target.files?.[0] || null }))}
                      />
                      <span className="text-xs text-gray-500">Driver's License</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit" className="bg-tmof-yellow text-black" disabled={isLoading}>
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