

export enum UserRole {
  USER = 'user',
  ORGANIZER = 'organizer',
  ADMIN = 'admin'
}

// Deprecated enum usage in favor of dynamic strings, keeping for defaults
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
  avatarUrl?: string; // New field for profile picture
  groups: string[]; // Group IDs
  notificationSettings: {
    events: boolean;
    groups: boolean;
    announcements: boolean;
  };
  isMentor: boolean;
  mentoringProfile?: string;
  isVerified: boolean; // New field for chat permission
  gender?: 'male' | 'female' | 'divers'; // For demographics
  birthYear?: number; // For age distribution
  joinedAt?: string; // ISO Date for growth stats
  accountStatus: 'active' | 'banned'; // New: For full account suspension
  isChatRestricted: boolean; // New: For muting user in chats
  allowedCategories?: string[]; // New: Organizers can be restricted to specific categories
  allowedRoomIds?: string[]; // New: Organizers can be restricted to specific rooms
  canManageCafe?: boolean; // New: Specific permission for organizers to manage cafe status/menu
  loyaltyPoints: number; // New: For digital stamp card (0-10)
  friends: string[]; // New: List of User IDs
  friendRequests: string[]; // New: List of User IDs who sent a request
  
  // Extended Profile
  bio?: string;
  job?: string;
  hobbies?: string[];
  privacySettings: {
      details: PrivacyLevel; // Job, Bio, Hobbies
      groups: PrivacyLevel; // Group memberships
      friends: PrivacyLevel; // Friend list
  };
}

export interface PrayerTime {
  name: string;
  time: string; // HH:MM
  isNext: boolean;
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
  requestedBy: string; // User ID
  title: string; // Reason or Event Title
  startTime: string; // ISO String
  endTime: string; // ISO String
  status: 'requested' | 'approved' | 'rejected';
  adminNote?: string; // Reason for rejection or comment
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
  category: string; // Dynamic string now
  imageUrl?: string;
  dateTimeStart: string; // ISO String
  dateTimeEnd: string; // ISO String
  location: string;
  createdBy: string;
  maxParticipants?: number;
  participants: string[]; // User IDs
  pendingParticipants: string[]; // User IDs requesting to join
  waitlist: string[]; // User IDs
  averageRating?: number;
  averageRatingCount?: number;
  
  // New Restriction Fields
  registrationMode: 'instant' | 'request';
  isRegistrationOpen: boolean; // New: Manual override to close registration
  genderRestriction: 'none' | 'male' | 'female';
  minAge?: number;
  maxAge?: number;
}

export interface EventFeedback {
  id: string;
  eventId: string;
  userId: string; // optional/null for anonymous not implemented in UI yet, keeping mandatory for logic simplicity first
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  members: string[]; // User IDs
  joinRequests: string[]; // User IDs
  moderators: string[]; // User IDs
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
  date: string; // ISO String
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
  date: string; // YYYY-MM-DD
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