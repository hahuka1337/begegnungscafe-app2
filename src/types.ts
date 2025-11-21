
export enum UserRole {
  USER = 'user',
  ORGANIZER = 'organizer',
  ADMIN = 'admin'
}

export enum EventCategory {
  SPIRITUALITY = 'Spiritualität',
  FAMILY = 'Familie',
  ART = 'Kunst',
  EDUCATION = 'Bildung'
}

export type PrivacyLevel = 'public' | 'friends' | 'private';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  groups: string[];
  notificationSettings: {
    events: boolean;
    groups: boolean;
    announcements: boolean;
  };
  isMentor: boolean;
  mentoringProfile?: string;
  isVerified: boolean;
  gender?: 'male' | 'female' | 'divers';
  birthYear?: number;
  joinedAt?: string;
  accountStatus: 'active' | 'banned';
  isChatRestricted: boolean;
  allowedCategories?: string[];
  allowedRoomIds?: string[];
  canManageCafe?: boolean;
  loyaltyPoints: number;
  friends: string[];
  friendRequests: string[];
  
  bio?: string;
  job?: string;
  hobbies?: string[];
  privacySettings: {
      details: PrivacyLevel;
      groups: PrivacyLevel;
      friends: PrivacyLevel;
  };
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string;
  isAvailable: boolean;
}

export interface RoomBooking {
  id: string;
  roomId: string;
  requestedBy: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'requested' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'link';
  url: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  userId: string;
  type: 'activity' | 'improvement' | 'other';
  title: string;
  description: string;
  status: 'new' | 'approved' | 'rejected';
  createdAt: string;
  adminResponse?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  dateTimeStart: string;
  dateTimeEnd: string;
  location: string;
  createdBy: string;
  maxParticipants?: number;
  participants: string[];
  pendingParticipants: string[];
  waitlist: string[];
  averageRating?: number;
  averageRatingCount?: number;
  
  registrationMode: 'instant' | 'request';
  isRegistrationOpen: boolean;
  genderRestriction: 'none' | 'male' | 'female';
  minAge?: number;
  maxAge?: number;
  
  seriesId?: string; // ID linking recurring events
  recurrenceRule?: 'daily' | 'weekly' | 'monthly'; // Descriptive
}

export interface EventFeedback {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  members: string[];
  joinRequests: string[];
  moderators: string[];
  isConvertGroup: boolean;
  status: 'active' | 'archived';
}

export interface Message {
  id: string;
  groupID: string;
  authorID: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface MentoringMatch {
  id: string;
  menteeID: string;
  mentorID: string;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  text: string;
  date: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'user' | 'message';
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  scope: 'global' | 'group';
  targetGroupId?: string;
  createdBy: string;
  createdAt: string;
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  optionIndex: number;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  eventId: string;
  userId: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  category: string;
  createdAt: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: Record<number, string>;
}

export interface MenuCategory {
  id: string;
  title: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: string;
  description: string;
}

export interface CafeConfig {
  isOpen: boolean;
  openingHours: { label: string; value: string }[];
  contact: {
    address: string;
    phone: string;
    email: string;
    instagram: string;
  };
  categories: MenuCategory[];
  menu: MenuItem[];
  specialNote?: string;
  coworkingNote?: string;
  footerNote?: string;
}

export interface CoworkingDesk {
  id: string;
  name: string;
  capacity: number;
  features: string[];
}

export type CoworkingSlotType = 'AM' | 'PM' | 'FULL';

export interface CoworkingBooking {
  id: string;
  userId: string;
  deskId: string;
  date: string;
  slot: CoworkingSlotType;
  status: 'active' | 'cancelled';
  createdAt: string;
}

export interface CoworkingRule {
  id?: string;
  icon: string;
  title: string;
  text: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  isVisible: boolean;
  order: number;
}

export interface AppConfig {
  navigation: NavItem[];
}

export interface HomeSectionConfig {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  offerText?: string;
  offerPrice?: string;
}

export interface HomeConfig {
  order: string[];
  welcome: HomeSectionConfig;
  cafeWidget: HomeSectionConfig;
  news: HomeSectionConfig;
  actions: HomeSectionConfig;
  polls: HomeSectionConfig;
  events: HomeSectionConfig;
}