"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Edit, Save, X, DollarSign } from 'lucide-react';

interface PricingRule {
  id: string;
  service_type: string;
  base_rate: number;
  per_km_rate: number;
  coverage_area: string;
  is_active: boolean;
}

const PricingConfiguration = () => {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    {
      id: '1',
      service_type: 'Standard',
      base_rate: 50,
      per_km_rate: 8.5,
      coverage_area: 'Johannesburg Metro',
      is_active: true
    },
    {
      id: '2',
      service_type: 'Same-Day',
      base_rate: 80,
      per_km_rate: 12,
      coverage_area: 'Johannesburg Metro',
      is_active: true
    },
    {
      id: '3',
      service_type: 'Instant',
      base_rate: 120,
      per_km_rate: 15,
      coverage_area: 'Sandton/Rosebank',
      is_active: true
    },
    {
      id: '4',
      service_type: 'Swift Errand',
      base_rate: 100,
      per_km_rate: 10,
      coverage_area: 'Greater Johannesburg',
      is_active: true
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newServiceType, setNewServiceType] = useState('');
  const [newBaseRate, setNewBaseRate] = useState('');
  const [newPerKmRate, setNewPerKmRate] = useState('');
  const [newCoverageArea, setNewCoverageArea] = useState('');

  const [surgeSettings, setSurgeSettings] = useState({
    peak_hours_start: '07:00',
    peak_hours_end: '09:00',
    evening_peak_start: '17:00',
    evening_peak_end: '19:00',
    surge_multiplier: 1.2,
    weekend_multiplier: 1.1
  });

  const handleEdit = (id: string) => setEditingId(id);
  const handleSave = (id: string) => setEditingId(null);
  const handleCancel = () => setEditingId(null);

  const addNewPricingRule = () => {
    if (!newServiceType || !newBaseRate || !newPerKmRate || !newCoverageArea) return;
    const newRule: PricingRule = {
      id: Date.now().toString(),
      service_type: newServiceType,
      base_rate: parseFloat(newBaseRate),
      per_km_rate: parseFloat(newPerKmRate),
      coverage_area: newCoverageArea,
      is_active: true
    };
    setPricingRules([...pricingRules, newRule]);
    setNewServiceType('');
    setNewBaseRate('');
    setNewPerKmRate('');
    setNewCoverageArea('');
  };

  const updatePricingRule = (id: string, field: string, value: any) => {
    setPricingRules(rules => 
      rules.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const toggleRuleStatus = (id: string) => {
    setPricingRules(rules => 
      rules.map(rule => 
        rule.id === id ? { ...rule, is_active: !rule.is_active } : rule
      )
    );
  };

  const saveSurgeSettings = () => {};

  return (
    <div className="space-y-6">
      {/* Service Pricing Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Service Pricing Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead>Base Rate (R)</TableHead>
                <TableHead>Per KM Rate (R)</TableHead>
                <TableHead>Coverage Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.service_type}</TableCell>
                  <TableCell>
                    {editingId === rule.id ? (
                      <Input
                        type="number"
                        value={rule.base_rate}
                        onChange={(e) => updatePricingRule(rule.id, 'base_rate', parseFloat(e.target.value))}
                        className="w-20"
                      />
                    ) : (
                      `R${rule.base_rate}`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === rule.id ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={rule.per_km_rate}
                        onChange={(e) => updatePricingRule(rule.id, 'per_km_rate', parseFloat(e.target.value))}
                        className="w-20"
                      />
                    ) : (
                      `R${rule.per_km_rate}`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === rule.id ? (
                      <Input
                        value={rule.coverage_area}
                        onChange={(e) => updatePricingRule(rule.id, 'coverage_area', e.target.value)}
                        className="w-32"
                      />
                    ) : (
                      rule.coverage_area
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      onClick={() => toggleRuleStatus(rule.id)}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {editingId === rule.id ? (
                        <>
                          <Button size="sm" onClick={() => handleSave(rule.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(rule.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Add New Pricing Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Pricing Rule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value)}
                placeholder="e.g., Express"
              />
            </div>
            <div>
              <Label htmlFor="baseRate">Base Rate (R)</Label>
              <Input
                id="baseRate"
                type="number"
                value={newBaseRate}
                onChange={(e) => setNewBaseRate(e.target.value)}
                placeholder="50"
              />
            </div>
            <div>
              <Label htmlFor="perKmRate">Per KM Rate (R)</Label>
              <Input
                id="perKmRate"
                type="number"
                step="0.1"
                value={newPerKmRate}
                onChange={(e) => setNewPerKmRate(e.target.value)}
                placeholder="8.5"
              />
            </div>
            <div>
              <Label htmlFor="coverageArea">Coverage Area</Label>
              <Input
                id="coverageArea"
                value={newCoverageArea}
                onChange={(e) => setNewCoverageArea(e.target.value)}
                placeholder="Johannesburg Metro"
              />
            </div>
          </div>
          <Button onClick={addNewPricingRule} className="w-full bg-[#ffd215] hover:bg-[#e6bd13] text-black">
            <Plus className="mr-2 h-4 w-4" />
            Add Pricing Rule
          </Button>
        </CardContent>
      </Card>
      {/* Surge Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dynamic Pricing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="peakStart">Morning Peak Start</Label>
              <Input
                id="peakStart"
                type="time"
                value={surgeSettings.peak_hours_start}
                onChange={(e) => setSurgeSettings({...surgeSettings, peak_hours_start: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="peakEnd">Morning Peak End</Label>
              <Input
                id="peakEnd"
                type="time"
                value={surgeSettings.peak_hours_end}
                onChange={(e) => setSurgeSettings({...surgeSettings, peak_hours_end: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="eveningStart">Evening Peak Start</Label>
              <Input
                id="eveningStart"
                type="time"
                value={surgeSettings.evening_peak_start}
                onChange={(e) => setSurgeSettings({...surgeSettings, evening_peak_start: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="eveningEnd">Evening Peak End</Label>
              <Input
                id="eveningEnd"
                type="time"
                value={surgeSettings.evening_peak_end}
                onChange={(e) => setSurgeSettings({...surgeSettings, evening_peak_end: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="surgeMultiplier">Peak Hours Multiplier</Label>
              <Input
                id="surgeMultiplier"
                type="number"
                step="0.1"
                value={surgeSettings.surge_multiplier}
                onChange={(e) => setSurgeSettings({...surgeSettings, surge_multiplier: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="weekendMultiplier">Weekend Multiplier</Label>
              <Input
                id="weekendMultiplier"
                type="number"
                step="0.1"
                value={surgeSettings.weekend_multiplier}
                onChange={(e) => setSurgeSettings({...surgeSettings, weekend_multiplier: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <Button onClick={saveSurgeSettings} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Save Surge Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingConfiguration;
