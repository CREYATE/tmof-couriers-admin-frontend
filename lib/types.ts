export interface Order {
  id?: string;
  trackingNumber?: string;
  customerName?: string;
  customerSurname?: string;
  customerPhone?: string;
  serviceType?: string;
  status?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  price?: string; // Changed to string to match OrderResponse
  createdAt?: string;
  driverName?: string;
  deliveryNotes?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  preferredTime?: string;
  error?: string;
}

export interface OrderUpdateResponse {
  status: string;
  currentLocation?: string;
}

export interface OrderCounts {
  awaitingCollection: number;
  inTransit: number;
  delivered: number;
  cancelled: string | number; // Handle 'API is being developed' or number
}

export interface Driver {
  id: string;
  name: string;
  surname?: string;
  email?: string;
  phone?: string;
  availability?: string;
  status?: string;
  lat?: number;
  lng?: number;
  vehicle_type?: string;
  currentLocation?: any;
  online?: boolean;
}