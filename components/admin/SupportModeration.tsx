"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, AlertTriangle, User, Send } from 'lucide-react';

interface SupportTicket {
  id: string;
  ticket_id: string;
  customer_name: string;
  customer_email: string;
  order_id?: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  resolution_notes?: string;
}

const SupportModeration = () => {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [responseMessage, setResponseMessage] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([{
    id: '1', ticket_id: 'TKT-001', customer_name: 'John Doe', customer_email: 'john@example.com', order_id: 'ORD-001', subject: 'Package not delivered', description: 'My package was supposed to be delivered yesterday but I never received it. The tracking shows delivered but I was home all day.', priority: 'high', status: 'open', category: 'Delivery Issue', created_at: '2024-01-15 09:30:00', updated_at: '2024-01-15 09:30:00'
  },{
    id: '2', ticket_id: 'TKT-002', customer_name: 'Jane Smith', customer_email: 'jane@example.com', order_id: 'ORD-002', subject: 'Damaged package', description: 'The package arrived but the contents were damaged. The box was visibly crushed.', priority: 'medium', status: 'in_progress', category: 'Damage Claim', created_at: '2024-01-15 10:15:00', updated_at: '2024-01-15 11:00:00', assigned_to: 'Support Agent 1'
  },{
    id: '3', ticket_id: 'TKT-003', customer_name: 'Bob Wilson', customer_email: 'bob@example.com', subject: 'Billing inquiry', description: 'I was charged twice for the same order. Please check my billing and refund the duplicate charge.', priority: 'medium', status: 'resolved', category: 'Billing', created_at: '2024-01-14 14:20:00', updated_at: '2024-01-15 09:00:00', assigned_to: 'Support Agent 2', resolution_notes: 'Duplicate charge refunded. Customer notified via email.'
  },{
    id: '4', ticket_id: 'TKT-004', customer_name: 'Alice Brown', customer_email: 'alice@example.com', subject: 'Swift Errand service question', description: 'I want to know if you can pick up items from multiple stores in one trip for Swift Errand service.', priority: 'low', status: 'open', category: 'General Inquiry', created_at: '2024-01-15 11:45:00', updated_at: '2024-01-15 11:45:00'
  }]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <MessageSquare className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };
  const updateTicketStatus = (ticketId: string, newStatus: string) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus as any, updated_at: new Date().toISOString() }
        : ticket
    ));
  };
  const assignTicket = (ticketId: string, agent: string) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, assigned_to: agent, status: 'in_progress', updated_at: new Date().toISOString() }
        : ticket
    ));
  };
  const sendResponse = (ticketId: string) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: 'in_progress', updated_at: new Date().toISOString() }
        : ticket
    ));
    setResponseMessage('');
  };
  const resolveTicket = (ticketId: string, resolutionNotes: string) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            status: 'resolved', 
            resolution_notes: resolutionNotes,
            updated_at: new Date().toISOString() 
          }
        : ticket
    ));
  };
  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = filterStatus === 'all' || ticket.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || ticket.priority === filterPriority;
    return statusMatch && priorityMatch;
  });
  const selectedTicketData = tickets.find(t => t.id === selectedTicket);
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mt-6 mb-2">Support & Moderation</h2>
      <div className="mt-6" />
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Tickets</p>
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'in_progress').length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved Today</p>
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Urgent Tickets</p>
                    <p className="text-2xl font-bold">{tickets.filter(t => t.priority === 'urgent').length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Support Tickets</CardTitle>
                  <div className="flex gap-4">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow 
                          key={ticket.id} 
                          className={selectedTicket === ticket.id ? 'bg-blue-50' : ''}
                        >
                          <TableCell className="font-medium">{ticket.ticket_id}</TableCell>
                          <TableCell>{ticket.customer_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1">{ticket.status.replace('_', ' ').toUpperCase()}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedTicket(ticket.id)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            {/* Ticket Details */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTicketData ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Ticket ID</Label>
                        <p className="font-medium">{selectedTicketData.ticket_id}</p>
                      </div>
                      <div>
                        <Label>Customer</Label>
                        <p className="font-medium">{selectedTicketData.customer_name}</p>
                        <p className="text-sm text-gray-600">{selectedTicketData.customer_email}</p>
                      </div>
                      {selectedTicketData.order_id && (
                        <div>
                          <Label>Related Order</Label>
                          <p className="font-medium">{selectedTicketData.order_id}</p>
                        </div>
                      )}
                      <div>
                        <Label>Subject</Label>
                        <p className="font-medium">{selectedTicketData.subject}</p>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm">{selectedTicketData.description}</p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select 
                          value={selectedTicketData.status} 
                          onValueChange={(value) => updateTicketStatus(selectedTicketData.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Assign to Agent</Label>
                        <Select 
                          value={selectedTicketData.assigned_to || ''} 
                          onValueChange={(value) => assignTicket(selectedTicketData.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select agent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Support Agent 1">Support Agent 1</SelectItem>
                            <SelectItem value="Support Agent 2">Support Agent 2</SelectItem>
                            <SelectItem value="Support Agent 3">Support Agent 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="response">Response Message</Label>
                        <Textarea
                          id="response"
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="Type your response to the customer..."
                          rows={4}
                        />
                        <Button 
                          className="w-full mt-2"
                          onClick={() => sendResponse(selectedTicketData.id)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Response
                        </Button>
                      </div>
                      {selectedTicketData.status !== 'resolved' && (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => resolveTicket(selectedTicketData.id, 'Issue resolved by admin')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Resolved
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Select a ticket to view details</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportModeration;
