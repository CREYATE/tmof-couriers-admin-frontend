"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Clock, Palette, Globe, Upload } from "lucide-react";

const BusinessSettings = () => {
  const [businessSettings, setBusinessSettings] = useState({
    company_name: 'TMOF Couriers',
    tagline: 'Friends of your parcel',
    contact_email: 'support@tmofcouriers.com',
    contact_phone: '+27 11 123 4567',
    address: '123 Courier Street, Johannesburg, 2000',
    website: 'https://tmofcouriers.com',
    monday_start: '08:00',
    monday_end: '18:00',
    tuesday_start: '08:00',
    tuesday_end: '18:00',
    wednesday_start: '08:00',
    wednesday_end: '18:00',
    thursday_start: '08:00',
    thursday_end: '18:00',
    friday_start: '08:00',
    friday_end: '18:00',
    saturday_start: '09:00',
    saturday_end: '15:00',
    sunday_start: '10:00',
    sunday_end: '14:00',
    max_delivery_distance: 50,
    same_day_cutoff_time: '15:00',
    instant_delivery_radius: 15,
    weekend_service_enabled: true,
    holiday_service_enabled: false,
    primary_color: '#ffd215',
    secondary_color: '#0C0E29',
    logo_url: '/lovable-uploads/064a29fb-7ccb-4c48-9d33-fea8f42f2d30.png',
    order_confirmation_enabled: true,
    delivery_notification_enabled: true,
    sms_notifications_enabled: true,
    whatsapp_notifications_enabled: true,
    default_service_type: 'Standard',
    auto_assign_drivers: true,
    require_signature: false,
    photo_proof_required: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setBusinessSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {};
  const uploadLogo = () => {};
  const resetToDefaults = () => {};

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mt-6 mb-2">Settings</h2>
      <div className="mt-6" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={businessSettings.company_name} onChange={(e) => handleSettingChange('company_name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={businessSettings.tagline} onChange={(e) => handleSettingChange('tagline', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" type="email" value={businessSettings.contact_email} onChange={(e) => handleSettingChange('contact_email', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input id="contactPhone" value={businessSettings.contact_phone} onChange={(e) => handleSettingChange('contact_phone', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Business Address</Label>
            <Textarea id="address" value={businessSettings.address} onChange={(e) => handleSettingChange('address', e.target.value)} rows={2} />
          </div>
          <div>
            <Label htmlFor="website">Website URL</Label>
            <Input id="website" value={businessSettings.website} onChange={(e) => handleSettingChange('website', e.target.value)} />
          </div>
        </CardContent>
      </Card>
      {/* ...existing code for other settings cards... */}
    </div>
  );
};

export default BusinessSettings;
