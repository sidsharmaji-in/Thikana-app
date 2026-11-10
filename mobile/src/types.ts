// GharDekho Mobile Client Types
export interface RoomSlot {
  slotId: string;
  slotName: string;
  status: 'available' | 'reserved' | 'occupied';
  tenantName?: string;
  roommateProfile?: {
    course: string;
    habits: string[];
    vibeScore: number;
    hometown: string;
  };
}

export interface RoomConfig {
  id: string;
  title: string;
  maxOccupancy: number;
  currentOccupancy: number;
  pricePerPerson: number;
  depositPerPerson: number;
  slots: RoomSlot[];
  waitlist?: Array<{
    id: string;
    applicantName: string;
    queuePosition: number;
  }>;
}

export interface Property {
  id: string;
  title: string;
  propertyType: 'pg' | 'single_room' | 'flat' | 'hostel';
  city: string;
  locality: string;
  address: string;
  lat: number;
  lng: number;
  price: number;
  rating: number;
  reviewsCount: number;
  isAvailable: boolean;
  photos: string[];
  amenities: {
    wifi?: boolean;
    powerBackup?: 'Inverter' | 'Generator (Full 24hr)' | 'None';
    waterSupply?: string;
    bathroomType?: string;
    mealsIncluded?: boolean;
    cctv?: boolean;
    curfewTime?: string;
  };
  rooms: RoomConfig[];
  owner: {
    id: string;
    name: string;
    phone: string;
    isKycDone: boolean;
    verificationBadge?: string;
  };
  distanceKm?: number;
}
