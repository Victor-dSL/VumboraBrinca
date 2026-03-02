
export interface Package {
  id: 'A' | 'B' | 'GYM';
  name: string;
  durationMinutes: number;
  price: number;
}

export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'não informado';

export type UserRole = 'admin' | 'staff';

export interface User {
  email: string;
  role: UserRole;
  name: string;
}

export interface ApiConfig {
  baseUrl: string;
  token: string;
  instanceId: string;
  endpoint: string;
  useProxy: boolean;
  proxyUrl: string;
  logoBase64?: string;
  entryMessage: string;
  warningMessage: string;
  academyMessage: string;
  renewalMessage: string;
  renewalThanksMessage: string; 
  warningMinutes: number;
  renewalWarningDays: number;
  gymMonthlyPrice: number;
  gymQuarterlyPrice: number;
}

export interface KidEntry {
  id: string; 
  parentName: string;
  childName: string;
  contactNumber: string;
  packageId: 'A' | 'B' | 'GYM';
  packageDuration: number;
  entryTime: number; 
  price: number;
  formattedEntryTime?: string;
  isPaid?: boolean;
  paymentMethod?: PaymentMethod;
  isPaused?: boolean;
  pausedAt?: number;
  totalPausedTime?: number;
  isGymPlan?: boolean;
  isPcd?: boolean; // Novo campo
  enrollmentId?: string;
  planDuration?: 'monthly' | 'quarterly';
  notificationStatus?: {
    welcomeSent: boolean;
    warningSent: boolean;
    expiredSent: boolean;
    renewalSent?: boolean;
  };
  hasMedicalCondition?: boolean;
  medicalConditions?: string;
  hasAllergies?: boolean;
  allergies?: string;
  observations?: string;
}

export interface HistoryRecord {
  id?: string;
  actualExitTime: number;
  entryTime: number;
  timeSpent: number;
  overstayDuration: number;
  packageDuration: number;
  price: number;
  childName: string;
  contactNumber: string;
  packageId: string;
  parentName: string;
  isPaid?: boolean;
  isPcd?: boolean; // Novo campo
  paymentMethod?: PaymentMethod;
  formattedEntryTime?: string;
  formattedExitTime?: string;
  formattedTimeSpent?: string;
  finalStatus?: string;
  isGymPlan?: boolean;
  type?: 'visit' | 'subscription';
}

export interface ChildRegistration {
  id: string; 
  childName: string;
  responsibleName: string;
  birthDate: string;
  contactNumber1: string;
  contactNumber2?: string;
  address: string;
  createdAt: number;
  isGymPlan: boolean;
  isPcd?: boolean; // Novo campo
  planDuration?: 'monthly' | 'quarterly';
  enrollmentId?: string;
  planStartDate?: string;
  registrationDay: number; 
  lastPaymentMonth: string; 
  hasMedicalCondition: boolean;
  medicalConditions?: string;
  hasAllergies: boolean;
  allergies?: string;
  observations?: string;
}
