import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Group, Event, Message, UserRole, Room, MentoringMatch, Announcement, Report, RoomBooking, Poll, PollVote, EventFeedback, CheckIn, AppNotification, ThemeConfig, Resource, Suggestion, CafeConfig, CoworkingDesk, CoworkingBooking, CoworkingSlotType, CoworkingRule, AppConfig, HomeConfig } from '../types';
import { supabase } from './supabase';

// --- THEME PRESETS ---
export const THEME_PRESETS: Record<string, ThemeConfig> = {
  teal: {
    id: 'teal',
    name: 'Nürnberg Petrol',
    colors: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' }
  },
  blue: {
    id: 'blue',
    name: 'Ozeanblau',
    colors: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' }
  }
};

// --- STATIC CONFIGS (Defaults) ---
const DEFAULT_CAFE_CONFIG: CafeConfig = {
  isOpen: false,
  openingHours: [
    { label: 'Mo - Fr (Co-Working)', value: '10:00 - 14:00' },
    { label: 'Mi - So (Café)', value: '14:00 - 22:00' },
    { label: 'Gebetszeiten', value: 'Immer zugänglich' }
  ],
  contact: {
    address: 'Gostenhofer Hauptstraße 12, 90443 Nürnberg',
    phone: '0911 123 456 78',
    email: 'hallo@begegnungscafe.de',
    instagram: '@begegnungscafe_nbg'
  },
  categories: [{ id: 'c1', title: 'Warme Getränke' }],
  menu: [{ id: 'm1', categoryId: 'c1', name: 'Marokkanischer Minztee', price: '2,50 €', description: 'Frische Minze, Gunpowder Tee' }],
  specialNote: 'Alle Speisen sind Halal.'
};

const DEFAULT_APP_CONFIG: AppConfig = {
  navigation: [
    { id: 'home', label: 'Home', path: '/', icon: 'Home', isVisible: true, order: 1 },
    { id: 'cafe', label: 'Café', path: '/cafe', icon: 'Coffee', isVisible: true, order: 2 },
    { id: 'coworking', label: 'Work', path: '/coworking', icon: 'Laptop', isVisible: true, order: 3 },
    { id: 'events', label: 'Events', path: '/events', icon: 'Calendar', isVisible: true, order: 4 },
    { id: 'groups', label: 'Gruppen', path: '/groups', icon: 'Users', isVisible: true, order: 6 },
  ]
};

const MOCK_ROOMS: Room[] = [
  { id: 'r1', name: 'Hauptsaal', capacity: 60, description: 'Großer Raum für Gebete.', isAvailable: true },
  { id: 'r2', name: 'Seminarraum 1', capacity: 15, description: 'Mit Beamer.', isAvailable: true },
  { id: 'r3', name: 'Küche', capacity: 25, description: 'Voll ausgestattete Küche.', isAvailable: true }
];

// --- CONTEXT SETUP ---
interface AppState {
  currentUser: User | null;
  users: User[];
  groups: Group[];
  events: Event[];
  eventCategories: string[];
  resources: Resource[];
  rooms: Room[];
  roomBookings: RoomBooking[];
  messages: Message[];
  mentoringMatches: MentoringMatch[];
  announcements: Announcement[];
  reports: Report[];
  polls: Poll[];
  pollVotes: PollVote[];
  feedbacks: EventFeedback[];
  checkIns: CheckIn[];
  notifications: AppNotification[];
  currentTheme: ThemeConfig;
  suggestions: Suggestion[];
  cafeConfig: CafeConfig;
  coworkingDesks: CoworkingDesk[];
  coworkingBookings: CoworkingBooking[];
  coworkingRules: CoworkingRule[];
  appConfig: AppConfig;
  homeConfig: HomeConfig;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  joinEvent: (eventId: string) => void;
  leaveEvent: (eventId: string) => void;
  respondToEventRequest: (eventId: string, userId: string, action: 'approve' | 'reject') => void;
  joinGroup: (groupId: string) => void;
  respondToGroupRequest: (groupId: string, userId: string, action: 'accept' | 'reject') => void;
  createGroup: (group: Omit<Group, 'id' | 'members' | 'moderators' | 'status' | 'joinRequests'>) => void;
  postMessage: (groupId: string, text: string) => void;
  createEvent: (event: Omit<Event, 'id' | 'participants' | 'waitlist' | 'pendingParticipants'>) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  addEventCategory: (category: string) => void;
  removeEventCategory: (category: string) => void;
  requestMentoring: (mentorId: string) => void;
  reportContent: (targetId: string, targetType: 'message' | 'user', reason: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  requestRoom: (booking: Omit<RoomBooking, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;
  updateBookingStatus: (bookingId: string, status: 'approved' | 'rejected', adminNote?: string) => void;
  deleteRoomRequest: (bookingId: string) => void;
  updateRoomRequest: (bookingId: string, updates: Partial<RoomBooking>) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  createPoll: (poll: Omit<Poll, 'id' | 'createdAt'>) => void;
  votePoll: (pollId: string, optionIndex: number) => void;
  submitFeedback: (feedback: Omit<EventFeedback, 'id' | 'createdAt'>) => void;
  checkInUser: (eventId: string, userId: string) => void;
  adminUpdateUserRole: (userId: string, role: UserRole) => void;
  adminUpdateOrganizerCategories: (userId: string, categories: string[]) => void;
  adminUpdateUserAllowedRooms: (userId: string, roomIds: string[]) => void; 
  adminToggleCafePermission: (userId: string) => void;
  adminUpdateMentoringStatus: (matchId: string, status: 'active' | 'completed') => void;
  adminVerifyUser: (userId: string, isVerified: boolean) => void;
  adminToggleChatRestriction: (userId: string) => void;
  adminToggleBan: (userId: string) => void;
  adminDeleteMessage: (messageId: string) => void;
  adminDismissReport: (reportId: string) => void;
  removeNotification: (id: string) => void;
  requestNotificationPermission: () => void;
  updateTheme: (themeId: string) => void;
  addResource: (resource: Omit<Resource, 'id' | 'createdAt'>) => void;
  deleteResource: (resourceId: string) => void;
  submitSuggestion: (suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'status'>) => void;
  updateSuggestionStatus: (suggestionId: string, status: 'approved' | 'rejected', response?: string) => void;
  updateCafeConfig: (updates: Partial<CafeConfig>) => void;
  bookCoworkingSlot: (deskId: string, date: string, slot: CoworkingSlotType) => void;
  cancelCoworkingBooking: (bookingId: string) => void;
  addCoworkingDesk: (desk: Omit<CoworkingDesk, 'id'>) => void;
  updateCoworkingDesk: (id: string, updates: Partial<CoworkingDesk>) => void;
  deleteCoworkingDesk: (id: string) => void;
  updateCoworkingRules: (rules: CoworkingRule[]) => void;
  updateAppConfig: (config: AppConfig) => void;
  updateHomeConfig: (config: HomeConfig) => void;
  addAnnouncement: (title: string, text: string) => void;
  deleteAnnouncement: (id: string) => void;
  sendFriendRequest: (targetId: string) => void;
  respondToFriendRequest: (requesterId: string, action: 'accept' | 'reject') => void;
  removeFriend: (friendId: string) => void;
  uploadFile: (file: File, bucket?: string) => Promise<string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
  
  // Mocks / Client-only states (for now, until tables exist for these)
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [eventCategories, setEventCategories] = useState<string[]>(['Spiritualität', 'Familie', 'Kunst', 'Bildung', 'Sonstiges']);
  const [resources, setResources] = useState<Resource[]>([]);
  const [mentoringMatches, setMentoringMatches] = useState<MentoringMatch[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);
  const [feedbacks, setFeedbacks] = useState<EventFeedback[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(THEME_PRESETS.teal);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [cafeConfig, setCafeConfig] = useState<CafeConfig>(DEFAULT_CAFE_CONFIG);
  const [coworkingDesks, setCoworkingDesks] = useState<CoworkingDesk[]>([{id: 'd1', name: 'Flex 1', capacity: 1, features: ['Power']}]);
  const [coworkingBookings, setCoworkingBookings] = useState<CoworkingBooking[]>([]);
  const [coworkingRules, setCoworkingRules] = useState<CoworkingRule[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>({
      order: ['welcome', 'events', 'cafeWidget', 'news', 'actions', 'polls'],
      welcome: { isVisible: true, title: 'Salam, {name}!', subtitle: 'Willkommen' },
      cafeWidget: { isVisible: true, title: 'Café', offerText: 'Tee', offerPrice: '1€' },
      news: { isVisible: true, title: 'Neuigkeiten' },
      actions: { isVisible: true },
      polls: { isVisible: true, title: 'Umfragen' },
      events: { isVisible: true, title: 'Events' }
  });

  // --- HELPER: MAP DB USER TO APP USER ---
  const mapDbUser = (dbUser: any): User => ({
      id: dbUser.id,
      name: dbUser.name || 'User',
      email: dbUser.email,
      role: dbUser.role as UserRole,
      avatarUrl: dbUser.avatar_url,
      bio: dbUser.bio,
      job: dbUser.job,
      hobbies: dbUser.hobbies || [],
      isVerified: dbUser.is_verified,
      isChatRestricted: dbUser.is_chat_restricted,
      accountStatus: dbUser.account_status,
      groups: [], 
      notificationSettings: { events: true, groups: true, announcements: true },
      isMentor: false,
      allowedCategories: dbUser.allowed_categories || [],
      allowedRoomIds: dbUser.allowed_room_ids || [],
      canManageCafe: dbUser.can_manage_cafe || false,
      loyaltyPoints: dbUser.loyalty_points || 0,
      friends: dbUser.friends || [],
      friendRequests: dbUser.friend_requests || [],
      privacySettings: { details: 'public', groups: 'friends', friends: 'friends' }
  });

  const mapDbEvent = (e: any): Event => ({
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      imageUrl: e.image_url,
      dateTimeStart: e.date_time_start,
      dateTimeEnd: e.date_time_end,
      location: e.location,
      createdBy: e.created_by,
      maxParticipants: e.max_participants,
      participants: e.participants || [],
      pendingParticipants: e.pending_participants || [],
      waitlist: e.waitlist || [],
      averageRating: e.average_rating,
      averageRatingCount: e.average_rating_count,
      registrationMode: e.registration_mode,
      isRegistrationOpen: e.is_registration_open,
      genderRestriction: e.gender_restriction,
      minAge: e.min_age,
      maxAge: e.max_age
  });

  // --- INITIAL DATA FETCHING ---
  useEffect(() => {
      const initData = async () => {
          setIsLoading(true);
          try {
              // 1. Check Session
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                   const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                   if (profile) setCurrentUser(mapDbUser(profile));
              }

              // 2. Load Public Data
              const { data: dbEvents } = await supabase.from('events').select('*');
              if (dbEvents) setEvents(dbEvents.map(mapDbEvent));

              const { data: dbGroups } = await supabase.from('groups').select('*');
              if (dbGroups) setGroups(dbGroups.map((g: any) => ({
                  ...g,
                  joinRequests: g.join_requests || [],
                  isConvertGroup: g.is_convert_group || false
              })));

              const { data: dbUsers } = await supabase.from('profiles').select('*');
              if (dbUsers) setUsers(dbUsers.map(mapDbUser));
              
              const { data: dbMessages } = await supabase.from('messages').select('*');
              if (dbMessages) setMessages(dbMessages.map((m: any) => ({
                  id: m.id,
                  groupID: m.group_id,
                  authorID: m.author_id,
                  authorName: m.author_name,
                  text: m.text,
                  createdAt: m.created_at
              })));

              const { data: dbBookings } = await supabase.from('room_bookings').select('*');
              if (dbBookings) setRoomBookings(dbBookings.map((b: any) => ({
                  id: b.id, roomId: b.room_id, requestedBy: b.requested_by, title: b.title,
                  startTime: b.start_time, endTime: b.end_time, status: b.status, adminNote: b.admin_note, createdAt: b.created_at
              })));

          } catch (error) {
              console.error("Error loading initial data:", error);
          }
          setIsLoading(false);
      };

      initData();

      // Auth Listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
              if (profile) setCurrentUser(mapDbUser(profile));
          } else if (event === 'SIGNED_OUT') {
              setCurrentUser(null);
          }
      });

      return () => subscription.unsubscribe();
  }, []);


  // --- UTILS ---
  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, title, message, type, category: 'system', createdAt: new Date().toISOString() }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };
  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const uploadFile = async (file: File, bucket: string = 'images'): Promise<string | null> => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
      if (uploadError) {
          addNotification("Upload Fehler", uploadError.message, "warning");
          return null;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
  };

  // --- AUTH ---
  const login = async (email: string, password?: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: password || 'password' });
    if (error) addNotification("Login fehlgeschlagen", error.message, "warning");
    else addNotification("Willkommen", "Erfolgreich eingeloggt", "success");
  };

  const signup = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
    });
    if (error) addNotification("Registrierung fehlgeschlagen", error.message, "warning");
    else addNotification("Erfolg", "Account erstellt. Du bist eingeloggt.", "success");
  };

  const logout = async () => {
      await supabase.auth.signOut();
      addNotification("Logout", "Bis bald!", "info");
  };

  // --- ACTIONS ---
  const createEvent = async (eventData: any) => {
      if (!currentUser) return;
      const { data, error } = await supabase.from('events').insert([{
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          date_time_start: eventData.dateTimeStart,
          date_time_end: eventData.dateTimeEnd,
          location: eventData.location,
          created_by: currentUser.id,
          max_participants: eventData.maxParticipants,
          image_url: eventData.imageUrl,
          registration_mode: eventData.registrationMode,
          gender_restriction: eventData.genderRestriction,
          min_age: eventData.minAge,
          max_age: eventData.maxAge
      }]).select().single();

      if (error) {
          addNotification("Fehler", error.message, "warning");
      } else if (data) {
          setEvents(prev => [...prev, mapDbEvent(data)]);
          addNotification("Erstellt", "Event veröffentlicht.", "success");
      }
  };

  const joinEvent = async (eventId: string) => {
      if (!currentUser) return;
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const newParticipants = [...event.participants, currentUser.id];
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, participants: newParticipants } : e));
      const { error } = await supabase.from('events').update({ participants: newParticipants }).eq('id', eventId);
      if (error) {
           // rollback
           setEvents(prev => prev.map(e => e.id === eventId ? event : e));
           addNotification("Fehler", "Konnte Event nicht beitreten.", "warning");
      } else {
           addNotification("Angemeldet", `Viel Spaß bei "${event.title}"`, "success");
      }
  };

  const leaveEvent = async (eventId: string) => {
      if (!currentUser) return;
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const newParticipants = event.participants.filter(id => id !== currentUser.id);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, participants: newParticipants } : e));
      await supabase.from('events').update({ participants: newParticipants }).eq('id', eventId);
      addNotification("Abgemeldet", "Teilnahme storniert.", "info");
  };

  const postMessage = async (groupId: string, text: string) => {
      if (!currentUser) return;
      const { data } = await supabase.from('messages').insert([{
          group_id: groupId,
          author_id: currentUser.id,
          author_name: currentUser.name,
          text
      }]).select().single();

      if (data) {
          setMessages(prev => [...prev, {
              id: data.id, groupID: data.group_id, authorID: data.author_id, authorName: data.author_name, text: data.text, createdAt: data.created_at
          }]);
      }
  };

  const joinGroup = async (groupId: string) => {
      if (!currentUser) return;
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      if (group.type === 'private') {
          const newRequests = [...group.joinRequests, currentUser.id];
          setGroups(prev => prev.map(g => g.id === groupId ? { ...g, joinRequests: newRequests } : g));
          await supabase.from('groups').update({ join_requests: newRequests }).eq('id', groupId);
          addNotification("Anfrage", "Beitrittsanfrage gesendet.", "info");
      } else {
          const newMembers = [...group.members, currentUser.id];
          setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: newMembers } : g));
          await supabase.from('groups').update({ members: newMembers }).eq('id', groupId);
          addNotification("Erfolg", "Gruppe beigetreten.", "success");
      }
  };

  const createGroup = async (groupData: any) => {
      if (!currentUser) return;
      const { data } = await supabase.from('groups').insert([{
          name: groupData.name,
          description: groupData.description,
          type: groupData.type,
          members: [currentUser.id],
          moderators: [currentUser.id]
      }]).select().single();

      if (data) {
          setGroups(prev => [...prev, { ...data, joinRequests: [], isConvertGroup: data.is_convert_group }]);
          addNotification("Gruppe erstellt", data.name, "success");
      }
  };

  const requestRoom = async (bookingData: any) => {
      if (!currentUser) return false;
      const { data } = await supabase.from('room_bookings').insert([{
          room_id: bookingData.roomId,
          requested_by: currentUser.id,
          title: bookingData.title,
          start_time: bookingData.startTime,
          end_time: bookingData.endTime
      }]).select().single();

      if (data) {
          setRoomBookings(prev => [...prev, {
              id: data.id, roomId: data.room_id, requestedBy: data.requested_by, title: data.title,
              startTime: data.start_time, endTime: data.end_time, status: data.status, createdAt: data.created_at
          }]);
          addNotification("Anfrage gesendet", "Ein Admin wird sie prüfen.", "success");
          return true;
      }
      return false;
  };

  const updateBookingStatus = async (bookingId: string, status: 'approved' | 'rejected', note?: string) => {
      const { error } = await supabase.from('room_bookings').update({ status, admin_note: note }).eq('id', bookingId);
      if (!error) {
          setRoomBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status, adminNote: note } : b));
          addNotification("Status aktualisiert", `Buchung ${status === 'approved' ? 'genehmigt' : 'abgelehnt'}.`, "success");
      }
  };
  
  const updateProfile = async (updates: Partial<User>) => {
      if (!currentUser) return;
      
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.bio) dbUpdates.bio = updates.bio;
      if (updates.job) dbUpdates.job = updates.job;
      if (updates.hobbies) dbUpdates.hobbies = updates.hobbies;
      if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;

      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', currentUser.id);
      
      if (!error) {
          setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updates } : u));
          addNotification("Profil", "Änderungen gespeichert.", "success");
      } else {
          addNotification("Fehler", "Speichern fehlgeschlagen.", "warning");
      }
  };


  // --- MOCK / CLIENT-SIDE ONLY ACTIONS (No DB Tables yet) ---
  const updateTheme = (id: string) => setCurrentTheme(THEME_PRESETS[id]); 
  const createPoll = (poll: any) => setPolls(prev => [...prev, { ...poll, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
  const votePoll = (pollId: string, optIdx: number) => {
      if(!currentUser) return;
      setPollVotes(prev => {
          const existing = prev.find(v => v.pollId === pollId && v.userId === currentUser.id);
          if (existing) return prev.map(v => v.id === existing.id ? { ...v, optionIndex: optIdx } : v);
          return [...prev, { id: Date.now().toString(), pollId, userId: currentUser.id, optionIndex: optIdx, createdAt: new Date().toISOString() }];
      });
  };
  const submitFeedback = (fb: any) => {
      setFeedbacks(prev => [...prev, { ...fb, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
      addNotification("Danke", "Feedback gesendet.", "success");
  };
  const addAnnouncement = (t: string, txt: string) => setAnnouncements(prev => [...prev, {id: Date.now().toString(), title: t, text: txt, date: new Date().toISOString()}]);
  const deleteAnnouncement = (id: string) => setAnnouncements(prev => prev.filter(a => a.id !== id));
  
  // Placeholders
  const respondToEventRequest = () => {}; 
  const respondToGroupRequest = () => {}; 
  const updateEvent = () => {}; 
  const addEventCategory = () => {}; 
  const removeEventCategory = () => {}; 
  const requestMentoring = () => {}; 
  const reportContent = () => {}; 
  const deleteRoomRequest = (id: string) => setRoomBookings(prev => prev.filter(b => b.id !== id)); 
  const updateRoomRequest = () => {}; 
  const addRoom = (r: any) => setRooms(prev => [...prev, { ...r, id: Date.now().toString() }]); 
  const updateRoom = (id: string, u: any) => setRooms(prev => prev.map(r => r.id === id ? { ...r, ...u } : r)); 
  const deleteRoom = (id: string) => setRooms(prev => prev.filter(r => r.id !== id)); 
  const checkInUser = (eid: string, uid: string) => setCheckIns(prev => [...prev, { id: Date.now().toString(), eventId: eid, userId: uid, timestamp: new Date().toISOString() }]); 
  const adminUpdateUserRole = (uid: string, role: UserRole) => {
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, role } : u));
      if (currentUser?.id === uid) setCurrentUser(prev => prev ? { ...prev, role } : null);
  }; 
  const adminUpdateOrganizerCategories = () => {}; 
  const adminUpdateUserAllowedRooms = () => {}; 
  const adminToggleCafePermission = () => {}; 
  const adminUpdateMentoringStatus = () => {}; 
  const adminVerifyUser = (uid: string, v: boolean) => {
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, isVerified: v } : u));
      if (currentUser?.id === uid) setCurrentUser(prev => prev ? { ...prev, isVerified: v } : null);
  }; 
  const adminToggleChatRestriction = () => {}; 
  const adminToggleBan = () => {}; 
  const adminDeleteMessage = () => {}; 
  const adminDismissReport = () => {}; 
  const requestNotificationPermission = () => {}; 
  const addResource = () => {}; 
  const deleteResource = () => {}; 
  const submitSuggestion = (s: any) => setSuggestions(prev => [...prev, { ...s, id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'new' }]); 
  const updateSuggestionStatus = (id: string, s: any, r?: string) => setSuggestions(prev => prev.map(sug => sug.id === id ? { ...sug, status: s, adminResponse: r } : sug)); 
  const updateCafeConfig = (c: any) => setCafeConfig(prev => ({...prev, ...c})); 
  const bookCoworkingSlot = (deskId: string, date: string, slot: any) => {
      if(!currentUser) return;
      setCoworkingBookings(prev => [...prev, { id: Date.now().toString(), userId: currentUser.id, deskId, date, slot, status: 'active', createdAt: new Date().toISOString() }]);
      addNotification("Gebucht", "Platz reserviert.", "success");
  }; 
  const cancelCoworkingBooking = (id: string) => setCoworkingBookings(prev => prev.filter(b => b.id !== id)); 
  const addCoworkingDesk = () => {}; 
  const updateCoworkingDesk = () => {}; 
  const deleteCoworkingDesk = () => {}; 
  const updateCoworkingRules = (r: any) => setCoworkingRules(r); 
  const updateAppConfig = (c: any) => setAppConfig(c); 
  const updateHomeConfig = (c: any) => setHomeConfig(c); 
  const sendFriendRequest = (tid: string) => {
      if(!currentUser) return;
      setUsers(prev => prev.map(u => u.id === tid ? { ...u, friendRequests: [...u.friendRequests, currentUser.id] } : u));
      addNotification("Gesendet", "Anfrage verschickt.", "success");
  }; 
  const respondToFriendRequest = (rid: string, action: 'accept'|'reject') => {
      if(!currentUser) return;
      if(action === 'accept') {
          setCurrentUser(prev => prev ? { ...prev, friends: [...prev.friends, rid], friendRequests: prev.friendRequests.filter(id => id !== rid) } : null);
          setUsers(prev => prev.map(u => u.id === rid ? { ...u, friends: [...u.friends, currentUser.id] } : u));
          addNotification("Verbunden", "Ihr seid jetzt Freunde.", "success");
      } else {
          setCurrentUser(prev => prev ? { ...prev, friendRequests: prev.friendRequests.filter(id => id !== rid) } : null);
      }
  }; 
  const removeFriend = (fid: string) => {
      if(!currentUser) return;
      setCurrentUser(prev => prev ? { ...prev, friends: prev.friends.filter(id => id !== fid) } : null);
      setUsers(prev => prev.map(u => u.id === fid ? { ...u, friends: u.friends.filter(id => id !== currentUser.id) } : u));
  }; 

  return (
    <AppContext.Provider value={{
      currentUser, users, groups, events, eventCategories, rooms, roomBookings, messages, mentoringMatches, announcements, reports, polls, pollVotes, feedbacks, checkIns, notifications, currentTheme, resources, suggestions, cafeConfig, coworkingDesks, coworkingBookings, coworkingRules, appConfig, homeConfig, isLoading,
      login, signup, logout, joinEvent, leaveEvent, respondToEventRequest, joinGroup, respondToGroupRequest, createGroup, postMessage, createEvent, updateEvent, addEventCategory, removeEventCategory, requestMentoring, reportContent, updateProfile, requestRoom, updateBookingStatus, deleteRoomRequest, updateRoomRequest, addRoom, updateRoom, deleteRoom, createPoll, votePoll, submitFeedback, checkInUser,
      adminUpdateUserRole, adminUpdateOrganizerCategories, adminUpdateUserAllowedRooms, adminToggleCafePermission, adminUpdateMentoringStatus, adminVerifyUser, adminToggleChatRestriction, adminToggleBan, adminDeleteMessage, adminDismissReport, removeNotification, requestNotificationPermission, updateTheme, addResource, deleteResource, submitSuggestion, updateSuggestionStatus, updateCafeConfig,
      bookCoworkingSlot, cancelCoworkingBooking, addCoworkingDesk, updateCoworkingDesk, deleteCoworkingDesk, updateCoworkingRules, updateAppConfig, updateHomeConfig, addAnnouncement, deleteAnnouncement,
      sendFriendRequest, respondToFriendRequest, removeFriend, uploadFile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};