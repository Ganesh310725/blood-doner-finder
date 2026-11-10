import { db, setDoc, doc, getDocs, collection, limit, query } from './firebase.ts';
import { DonorProfile, BloodRequest } from './types.ts';

export const INITIAL_DEMO_DONORS: DonorProfile[] = [
  {
    userId: 'demo_donor_1',
    fullName: 'Rahul Sharma',
    bloodGroup: 'O+',
    city: 'Mumbai',
    pinCode: '400001',
    age: 26,
    gender: 'Male',
    isAvailable: true,
    isPublicConsent: true,
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    userId: 'demo_donor_2',
    fullName: 'Priya Iyer',
    bloodGroup: 'A+',
    city: 'Bengaluru',
    pinCode: '560001',
    age: 23,
    gender: 'Female',
    isAvailable: true,
    isPublicConsent: true,
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    userId: 'demo_donor_3',
    fullName: 'Arun Kumar',
    bloodGroup: 'B+',
    city: 'Delhi',
    pinCode: '110001',
    age: 29,
    gender: 'Male',
    isAvailable: true,
    isPublicConsent: true,
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    userId: 'demo_donor_4',
    fullName: 'Sneha Patel',
    bloodGroup: 'O-',
    city: 'Ahmedabad',
    pinCode: '380001',
    age: 25,
    gender: 'Female',
    isAvailable: true,
    isPublicConsent: true,
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    userId: 'demo_donor_5',
    fullName: 'Vikram Reddy',
    bloodGroup: 'AB+',
    city: 'Hyderabad',
    pinCode: '500001',
    age: 31,
    gender: 'Male',
    isAvailable: true,
    isPublicConsent: true,
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    userId: 'demo_donor_6',
    fullName: 'Ananya Roy',
    bloodGroup: 'A-',
    city: 'Kolkata',
    pinCode: '700001',
    age: 24,
    gender: 'Female',
    isAvailable: true,
    isPublicConsent: true,
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    userId: 'demo_donor_7',
    fullName: 'Karthik Raja',
    bloodGroup: 'O+',
    city: 'Chennai',
    pinCode: '600001',
    age: 28,
    gender: 'Male',
    isAvailable: true,
    isPublicConsent: true,
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    userId: 'demo_donor_8',
    fullName: 'Tanvi Joshi',
    bloodGroup: 'B-',
    city: 'Pune',
    pinCode: '411001',
    age: 27,
    gender: 'Female',
    isAvailable: true,
    isPublicConsent: true,
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
  }
];

export const INITIAL_DEMO_REQUESTS: BloodRequest[] = [
  {
    id: 'req_demo_1',
    receiverId: 'receiver_demo_1',
    receiverName: 'Sanjay Deshmukh',
    receiverPhone: '9820011223',
    receiverEmail: 'sanjay.d@example.com',
    patientBloodGroup: 'O-',
    unitsNeeded: 2,
    hospitalName: 'KEM Hospital & Research Centre',
    hospitalLocation: 'Parel, Ward 4',
    city: 'Mumbai',
    pinCode: '400012',
    requiredDate: 'Immediate',
    urgency: 'Emergency',
    additionalNotes: 'Emergency bypass surgery scheduled. Immediate requirement of O- negative blood.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'req_demo_2',
    receiverId: 'receiver_demo_2',
    receiverName: 'Meera Nambiar',
    receiverPhone: '9845012345',
    receiverEmail: 'meera.n@example.com',
    patientBloodGroup: 'B+',
    unitsNeeded: 3,
    hospitalName: 'Manipal Hospital',
    hospitalLocation: 'HAL Airport Road',
    city: 'Bengaluru',
    pinCode: '560017',
    requiredDate: 'Within 24 Hours',
    urgency: 'Urgent',
    additionalNotes: 'Dengue with low platelet count. Requiring whole blood or platelets.',
    status: 'Donors contacted',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'req_demo_3',
    receiverId: 'receiver_demo_3',
    receiverName: 'Gurpreet Singh',
    receiverPhone: '9811098765',
    receiverEmail: 'gurpreet.s@example.com',
    patientBloodGroup: 'A+',
    unitsNeeded: 1,
    hospitalName: 'AIIMS New Delhi',
    hospitalLocation: 'Ansari Nagar, Trauma Wing',
    city: 'Delhi',
    pinCode: '110029',
    requiredDate: 'Tomorrow Morning',
    urgency: 'Urgent',
    additionalNotes: 'Post-accident stabilization. Replacement donor needed.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

export async function ensureDemoDataSeeded() {
  try {
    const donorsRef = collection(db, 'donors');
    const existingSnap = await getDocs(query(donorsRef, limit(1)));
    if (existingSnap.empty) {
      console.log('Seeding initial community donors and emergency requests...');
      for (const donor of INITIAL_DEMO_DONORS) {
        await setDoc(doc(db, 'donors', donor.userId), donor);
      }
      for (const req of INITIAL_DEMO_REQUESTS) {
        await setDoc(doc(db, 'bloodRequests', req.id), req);
      }
      // Add a sample past donation for demo_donor_1
      await setDoc(doc(db, 'donors', 'demo_donor_1', 'donationHistory', 'donation_sample_1'), {
        donorId: 'demo_donor_1',
        donationDate: new Date(Date.now() - 86400000 * 95).toISOString().split('T')[0],
        hospitalName: 'Tata Memorial Hospital Blood Bank',
        hospitalLocation: 'Parel, Mumbai',
        units: 1,
        componentType: 'Whole Blood',
        notes: 'Voluntary National Blood Donation Day Drive - Certificate #TMH-9421',
        createdAt: new Date(Date.now() - 86400000 * 95).toISOString()
      });
      console.log('Initial demo data seeded successfully.');
    }
  } catch (err) {
    console.warn('Demo data seed notice:', err);
  }
}
