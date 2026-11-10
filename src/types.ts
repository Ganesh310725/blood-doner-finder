export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UserRole = 'donor' | 'receiver' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string;
  city: string;
  pinCode: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DonorProfile {
  userId: string;
  fullName: string;
  bloodGroup: BloodGroup;
  city: string;
  pinCode: string;
  age: number;
  gender?: string;
  isAvailable: boolean;
  isPublicConsent: boolean;
  status: 'available' | 'resting' | 'unavailable';
  createdAt: string;
  updatedAt?: string;
}

export type BloodComponentType = 'Whole Blood' | 'Platelets' | 'Plasma' | 'Red Blood Cells';

export interface DonationRecord {
  id: string;
  donorId: string;
  donationDate: string; // YYYY-MM-DD
  hospitalName: string;
  hospitalLocation?: string;
  units: number;
  componentType?: BloodComponentType;
  notes?: string;
  createdAt: string;
}

export type UrgencyLevel = 'Emergency' | 'Urgent' | 'Normal';
export type RequestStatus = 'Pending' | 'Donors contacted' | 'Fulfilled' | 'Cancelled';

export interface BloodRequest {
  id: string;
  receiverId: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  patientBloodGroup: BloodGroup;
  unitsNeeded: number;
  hospitalName: string;
  hospitalLocation: string;
  city: string;
  pinCode: string;
  requiredDate: string;
  urgency: UrgencyLevel;
  additionalNotes?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt?: string;
}

export type ContactRequestStatus = 'Pending' | 'Accepted' | 'Declined';

export interface ContactRequest {
  id: string;
  donorId: string;
  donorName: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  patientBloodGroup: string;
  hospitalName: string;
  urgency: string;
  message: string;
  status: ContactRequestStatus;
  donorPhoneRevealed?: string;
  donorEmailRevealed?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type FeedbackCategory = 'General' | 'Feedback' | 'Report Suspicious Activity' | 'Emergency Help';
export type FeedbackStatus = 'New' | 'Reviewed' | 'Resolved';

export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  createdAt: string;
}
