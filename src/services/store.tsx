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

const DEFAULT_HOME_CONFIG: HomeConfig = {
    order: ['welcome', 'events', 'cafeWidget', 'news', 'actions', 'polls'],
    welcome: { isVisible: true, title: 'Salam, {name}!', subtitle: 'Willkommen' },
    cafeWidget: { isVisible: true, title: 'Café', offerText: 'Tee', offerPrice: '1€' },
    news: { isVisible: true, title: 'Neuigkeiten' },
    actions: { isVisible: true },
    polls: { isVisible: true, title: 'Umfragen' },
    events: { isVisible: true, title: 'Events' }
};

const DEFAULT_COWORKING_RULES: CoworkingRule[] = [
    {id: 'r1', icon: 'wifi', title: 'Free WiFi', text: 'Netzwerk: CafeGuest, Code: bismillah'},
    {id: 'r2', icon: 'volume', title: 'Ruhezone', text: 'Bitte leise sprechen.'}
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

interface CreateEventData extends Omit<Event, 'id' | 'participants' | 'waitlist' | 'pendingParticipants' | 'seriesId' | 'recurrenceRule'> {
    recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrenceEnd?: string;
}

interface AppContextType extends AppState {
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  uploadFile: (file: File, bucket?: string) => Promise<string | null>;
  joinEvent: (eventId: string) => void;
  leaveEvent: (eventId: string) => void;
  respondToEventRequest: (eventId: string, userId: string, action: 'approve' | 'reject') => void;
  joinGroup: (groupId: string) => void;
  respondToGroupRequest: (groupId: string, userId: string, action: 'accept' | 'reject') => void;
  createGroup: (group: Omit<Group, 'id' | 'members' | 'moderators' | 'status' | 'joinRequests'>) => void;
  postMessage: (groupId: string, text: string) => void;
  createEvent: (event: CreateEventData) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  addEventCategory: (category: string) => void;
  removeEventCategory: (category: string) => void;
  requestMentoring: (mentorId: string) => void;
  reportContent: (targetId: string, targetType: 'message' | 'user', reason: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  requestRoom: (booking: Omit<RoomBooking, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;
  checkRoomAvailability: (roomId: string, start: string, end: string, excludeBookingId?: string) => boolean;
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [mentoringMatches, setMentoringMatches] = useState<MentoringMatch[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);
  const [feedbacks, setFeedbacks] = useState<EventFeedback[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [coworkingDesks, setCoworkingDesks] = useState<CoworkingDesk[]>([]);
  const [coworkingBookings, setCoworkingBookings] = useState<CoworkingBooking[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // Config States (Persisted via app_settings)
  const [cafeConfig, setCafeConfig] = useState<CafeConfig>(DEFAULT_CAFE_CONFIG);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [coworkingRules, setCoworkingRules] = useState<CoworkingRule[]>(DEFAULT_COWORKING_RULES);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(THEME_PRESETS.teal);

  // Local States
  const [eventCategories, setEventCategories] = useState<string[]>(['Spiritualität', 'Familie', 'Kunst', 'Bildung', 'Sonstiges']);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // --- HELPER: MAP DB OBJECTS ---
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
      privacySettings: dbUser.privacy_settings || { details: 'public', groups: 'friends', friends: 'friends' }
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
      maxAge: e.max_age,
      seriesId: e.series_id,
      recurrenceRule: e.recurrence_rule
  });
  
  const mapDbMessage = (m: any): Message => ({
      id: m.id,
      groupID: m.group_id,
      authorID: m.author_id,
      authorName: m.author_name,
      text: m.text,
      createdAt: m.created_at
  });
  
  const mapDbRoom = (r: any): Room => ({
      id: r.id,
      name: r.name,
      capacity: r.capacity,
      description: r.description,
      isAvailable: r.is_available
  });

  // --- PERSISTENCE HELPER ---
  const saveSetting = async (key: string, value: any) => {
      // Upsert to app_settings
      const { error } = await supabase.from('app_settings').upsert({ key, value });
      if(error) console.error("Failed to save setting", key, error);
  };

  // --- INITIAL DATA FETCHING & REALTIME SUBSCRIPTIONS ---
  useEffect(() => {
      const initData = async () => {
          setIsLoading(true);
          try {
              // 1. Configs
              const { data: dbSettings } = await supabase.from('app_settings').select('*');
              if (dbSettings) {
                  dbSettings.forEach(row => {
                      if(row.key === 'cafe_config') setCafeConfig(row.value);
                      if(row.key === 'app_config') setAppConfig(row.value);
                      if(row.key === 'home_config') setHomeConfig(row.value);
                      if(row.key === 'coworking_rules') setCoworkingRules(row.value);
                      if(row.key === 'theme_id' && THEME_PRESETS[row.value]) setCurrentTheme(THEME_PRESETS[row.value]);
                      if(row.key === 'event_categories') setEventCategories(row.value);
                  });
              }

              // 2. Auth & Data
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                   const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                   if (profile) setCurrentUser(mapDbUser(profile));
              }

              const { data: dbEvents } = await supabase.from('events').select('*');
              if (dbEvents) setEvents(dbEvents.map(mapDbEvent));

              const { data: dbGroups } = await supabase.from('groups').select('*');
              if (dbGroups) setGroups(dbGroups.map((g: any) => ({ ...g, joinRequests: g.join_requests || [], isConvertGroup: g.is_convert_group || false })));

              const { data: dbUsers } = await supabase.from('profiles').select('*');
              if (dbUsers) setUsers(dbUsers.map(mapDbUser));
              
              const { data: dbMessages } = await supabase.from('messages').select('*');
              if (dbMessages) setMessages(dbMessages.map(mapDbMessage));

              const { data: dbRooms } = await supabase.from('rooms').select('*');
              if (dbRooms) setRooms(dbRooms.map(mapDbRoom));

              const { data: dbBookings } = await supabase.from('room_bookings').select('*');
              if (dbBookings) setRoomBookings(dbBookings.map((b: any) => ({ id: b.id, roomId: b.room_id, requestedBy: b.requested_by, title: b.title, startTime: b.start_time, endTime: b.end_time, status: b.status, adminNote: b.admin_note, createdAt: b.created_at })));
              
              const { data: dbResources } = await supabase.from('resources').select('*');
              if(dbResources) setResources(dbResources.map((r:any) => ({ id: r.id, eventId: r.event_id, title: r.title, type: r.type, url: r.url, description: r.description, uploadedBy: r.uploaded_by, createdAt: r.created_at })));

              const { data: dbPolls } = await supabase.from('polls').select('*');
              if(dbPolls) setPolls(dbPolls.map((p:any) => ({ id: p.id, question: p.question, options: p.options, scope: p.scope, targetGroupId: p.target_group_id, createdBy: p.created_by, createdAt: p.created_at })));

              const { data: dbVotes } = await supabase.from('poll_votes').select('*');
              if(dbVotes) setPollVotes(dbVotes.map((v:any) => ({ id: v.id, pollId: v.poll_id, userId: v.user_id, optionIndex: v.option_index, createdAt: v.created_at })));

              const { data: dbMentoring } = await supabase.from('mentoring_matches').select('*');
              if(dbMentoring) setMentoringMatches(dbMentoring.map((m:any) => ({ id: m.id, menteeID: m.mentee_id, mentorID: m.mentor_id, status: m.status, createdAt: m.created_at })));
              
              const { data: dbSuggestions } = await supabase.from('suggestions').select('*');
              if(dbSuggestions) setSuggestions(dbSuggestions.map((s:any) => ({ id: s.id, userId: s.user_id, type: s.type, title: s.title, description: s.description, status: s.status, adminResponse: s.admin_response, contactPhone: s.contact_phone, contactEmail: s.contact_email, createdAt: s.created_at })));
              
              const { data: dbDesks } = await supabase.from('coworking_desks').select('*');
              if(dbDesks) setCoworkingDesks(dbDesks.map((d:any) => ({ id: d.id, name: d.name, capacity: d.capacity, features: d.features || [] })));

              const { data: dbCBooking } = await supabase.from('coworking_bookings').select('*');
              if(dbCBooking) setCoworkingBookings(dbCBooking.map((b:any) => ({ id: b.id, userId: b.user_id, deskId: b.desk_id, date: b.date, slot: b.slot, status: b.status, createdAt: b.created_at })));
              
              const { data: dbCheckins } = await supabase.from('check_ins').select('*');
              if(dbCheckins) setCheckIns(dbCheckins.map((c:any) => ({ id: c.id, eventId: c.event_id, userId: c.user_id, timestamp: c.timestamp })));

              const { data: dbAnnounce } = await supabase.from('announcements').select('*');
              if(dbAnnounce) setAnnouncements(dbAnnounce.map((a:any) => ({ id: a.id, title: a.title, text: a.text, date: a.date })));

              const { data: dbReports } = await supabase.from('reports').select('*');
              if(dbReports) setReports(dbReports.map((r:any) => ({ id: r.id, reporterId: r.reporter_id, targetId: r.target_id, targetType: r.target_type, reason: r.reason, status: r.status, createdAt: r.created_at })));

          } catch (error) {
              console.error("Error loading initial data:", error);
          }
          setIsLoading(false);
      };

      initData();
      
      // --- REALTIME SUBSCRIPTION ---
      const realtimeChannel = supabase.channel('public:db-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
           setMessages(prev => [...prev, mapDbMessage(payload.new)]);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
            if(payload.eventType === 'INSERT') setRooms(prev => [...prev, mapDbRoom(payload.new)]);
            if(payload.eventType === 'UPDATE') setRooms(prev => prev.map(r => r.id === payload.new.id ? mapDbRoom(payload.new) : r));
            if(payload.eventType === 'DELETE') setRooms(prev => prev.filter(r => r.id !== payload.old.id));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
            const row = payload.new as any;
            if(row && row.key === 'cafe_config') setCafeConfig(row.value);
            if(row && row.key === 'app_config') setAppConfig(row.value);
            if(row && row.key === 'home_config') setHomeConfig(row.value);
            if(row && row.key === 'coworking_rules') setCoworkingRules(row.value);
            if(row && row.key === 'theme_id' && THEME_PRESETS[row.value]) setCurrentTheme(THEME_PRESETS[row.value]);
            if(row && row.key === 'event_categories') setEventCategories(row.value);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_bookings' }, (payload) => {
            if(payload.eventType === 'INSERT') setRoomBookings(prev => [...prev, { id: payload.new.id, roomId: payload.new.room_id, requestedBy: payload.new.requested_by, title: payload.new.title, startTime: payload.new.start_time, endTime: payload.new.end_time, status: payload.new.status, adminNote: payload.new.admin_note, createdAt: payload.new.created_at }]);
            if(payload.eventType === 'UPDATE') setRoomBookings(prev => prev.map(b => b.id === payload.new.id ? { ...b, status: payload.new.status, adminNote: payload.new.admin_note, title: payload.new.title, startTime: payload.new.start_time, endTime: payload.new.end_time } : b));
            if(payload.eventType === 'DELETE') setRoomBookings(prev => prev.filter(b => b.id !== payload.old.id));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
             // Basic realtime for events table
            if(payload.eventType === 'INSERT') setEvents(prev => [...prev, mapDbEvent(payload.new)]);
            if(payload.eventType === 'UPDATE') setEvents(prev => prev.map(e => e.id === payload.new.id ? mapDbEvent(payload.new) : e));
            if(payload.eventType === 'DELETE') setEvents(prev => prev.filter(e => e.id !== payload.old.id));
        })
        .subscribe();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
              if (profile) setCurrentUser(mapDbUser(profile));
          } else if (event === 'SIGNED_OUT') {
              setCurrentUser(null);
          }
      });

      return () => {
          subscription.unsubscribe();
          supabase.removeChannel(realtimeChannel);
      };
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
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) addNotification("Registrierung fehlgeschlagen", error.message, "warning");
    else addNotification("Erfolg", "Account erstellt. Du bist eingeloggt.", "success");
  };

  const logout = async () => {
      await supabase.auth.signOut();
      addNotification("Logout", "Bis bald!", "info");
  };

  // --- ACTIONS ---
  const createEvent = async (eventData: CreateEventData) => {
      if (!currentUser) return;

      // Base payload
      const basePayload = {
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          location: eventData.location,
          created_by: currentUser.id,
          max_participants: eventData.maxParticipants,
          image_url: eventData.imageUrl,
          registration_mode: eventData.registrationMode,
          gender_restriction: eventData.genderRestriction,
          min_age: eventData.minAge,
          max_age: eventData.maxAge,
          series_id: null as string | null,
          recurrence_rule: eventData.recurrence === 'none' ? null : eventData.recurrence
      };

      let rowsToInsert = [];

      if (!eventData.recurrence || eventData.recurrence === 'none') {
          // Single event
          rowsToInsert.push({
              ...basePayload,
              date_time_start: eventData.dateTimeStart,
              date_time_end: eventData.dateTimeEnd
          });
      } else if (eventData.recurrenceEnd) {
          // Recurring event
          const seriesId = crypto.randomUUID();
          basePayload.series_id = seriesId;

          const startDate = new Date(eventData.dateTimeStart);
          const endDate = new Date(eventData.dateTimeEnd);
          const untilDate = new Date(eventData.recurrenceEnd);
          // Set untilDate to end of day to ensure inclusive comparison
          untilDate.setHours(23, 59, 59, 999);

          let currentStart = new Date(startDate);
          let currentEnd = new Date(endDate);

          // Safety breaker to prevent infinite loops
          let count = 0;
          const MAX_OCCURRENCES = 52; // Limit to ~1 year of weekly events

          while (currentStart <= untilDate && count < MAX_OCCURRENCES) {
              rowsToInsert.push({
                  ...basePayload,
                  date_time_start: currentStart.toISOString(),
                  date_time_end: currentEnd.toISOString()
              });

              // Calculate next date
              if (eventData.recurrence === 'daily') {
                  currentStart.setDate(currentStart.getDate() + 1);
                  currentEnd.setDate(currentEnd.getDate() + 1);
              } else if (eventData.recurrence === 'weekly') {
                  currentStart.setDate(currentStart.getDate() + 7);
                  currentEnd.setDate(currentEnd.getDate() + 7);
              } else if (eventData.recurrence === 'monthly') {
                  currentStart.setMonth(currentStart.getMonth() + 1);
                  currentEnd.setMonth(currentEnd.getMonth() + 1);
              }
              count++;
          }
      }

      if (rowsToInsert.length === 0) return;

      const { data, error } = await supabase.from('events').insert(rowsToInsert).select();

      if (error) {
          addNotification("Fehler", error.message, "warning");
      } else if (data) {
          // setEvents handled by realtime now, but for immediate feedback on large batches:
          addNotification("Erstellt", `${rowsToInsert.length} Event(s) veröffentlicht.`, "success");
      }
  };
  
  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.dateTimeStart) dbUpdates.date_time_start = updates.dateTimeStart;
      if (updates.dateTimeEnd) dbUpdates.date_time_end = updates.dateTimeEnd;
      if (updates.location) dbUpdates.location = updates.location;
      if (updates.maxParticipants) dbUpdates.max_participants = updates.maxParticipants;
      if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
      if (updates.isRegistrationOpen !== undefined) dbUpdates.is_registration_open = updates.isRegistrationOpen;
      
      const { error } = await supabase.from('events').update(dbUpdates).eq('id', eventId);
      
      if (!error) {
          // Optimistic update handled by Realtime or manual setEvents if preferred
          addNotification("Event", "Änderungen gespeichert.", "success");
      }
  };

  const joinEvent = async (eventId: string) => {
      if (!currentUser) return;
      const event = events.find(e => e.id === eventId);
      if (!event) return;
      
      let newParticipants = event.participants;
      let newPending = event.pendingParticipants;
      
      if (event.registrationMode === 'request') {
          if (!newPending.includes(currentUser.id)) newPending = [...newPending, currentUser.id];
           await supabase.from('events').update({ pending_participants: newPending }).eq('id', eventId);
           // Realtime updates state
           addNotification("Anfrage", "Teilnahme angefragt.", "info");
      } else {
          if (!newParticipants.includes(currentUser.id)) newParticipants = [...newParticipants, currentUser.id];
          const { error } = await supabase.from('events').update({ participants: newParticipants }).eq('id', eventId);
          if (error) {
               addNotification("Fehler", "Konnte Event nicht beitreten.", "warning");
          } else {
               addNotification("Angemeldet", `Viel Spaß bei "${event.title}"`, "success");
          }
      }
  };

  const respondToEventRequest = async (eventId: string, userId: string, action: 'approve' | 'reject') => {
      const event = events.find(e => e.id === eventId);
      if (!event) return;
      
      let newPending = event.pendingParticipants.filter(id => id !== userId);
      let newParticipants = event.participants;
      
      if (action === 'approve') {
          if (!newParticipants.includes(userId)) newParticipants = [...newParticipants, userId];
      }
      
      const { error } = await supabase.from('events').update({ 
          pending_participants: newPending, 
          participants: newParticipants 
      }).eq('id', eventId);
      
      if (!error) {
           addNotification("Erfolg", `Anfrage ${action === 'approve' ? 'bestätigt' : 'abgelehnt'}.`, "success");
      }
  };

  const leaveEvent = async (eventId: string) => {
      if (!currentUser) return;
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const newParticipants = event.participants.filter(id => id !== currentUser.id);
      const newPending = event.pendingParticipants.filter(id => id !== currentUser.id);
      const newWaitlist = event.waitlist.filter(id => id !== currentUser.id);
      
      await supabase.from('events').update({ participants: newParticipants, pending_participants: newPending, waitlist: newWaitlist }).eq('id', eventId);
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
      // Realtime subscription will update local state
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
  
  const respondToGroupRequest = async (groupId: string, userId: string, action: 'accept' | 'reject') => {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      let newMembers = group.members;
      let newRequests = group.joinRequests.filter(id => id !== userId);

      if (action === 'accept') {
          if (!newMembers.includes(userId)) newMembers = [...newMembers, userId];
      }

      const updates = { members: newMembers, join_requests: newRequests };
      const { error } = await supabase.from('groups').update(updates).eq('id', groupId);
      
      if (!error) {
          setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: newMembers, joinRequests: newRequests } : g));
          addNotification("Erfolg", `Anfrage ${action === 'accept' ? 'angenommen' : 'abgelehnt'}.`, "success");
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

  // --- ROOM MANAGEMENT ---
  const addRoom = async (room: Omit<Room, 'id'>) => {
      await supabase.from('rooms').insert([{
          name: room.name,
          capacity: room.capacity,
          description: room.description,
          is_available: room.isAvailable
      }]);
  };

  const updateRoom = async (roomId: string, updates: Partial<Room>) => {
      const dbUpdates: any = {};
      if(updates.name) dbUpdates.name = updates.name;
      if(updates.capacity) dbUpdates.capacity = updates.capacity;
      if(updates.description) dbUpdates.description = updates.description;
      if(updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
      await supabase.from('rooms').update(dbUpdates).eq('id', roomId);
  };

  const deleteRoom = async (roomId: string) => {
      await supabase.from('rooms').delete().eq('id', roomId);
  };

  const checkRoomAvailability = (roomId: string, start: string, end: string, excludeBookingId?: string) => {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      
      const conflict = roomBookings.find(b => {
          if (excludeBookingId && b.id === excludeBookingId) return false;
          if (b.roomId !== roomId) return false;
          if (b.status === 'rejected') return false; // Rejected bookings don't block
          
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();
          
          // Overlap logic: (StartA < EndB) and (EndA > StartB)
          return (startTime < bEnd && endTime > bStart);
      });
      
      return !conflict; // Returns true if available, false if conflict
  };

  const requestRoom = async (bookingData: any) => {
      if (!currentUser) return false;
      
      // Check availability
      if (!checkRoomAvailability(bookingData.roomId, bookingData.startTime, bookingData.endTime)) {
          addNotification("Fehler", "Raum ist zu dieser Zeit bereits belegt.", "warning");
          return false;
      }

      const { data } = await supabase.from('room_bookings').insert([{
          room_id: bookingData.roomId,
          requested_by: currentUser.id,
          title: bookingData.title,
          start_time: bookingData.startTime,
          end_time: bookingData.endTime
      }]).select().single();

      if (data) {
          // Realtime will add to state
          addNotification("Anfrage gesendet", "Ein Admin wird sie prüfen.", "success");
          return true;
      }
      return false;
  };

  const updateBookingStatus = async (bookingId: string, status: 'approved' | 'rejected', note?: string) => {
      await supabase.from('room_bookings').update({ status, admin_note: note }).eq('id', bookingId);
  };
  
  const updateRoomRequest = async (bookingId: string, updates: Partial<RoomBooking>) => {
      const dbUpdates: any = {};
      if(updates.title) dbUpdates.title = updates.title;
      if(updates.startTime) dbUpdates.start_time = updates.startTime;
      if(updates.endTime) dbUpdates.end_time = updates.endTime;
      
      // Check if time changed and valid
      if (updates.startTime && updates.endTime) {
          const booking = roomBookings.find(b => b.id === bookingId);
          if (booking && !checkRoomAvailability(booking.roomId, updates.startTime, updates.endTime, bookingId)) {
              addNotification("Konflikt", "Zeitraum ist belegt.", "warning");
              return;
          }
      }
      
      await supabase.from('room_bookings').update(dbUpdates).eq('id', bookingId);
      addNotification("Buchung", "Aktualisiert.", "success");
  };

  const deleteRoomRequest = async (bookingId: string) => {
      await supabase.from('room_bookings').delete().eq('id', bookingId);
      addNotification("Buchung", "Gelöscht.", "info");
  };

  // --- PROFILE MANAGEMENT ---
  const updateProfile = async (updates: Partial<User>) => {
      if (!currentUser) return;
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.bio) dbUpdates.bio = updates.bio;
      if (updates.job) dbUpdates.job = updates.job;
      if (updates.hobbies) dbUpdates.hobbies = updates.hobbies;
      if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.privacySettings) dbUpdates.privacy_settings = updates.privacySettings;
      if (updates.notificationSettings) dbUpdates.notification_settings = updates.notificationSettings;

      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', currentUser.id);
      
      if (!error) {
          setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updates } : u));
          addNotification("Profil", "Änderungen gespeichert.", "success");
      } else {
          addNotification("Fehler", "Speichern fehlgeschlagen.", "warning");
      }
  };

  // --- CONFIG ACTIONS ---
  const updateTheme = (id: string) => {
      setCurrentTheme(THEME_PRESETS[id]);
      saveSetting('theme_id', id);
  }; 
  
  const updateCafeConfig = (c: Partial<CafeConfig>) => {
      const newConfig = { ...cafeConfig, ...c };
      setCafeConfig(newConfig);
      saveSetting('cafe_config', newConfig);
  }; 
  
  const updateCoworkingRules = (r: CoworkingRule[]) => {
      setCoworkingRules(r);
      saveSetting('coworking_rules', r);
  }; 
  
  const updateAppConfig = (c: AppConfig) => {
      setAppConfig(c);
      saveSetting('app_config', c);
  }; 
  
  const updateHomeConfig = (c: HomeConfig) => {
      setHomeConfig(c);
      saveSetting('home_config', c);
  }; 
  
  const addEventCategory = (category: string) => {
      const newCats = [...eventCategories, category];
      setEventCategories(newCats);
      saveSetting('event_categories', newCats);
  };
  
  const removeEventCategory = (category: string) => {
      const newCats = eventCategories.filter(c => c !== category);
      setEventCategories(newCats);
      saveSetting('event_categories', newCats);
  };

  // --- OTHER DB ACTIONS ---
  const createPoll = async (poll: Omit<Poll, 'id'|'createdAt'>) => {
      if(!currentUser) return;
      const { data } = await supabase.from('polls').insert([{
          question: poll.question,
          options: poll.options,
          scope: poll.scope,
          target_group_id: poll.targetGroupId,
          created_by: currentUser.id
      }]).select().single();

      if(data) {
         setPolls(prev => [...prev, { id: data.id, question: data.question, options: data.options, scope: data.scope, targetGroupId: data.target_group_id, createdBy: data.created_by, createdAt: data.created_at }]);
         addNotification("Umfrage", "Erstellt", "success");
      }
  };

  const votePoll = async (pollId: string, optionIndex: number) => {
      if(!currentUser) return;
      const existingVote = pollVotes.find(v => v.pollId === pollId && v.userId === currentUser.id);
      
      if(existingVote) {
          const { error } = await supabase.from('poll_votes').update({ option_index: optionIndex }).eq('id', existingVote.id);
          if(!error) setPollVotes(prev => prev.map(v => v.id === existingVote.id ? { ...v, optionIndex } : v));
      } else {
          const { data } = await supabase.from('poll_votes').insert([{ poll_id: pollId, user_id: currentUser.id, option_index: optionIndex }]).select().single();
          if(data) setPollVotes(prev => [...prev, { id: data.id, pollId: data.poll_id, userId: data.user_id, optionIndex: data.option_index, createdAt: data.created_at }]);
      }
  };

  const addResource = async (resource: Omit<Resource, 'id' | 'createdAt'>) => {
      if(!currentUser) return;
      const { data } = await supabase.from('resources').insert([{
          event_id: resource.eventId,
          title: resource.title,
          type: resource.type,
          url: resource.url,
          description: resource.description,
          uploaded_by: currentUser.id
      }]).select().single();

      if(data) {
          setResources(prev => [...prev, { id: data.id, eventId: data.event_id, title: data.title, type: data.type, url: data.url, description: data.description, uploadedBy: data.uploaded_by, createdAt: data.created_at }]);
          addNotification("Upload", "Ressource hinzugefügt.", "success");
      }
  };

  const deleteResource = async (resourceId: string) => {
      const { error } = await supabase.from('resources').delete().eq('id', resourceId);
      if(!error) setResources(prev => prev.filter(r => r.id !== resourceId));
  };

  const submitSuggestion = async (suggestion: any) => {
      const { data } = await supabase.from('suggestions').insert([{
          user_id: suggestion.userId,
          type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          contact_phone: suggestion.contactPhone,
          contact_email: suggestion.contactEmail
      }]).select().single();
      
      if(data) {
          setSuggestions(prev => [...prev, { id: data.id, userId: data.user_id, type: data.type, title: data.title, description: data.description, status: data.status, adminResponse: data.admin_response, contactPhone: data.contact_phone, contactEmail: data.contact_email, createdAt: data.created_at }]);
          addNotification("Danke", "Vorschlag eingereicht.", "success");
      }
  };
  
  const updateSuggestionStatus = async (suggestionId: string, status: 'approved'|'rejected', response?: string) => {
      const { error } = await supabase.from('suggestions').update({ status, admin_response: response }).eq('id', suggestionId);
      if(!error) {
          setSuggestions(prev => prev.map(s => s.id === suggestionId ? { ...s, status, adminResponse: response } : s));
      }
  };

  const requestMentoring = async (mentorId: string) => {
      if(!currentUser) return;
      const { data } = await supabase.from('mentoring_matches').insert([{
          mentee_id: currentUser.id,
          mentor_id: mentorId
      }]).select().single();
      
      if(data) {
          setMentoringMatches(prev => [...prev, { id: data.id, menteeID: data.mentee_id, mentorID: data.mentor_id, status: data.status, createdAt: data.created_at }]);
          addNotification("Mentoring", "Anfrage gesendet.", "success");
      }
  };

  const adminUpdateMentoringStatus = async (matchId: string, status: 'active'|'completed') => {
      const { error } = await supabase.from('mentoring_matches').update({ status }).eq('id', matchId);
      if(!error) setMentoringMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m));
  };

  const checkInUser = async (eventId: string, userId: string) => {
      const { data } = await supabase.from('check_ins').insert([{ event_id: eventId, user_id: userId }]).select().single();
      if(data) setCheckIns(prev => [...prev, { id: data.id, eventId: data.event_id, userId: data.user_id, timestamp: data.timestamp }]);
  };
  
  const addAnnouncement = async (title: string, text: string) => {
      const { data } = await supabase.from('announcements').insert([{ title, text }]).select().single();
      if(data) setAnnouncements(prev => [...prev, { id: data.id, title: data.title, text: data.text, date: data.date }]);
  };

  const deleteAnnouncement = async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if(!error) setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const bookCoworkingSlot = async (deskId: string, date: string, slot: CoworkingSlotType) => {
      if(!currentUser) return;
      const { data } = await supabase.from('coworking_bookings').insert([{
          user_id: currentUser.id,
          desk_id: deskId,
          date,
          slot
      }]).select().single();
      
      if(data) {
          setCoworkingBookings(prev => [...prev, { id: data.id, userId: data.user_id, deskId: data.desk_id, date: data.date, slot: data.slot, status: data.status, createdAt: data.created_at }]);
          addNotification("Gebucht", "Platz reserviert.", "success");
      }
  };
  
  const cancelCoworkingBooking = async (id: string) => {
      const { error } = await supabase.from('coworking_bookings').delete().eq('id', id);
      if(!error) setCoworkingBookings(prev => prev.filter(b => b.id !== id));
  };

  const addCoworkingDesk = async (desk: any) => {
      const { data } = await supabase.from('coworking_desks').insert([{ name: desk.name, capacity: desk.capacity, features: desk.features }]).select().single();
      if(data) setCoworkingDesks(prev => [...prev, { id: data.id, name: data.name, capacity: data.capacity, features: data.features }]);
  };
  
  const deleteCoworkingDesk = async (id: string) => {
      const { error } = await supabase.from('coworking_desks').delete().eq('id', id);
      if(!error) setCoworkingDesks(prev => prev.filter(d => d.id !== id));
  };
  
  const updateCoworkingDesk = async (id: string, updates: any) => {
      const { error } = await supabase.from('coworking_desks').update(updates).eq('id', id);
      if(!error) setCoworkingDesks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const submitFeedback = async (feedback: any) => {
      const { data } = await supabase.from('event_feedback').insert([{
          event_id: feedback.eventId,
          user_id: feedback.userId,
          rating: feedback.rating,
          comment: feedback.comment
      }]).select().single();
      
      if(data) {
          setFeedbacks(prev => [...prev, { id: data.id, eventId: data.event_id, userId: data.user_id, rating: data.rating, comment: data.comment, createdAt: data.created_at }]);
          addNotification("Danke", "Feedback gesendet.", "success");
      }
  };

  const reportContent = async (targetId: string, targetType: 'message' | 'user', reason: string) => {
      if (!currentUser) return;
      const { data } = await supabase.from('reports').insert([{
          reporter_id: currentUser.id,
          target_id: targetId,
          target_type: targetType,
          reason
      }]).select().single();

      if (data) {
          setReports(prev => [...prev, { id: data.id, reporterId: data.reporter_id, targetId: data.target_id, targetType: data.target_type, reason: data.reason, status: data.status, createdAt: data.created_at }]);
          addNotification("Gemeldet", "Ein Admin wird sich das ansehen.", "info");
      }
  };

  const adminDismissReport = async (reportId: string) => {
      const { error } = await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
      if (!error) {
          setReports(prev => prev.filter(r => r.id !== reportId));
      }
  };

  const adminDeleteMessage = async (messageId: string) => {
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (!error) {
          setMessages(prev => prev.filter(m => m.id !== messageId));
          addNotification("Admin", "Nachricht gelöscht.", "success");
      }
  };

  const adminVerifyUser = async (uid: string, isVerified: boolean) => {
      const { error } = await supabase.from('profiles').update({ is_verified: isVerified }).eq('id', uid);
      if (!error) {
          setUsers(prev => prev.map(u => u.id === uid ? { ...u, isVerified } : u));
          if (currentUser?.id === uid) setCurrentUser(prev => prev ? { ...prev, isVerified } : null);
      }
  }; 

  const adminUpdateUserRole = async (uid: string, role: UserRole) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', uid);
      if (!error) {
          setUsers(prev => prev.map(u => u.id === uid ? { ...u, role } : u));
          if (currentUser?.id === uid) setCurrentUser(prev => prev ? { ...prev, role } : null);
      }
  }; 

  const adminToggleChatRestriction = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const newStatus = !user.isChatRestricted;
      
      const { error } = await supabase.from('profiles').update({ is_chat_restricted: newStatus }).eq('id', userId);
      if (!error) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, isChatRestricted: newStatus } : u));
          addNotification("Admin", `User ${newStatus ? 'stummmgeschaltet' : 'freigeschaltet'}.`, "info");
      }
  }; 

  const adminToggleBan = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const newStatus = user.accountStatus === 'banned' ? 'active' : 'banned';
      
      const { error } = await supabase.from('profiles').update({ account_status: newStatus }).eq('id', userId);
      if (!error) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, accountStatus: newStatus } : u));
          addNotification("Admin", `User ${newStatus === 'banned' ? 'gesperrt' : 'entsperrt'}.`, "warning");
      }
  }; 
  
  const adminUpdateOrganizerCategories = async (userId: string, categories: string[]) => {
      const { error } = await supabase.from('profiles').update({ allowed_categories: categories }).eq('id', userId);
      if(!error) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, allowedCategories: categories } : u));
      }
  }; 
  
  const adminUpdateUserAllowedRooms = async (userId: string, roomIds: string[]) => {
      const { error } = await supabase.from('profiles').update({ allowed_room_ids: roomIds }).eq('id', userId);
      if(!error) {
           setUsers(prev => prev.map(u => u.id === userId ? { ...u, allowedRoomIds: roomIds } : u));
      }
  }; 
  
  const adminToggleCafePermission = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if(!user) return;
      const newValue = !user.canManageCafe;
      
      const { error } = await supabase.from('profiles').update({ can_manage_cafe: newValue }).eq('id', userId);
      if(!error) {
           setUsers(prev => prev.map(u => u.id === userId ? { ...u, canManageCafe: newValue } : u));
      }
  }; 

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        addNotification("Fehler", "Browser unterstützt keine Benachrichtigungen", "warning");
        return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        addNotification("Erfolg", "Benachrichtigungen aktiviert", "success");
    } else {
            addNotification("Info", "Benachrichtigungen abgelehnt", "info");
    }
  };
  
  const sendFriendRequest = async (targetId: string) => {
      if(!currentUser) return;
      const targetUser = users.find(u => u.id === targetId);
      if(!targetUser) return;
      
      const newRequests = targetUser.friendRequests.includes(currentUser.id) ? targetUser.friendRequests : [...targetUser.friendRequests, currentUser.id];
      
      await supabase.from('profiles').update({ friend_requests: newRequests }).eq('id', targetId);
      setUsers(prev => prev.map(u => u.id === targetId ? { ...u, friendRequests: newRequests } : u));
      addNotification("Gesendet", "Anfrage verschickt.", "success");
  }; 
  const respondToFriendRequest = async (requesterId: string, action: 'accept'|'reject') => {
      if(!currentUser) return;
      
      let myFriends = currentUser.friends;
      let myRequests = currentUser.friendRequests.filter(id => id !== requesterId);
      
      if(action === 'accept') {
          if (!myFriends.includes(requesterId)) myFriends = [...myFriends, requesterId];
          const requester = users.find(u => u.id === requesterId);
          if(requester) {
             let theirFriends = requester.friends;
             if (!theirFriends.includes(currentUser.id)) theirFriends = [...theirFriends, currentUser.id];
             
             await supabase.from('profiles').update({ friends: theirFriends }).eq('id', requesterId);
             setUsers(prev => prev.map(u => u.id === requesterId ? { ...u, friends: theirFriends } : u));
          }
      }
      
      await supabase.from('profiles').update({ friends: myFriends, friend_requests: myRequests }).eq('id', currentUser.id);
      setCurrentUser(prev => prev ? { ...prev, friends: myFriends, friendRequests: myRequests } : null);
      if(action === 'accept') addNotification("Verbunden", "Ihr seid jetzt Freunde.", "success");
  }; 
  const removeFriend = async (friendId: string) => {
      if(!currentUser) return;
      const myFriends = currentUser.friends.filter(id => id !== friendId);
      
      const friend = users.find(u => u.id === friendId);
      if(friend) {
          const theirFriends = friend.friends.filter(id => id !== currentUser.id);
          await supabase.from('profiles').update({ friends: theirFriends }).eq('id', friendId);
          setUsers(prev => prev.map(u => u.id === friendId ? { ...u, friends: theirFriends } : u));
      }
      
      await supabase.from('profiles').update({ friends: myFriends }).eq('id', currentUser.id);
      setCurrentUser(prev => prev ? { ...prev, friends: myFriends } : null);
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, groups, events, eventCategories, rooms, roomBookings, messages, mentoringMatches, announcements, reports, polls, pollVotes, feedbacks, checkIns, notifications, currentTheme, resources, suggestions, cafeConfig, coworkingDesks, coworkingBookings, coworkingRules, appConfig, homeConfig, isLoading,
      login, signup, logout, uploadFile, joinEvent, leaveEvent, respondToEventRequest, joinGroup, respondToGroupRequest, createGroup, postMessage, createEvent, updateEvent, addEventCategory, removeEventCategory, requestMentoring, reportContent, updateProfile, requestRoom, checkRoomAvailability, updateBookingStatus, deleteRoomRequest, updateRoomRequest, addRoom, updateRoom, deleteRoom, createPoll, votePoll, submitFeedback, checkInUser,
      adminUpdateUserRole, adminUpdateOrganizerCategories, adminUpdateUserAllowedRooms, adminToggleCafePermission, adminUpdateMentoringStatus, adminVerifyUser, adminToggleChatRestriction, adminToggleBan, adminDeleteMessage, adminDismissReport, removeNotification, requestNotificationPermission, updateTheme, addResource, deleteResource, submitSuggestion, updateSuggestionStatus, updateCafeConfig,
      bookCoworkingSlot, cancelCoworkingBooking, addCoworkingDesk, updateCoworkingDesk, deleteCoworkingDesk, updateCoworkingRules, updateAppConfig, updateHomeConfig, addAnnouncement, deleteAnnouncement,
      sendFriendRequest, respondToFriendRequest, removeFriend
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