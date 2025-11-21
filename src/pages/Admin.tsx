





import React, { useState } from 'react';
import { useApp, THEME_PRESETS } from '../services/store';
import { Card, Button, Badge, Input } from '../components/Shared';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { User, Calendar, AlertTriangle, CheckCircle, XCircle, Users, HeartHandshake, Shield, Check, X, Palette, Lightbulb, MessageSquare, FileBarChart, Download, Menu, Eye, EyeOff, Info, Mic, MicOff, Ban, Lock, Trash2, Phone, Mail, Tag, Building2, Coffee } from 'lucide-react';
import { RoomBooking, UserRole, Suggestion, EventCategory, AppConfig } from '../types';

const Admin: React.FC = () => {
  const { users, events, reports, messages, currentUser, roomBookings, rooms, updateBookingStatus, adminUpdateUserRole, mentoringMatches, adminUpdateMentoringStatus, adminVerifyUser, adminToggleChatRestriction, adminToggleBan, adminDeleteMessage, adminDismissReport, currentTheme, updateTheme, suggestions, updateSuggestionStatus, appConfig, updateAppConfig, adminUpdateOrganizerCategories, eventCategories, adminUpdateUserAllowedRooms, adminToggleCafePermission } = useApp();
  const activeTabState = useState<'dashboard' | 'users' | 'mentoring' | 'design' | 'suggestions' | 'navigation'>('dashboard');
  const activeTab = activeTabState[0];
  const setActiveTab = activeTabState[1];
  
  // Approval Modal State
  const [processingBooking, setProcessingBooking] = useState<{booking: RoomBooking, action: 'approved' | 'rejected'} | null>(null);
  const [adminNote, setAdminNote] = useState('');
  
  // Suggestion processing
  const [processingSuggestion, setProcessingSuggestion] = useState<{suggestion: Suggestion, action: 'approved' | 'rejected'} | null>(null);

  // Navigation editing state
  const [editAppConfig, setEditAppConfig] = useState<AppConfig>(appConfig);
  
  // Organizer Category/Room Edit State
  const [editingOrganizerCats, setEditingOrganizerCats] = useState<string | null>(null);
  const [editingOrganizerRooms, setEditingOrganizerRooms] = useState<string | null>(null);

  if (currentUser?.role !== 'admin') {
    return <div className="p-8 text-center">Zugriff verweigert.</div>;
  }

  const pendingBookings = roomBookings.filter(b => b.status === 'requested');
  const pendingMentoring = mentoringMatches.filter(m => m.status === 'pending');
  const openSuggestions = suggestions.filter(s => s.status === 'new');

  const handleActionClick = (booking: RoomBooking, action: 'approved' | 'rejected') => {
    setProcessingBooking({ booking, action });
    setAdminNote('');
  };

  const confirmAction = () => {
    if (!processingBooking) return;
    updateBookingStatus(processingBooking.booking.id, processingBooking.action, adminNote);
    setProcessingBooking(null);
    setAdminNote('');
  };

  const cancelAction = () => {
    setProcessingBooking(null);
    setAdminNote('');
  };
  
  const handleSuggestionAction = (suggestion: Suggestion, action: 'approved' | 'rejected') => {
      setProcessingSuggestion({suggestion, action});
      setAdminNote('');
  };
  
  const confirmSuggestionAction = () => {
      if (!processingSuggestion) return;
      updateSuggestionStatus(processingSuggestion.suggestion.id, processingSuggestion.action, adminNote);
      setProcessingSuggestion(null);
      setAdminNote('');
  };

  // --- STATS CALCULATION ---

  // 1. Growth (Mocking historical data for demo)
  const growthData = [
      { name: 'Jan', users: Math.floor(users.length * 0.2) },
      { name: 'Feb', users: Math.floor(users.length * 0.35) },
      { name: 'Mär', users: Math.floor(users.length * 0.5) },
      { name: 'Apr', users: Math.floor(users.length * 0.65) },
      { name: 'Mai', users: Math.floor(users.length * 0.85) },
      { name: 'Jun', users: users.length },
  ];

  // 2. Gender Distribution by Category
  const categories = Object.values(EventCategory);
  const categoryDemographics = categories.map(cat => {
      const catEvents = events.filter(e => e.category === cat);
      let male = 0;
      let female = 0;
      let divers = 0;

      catEvents.forEach(e => {
          e.participants.forEach(pid => {
              const user = users.find(u => u.id === pid);
              if (user?.gender === 'male') male++;
              else if (user?.gender === 'female') female++;
              else divers++;
          });
      });

      return {
          name: cat,
          Männlich: male,
          Weiblich: female,
          Divers: divers
      };
  });

  // 3. Age Distribution by Category
  const currentYear = new Date().getFullYear();
  const ageGroupsData = categories.map(cat => {
      const catEvents = events.filter(e => e.category === cat);
      const ages = { '<18': 0, '18-30': 0, '31-50': 0, '50+': 0 };

      catEvents.forEach(e => {
          e.participants.forEach(pid => {
              const user = users.find(u => u.id === pid);
              if (user?.birthYear) {
                  const age = currentYear - user.birthYear;
                  if (age < 18) ages['<18']++;
                  else if (age <= 30) ages['18-30']++;
                  else if (age <= 50) ages['31-50']++;
                  else ages['50+']++;
              }
          });
      });
      return { name: cat, ...ages };
  });

  // 4. Feedback Average
  const feedbackData = categories.map(cat => {
      const catEvents = events.filter(e => e.category === cat);
      let totalRating = 0;
      let count = 0;
      catEvents.forEach(e => {
          if (e.averageRating && e.averageRatingCount) {
              totalRating += e.averageRating * e.averageRatingCount;
              count += e.averageRatingCount;
          }
      });
      return {
          name: cat,
          rating: count > 0 ? parseFloat((totalRating / count).toFixed(1)) : 0
      };
  });

  const COLORS = {
      male: '#3b82f6', // blue-500
      female: '#ec4899', // pink-500
      other: '#10b981', // emerald-500
      primary: currentTheme.colors[600],
      secondary: currentTheme.colors[300]
  };


  // --- NAVIGATION CONFIG LOGIC ---
  const toggleNavItem = (id: string) => {
      setEditAppConfig(prev => ({
          ...prev,
          navigation: prev.navigation.map(item => item.id === id ? { ...item, isVisible: !item.isVisible } : item)
      }));
  };
  
  const updateNavLabel = (id: string, label: string) => {
      setEditAppConfig(prev => ({
          ...prev,
          navigation: prev.navigation.map(item => item.id === id ? { ...item, label } : item)
      }));
  };

  const saveNavConfig = () => {
      updateAppConfig(editAppConfig);
  };
  
  const toggleCategoryForUser = (userId: string, cat: string, currentCats: string[]) => {
      const newCats = currentCats.includes(cat) 
          ? currentCats.filter(c => c !== cat)
          : [...currentCats, cat];
      adminUpdateOrganizerCategories(userId, newCats);
  };

  const toggleRoomForUser = (userId: string, roomId: string, currentRooms: string[]) => {
      const newRooms = currentRooms.includes(roomId)
          ? currentRooms.filter(r => r !== roomId)
          : [...currentRooms, roomId];
      adminUpdateUserAllowedRooms(userId, newRooms);
  };


  // --- VIEWS ---

  const DashboardView = () => (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="p-6 bg-primary-900 text-white">
          <h3 className="text-lg font-medium opacity-80 mb-4">Aktive Mitglieder</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{users.filter(u => u.accountStatus === 'active').length}</span>
            <span className="mb-1 opacity-80">aktiv</span>
          </div>
        </Card>
        <Card className="p-6 bg-white border border-stone-200">
           <h3 className="text-lg font-medium text-stone-600 mb-4">Förderrelevante Events</h3>
           <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-primary-800">{events.length}</span>
            <span className="mb-1 text-stone-500">im Jahr {currentYear}</span>
          </div>
        </Card>
        <Card className="p-6 bg-stone-800 text-white">
           <h3 className="text-lg font-medium opacity-80 mb-4">Offene Aufgaben</h3>
           <div className="flex justify-around">
              <div className="text-center">
                <span className="block text-2xl font-bold">{reports.filter(r => r.status === 'open').length}</span>
                <span className="text-xs opacity-70">Reports</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold">{pendingBookings.length}</span>
                <span className="text-xs opacity-70">Räume</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold">{openSuggestions.length}</span>
                <span className="text-xs opacity-70">Ideen</span>
              </div>
           </div>
        </Card>
      </div>

      <div className="flex justify-between items-center border-b border-stone-200 pb-4">
          <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
             <FileBarChart /> Statistiken & Berichte
          </h2>
          <Button variant="secondary" size="sm" className="flex items-center gap-2">
             <Download size={16} /> Bericht exportieren (PDF)
          </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Growth Chart */}
        <Card className="p-6">
          <h3 className="font-bold text-stone-700 mb-4">Mitgliederentwicklung (Letzte 6 Monate)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '8px'}} />
                <Line type="monotone" dataKey="users" stroke={currentTheme.colors[600]} strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 2. Feedback Chart */}
        <Card className="p-6">
          <h3 className="font-bold text-stone-700 mb-4">Feedback-Qualität (Durchschnitt Ø 1-5)</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedbackData} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                   <XAxis type="number" domain={[0, 5]} hide />
                   <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                   <Tooltip cursor={{fill: 'transparent'}} />
                   <Bar dataKey="rating" fill={currentTheme.colors[400]} radius={[0, 4, 4, 0]} barSize={30}>
                      {feedbackData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.rating >= 4.5 ? '#10b981' : entry.rating >= 3.5 ? '#fbbf24' : '#ef4444'} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </Card>

        {/* 3. Gender Distribution Stacked */}
        <Card className="p-6">
            <h3 className="font-bold text-stone-700 mb-4">Teilnahme nach Geschlecht & Kategorie</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryDemographics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend iconType="circle" />
                        <Bar dataKey="Männlich" stackId="a" fill={COLORS.male} />
                        <Bar dataKey="Weiblich" stackId="a" fill={COLORS.female} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* 4. Age Distribution Stacked */}
        <Card className="p-6">
            <h3 className="font-bold text-stone-700 mb-4">Teilnahme nach Altersgruppen</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageGroupsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend iconType="circle" />
                        <Bar dataKey="<18" stackId="a" fill="#93c5fd" />
                        <Bar dataKey="18-30" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="31-50" stackId="a" fill="#1d4ed8" />
                        <Bar dataKey="50+" stackId="a" fill="#1e3a8a" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      {/* Room Booking Requests */}
      <section>
        <h2 className="text-xl font-bold text-primary-900 mb-4">Offene Raumanfragen</h2>
        <div className="space-y-3">
           {pendingBookings.length === 0 ? (
             <Card className="p-4 bg-stone-50 text-stone-500 text-center">Keine offenen Anfragen.</Card>
           ) : (
             pendingBookings.map(booking => {
               const room = rooms.find(r => r.id === booking.roomId);
               const user = users.find(u => u.id === booking.requestedBy);
               return (
                 <Card key={booking.id} className="p-4 border-l-4 border-blue-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                         <h3 className="font-bold text-stone-900">{booking.title}</h3>
                         <p className="text-sm text-stone-600">
                           Raum: <b>{room?.name}</b> • Von: {user?.name}
                         </p>
                         <p className="text-xs text-stone-500 mt-1">
                           {new Date(booking.startTime).toLocaleDateString()} | {new Date(booking.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                         </p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button size="sm" variant="ghost" className="text-red-600 bg-red-50 hover:bg-red-100 flex-1 md:flex-none" onClick={() => handleActionClick(booking, 'rejected')}>
                           Ablehnen
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none" onClick={() => handleActionClick(booking, 'approved')}>
                           Genehmigen
                        </Button>
                      </div>
                    </div>
                 </Card>
               );
             })
           )}
        </div>
      </section>

      {/* Moderation List */}
      <section>
        <h2 className="text-xl font-bold text-primary-900 mb-4">Moderation</h2>
        <div className="space-y-2">
          {reports.length === 0 ? (
             <Card className="p-4 bg-stone-50 text-stone-500 text-center">Keine offenen Meldungen.</Card>
          ) : (
            reports.map(report => {
              const reporter = users.find(u => u.id === report.reporterId);
              let targetUserId = '';
              let targetUserName = '';
              let reportedContent = null;
              
              if (report.targetType === 'user') {
                 const target = users.find(u => u.id === report.targetId);
                 targetUserId = target?.id || '';
                 targetUserName = target?.name || 'Unbekannt';
              } else {
                 const msg = messages.find(m => m.id === report.targetId);
                 targetUserId = msg?.authorID || '';
                 const msgAuthor = users.find(u => u.id === targetUserId);
                 targetUserName = msgAuthor?.name || 'Unbekannt';
                 reportedContent = msg ? msg.text : <span className="italic text-stone-400">Nachricht bereits gelöscht</span>;
              }

              const targetUser = users.find(u => u.id === targetUserId);

              return (
              <Card key={report.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 border-l-4 border-red-500">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
                    <AlertTriangle size={18} />
                    <span>Meldung: {report.reason}</span>
                  </div>
                  
                  {report.targetType === 'message' && (
                      <div className="bg-stone-100 p-2 rounded mb-2 text-sm border border-stone-200">
                          <p className="text-stone-800 font-medium">"{reportedContent}"</p>
                      </div>
                  )}

                  <div className="text-xs text-stone-500 mt-2 flex items-center flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-2">
                          <span className="font-bold">Melder:</span>
                          <span>{reporter?.name || 'Unbekannt'}</span>
                          {reporter && (
                              <div className="flex gap-1 bg-stone-100 rounded px-1">
                                  <button
                                      onClick={() => adminToggleChatRestriction(reporter.id)}
                                      className={`p-1 hover:bg-stone-200 rounded ${reporter.isChatRestricted ? 'text-red-500' : 'text-stone-400'}`}
                                      title={reporter.isChatRestricted ? "Melder: Stumm aufheben" : "Melder: Stummschalten"}
                                  >
                                      <MicOff size={12} />
                                  </button>
                                  <button
                                      onClick={() => adminToggleBan(reporter.id)}
                                      className={`p-1 hover:bg-stone-200 rounded ${reporter.accountStatus === 'banned' ? 'text-red-500' : 'text-stone-400'}`}
                                      title={reporter.accountStatus === 'banned' ? "Melder: Ban aufheben" : "Melder: Bannen"}
                                  >
                                      <Ban size={12} />
                                  </button>
                              </div>
                          )}
                      </div>
                      <div>
                          <span className="font-bold">Beschuldigter:</span> {targetUserName}
                      </div>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{new Date(report.createdAt).toLocaleString()}</p>
                </div>
                
                <div className="flex flex-wrap items-start gap-2 md:max-w-[200px] justify-end">
                   {report.targetType === 'message' && reportedContent !== null && typeof reportedContent === 'string' && (
                       <Button 
                         size="sm" 
                         variant="danger" 
                         className="w-full md:w-auto flex items-center justify-center gap-1"
                         onClick={() => adminDeleteMessage(report.targetId)}
                         title="Nachricht endgültig löschen"
                       >
                           <Trash2 size={16} /> Löschen
                       </Button>
                   )}
                   
                   {targetUserId && (
                       <>
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            className={`w-full md:w-auto flex items-center justify-center gap-1 ${targetUser?.isChatRestricted ? 'bg-orange-100 text-orange-800' : ''}`}
                            onClick={() => adminToggleChatRestriction(targetUserId)}
                            title={targetUser?.isChatRestricted ? "Stummschaltung aufheben" : "Nutzer stummschalten"}
                        >
                            <MicOff size={16} /> {targetUser?.isChatRestricted ? 'Entsperren' : 'Stumm'}
                        </Button>
                        
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            className={`w-full md:w-auto flex items-center justify-center gap-1 ${targetUser?.accountStatus === 'banned' ? 'bg-red-800 text-white' : 'text-stone-600'}`}
                            onClick={() => adminToggleBan(targetUserId)}
                            title={targetUser?.accountStatus === 'banned' ? "Ban aufheben" : "Nutzer bannen"}
                        >
                            <Ban size={16} /> {targetUser?.accountStatus === 'banned' ? 'Unban' : 'Bann'}
                        </Button>
                       </>
                   )}
                   
                   <Button size="sm" variant="ghost" onClick={() => adminDismissReport(report.id)} className="w-full md:w-auto text-stone-500">
                       <CheckCircle size={16} className="mr-1"/> Erledigt
                   </Button>
                </div>
              </Card>
            )})
          )}
        </div>
      </section>
    </div>
  );

  const UsersView = () => (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-xl font-bold text-primary-900 mb-4">Benutzerverwaltung</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-100 text-stone-600 text-xs uppercase font-bold">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Rolle</th>
                <th className="p-4">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {users.map(user => (
                <tr key={user.id} className={`hover:bg-stone-50 ${user.accountStatus === 'banned' ? 'bg-red-50' : ''}`}>
                  <td className="p-4">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-stone-500">{user.email}</div>
                      
                      {user.role === UserRole.ORGANIZER && (
                          <div className="mt-2 flex flex-wrap gap-2">
                              {/* Categories Permission Button */}
                              <div className="relative">
                                  <button 
                                    onClick={() => {
                                        setEditingOrganizerRooms(null);
                                        setEditingOrganizerCats(editingOrganizerCats === user.id ? null : user.id);
                                    }}
                                    className="text-xs flex items-center gap-1 text-primary-700 hover:underline bg-primary-50 px-2 py-1 rounded"
                                  >
                                      <Tag size={12}/> Kategorien ({user.allowedCategories?.length || 0})
                                  </button>
                                  
                                  {editingOrganizerCats === user.id && (
                                      <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-stone-200 rounded-lg shadow-lg min-w-[200px] z-20">
                                          <p className="text-xs font-bold text-stone-600 mb-2">Kategorien erlauben:</p>
                                          <div className="flex flex-wrap gap-2">
                                              {eventCategories.map(cat => {
                                                  const isActive = user.allowedCategories?.includes(cat);
                                                  return (
                                                      <button 
                                                        key={cat}
                                                        onClick={() => toggleCategoryForUser(user.id, cat, user.allowedCategories || [])}
                                                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${isActive ? 'bg-green-100 border-green-200 text-green-800' : 'bg-stone-50 border-stone-200 text-stone-500 opacity-70'}`}
                                                      >
                                                          {cat}
                                                      </button>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  )}
                              </div>

                              {/* Room Permission Button */}
                              <div className="relative">
                                  <button 
                                    onClick={() => {
                                        setEditingOrganizerCats(null);
                                        setEditingOrganizerRooms(editingOrganizerRooms === user.id ? null : user.id);
                                    }}
                                    className="text-xs flex items-center gap-1 text-blue-700 hover:underline bg-blue-50 px-2 py-1 rounded"
                                  >
                                      <Building2 size={12}/> Räume ({user.allowedRoomIds ? user.allowedRoomIds.length : 'Alle'})
                                  </button>

                                  {editingOrganizerRooms === user.id && (
                                      <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-stone-200 rounded-lg shadow-lg min-w-[220px] z-20">
                                          <p className="text-xs font-bold text-stone-600 mb-2">Räume erlauben:</p>
                                          <div className="flex flex-col gap-1">
                                              {rooms.map(room => {
                                                  const isActive = !user.allowedRoomIds || user.allowedRoomIds.includes(room.id);
                                                  
                                                  return (
                                                      <button 
                                                        key={room.id}
                                                        onClick={() => {
                                                            const currentAllowed = user.allowedRoomIds || rooms.map(r => r.id);
                                                            toggleRoomForUser(user.id, room.id, currentAllowed);
                                                        }}
                                                        className={`text-left text-xs px-2 py-1.5 rounded border transition-colors flex items-center justify-between ${isActive ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-stone-50 border-stone-200 text-stone-400'}`}
                                                      >
                                                          <span className="truncate">{room.name}</span>
                                                          {isActive && <Check size={12} />}
                                                      </button>
                                                  );
                                              })}
                                          </div>
                                          <p className="text-[10px] text-stone-400 mt-2 italic border-t pt-1">
                                              Hinweis: Wenn kein Raum explizit gewählt ist, sind standardmäßig alle erlaubt.
                                          </p>
                                      </div>
                                  )}
                              </div>

                              {/* Cafe Management Permission */}
                              <button
                                onClick={() => adminToggleCafePermission(user.id)}
                                className={`text-xs flex items-center gap-1 hover:underline px-2 py-1 rounded ${user.canManageCafe ? 'bg-orange-100 text-orange-800' : 'bg-stone-100 text-stone-500'}`}
                                title={user.canManageCafe ? 'Café-Verwaltung erlaubt' : 'Keine Café-Verwaltung'}
                              >
                                  <Coffee size={12} /> {user.canManageCafe ? 'Café: Ja' : 'Café: Nein'}
                              </button>
                          </div>
                      )}
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                        {user.isVerified ? (
                            <div className="flex items-center gap-1 text-green-700 text-xs">
                                <CheckCircle size={14} /> <span>Verifiziert</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-stone-500 text-xs">
                                <Badge color="bg-stone-100 text-stone-500">Unverifiziert</Badge>
                                <button onClick={() => adminVerifyUser(user.id, true)} className="text-primary-600 hover:underline ml-1">OK?</button>
                            </div>
                        )}
                        
                        {user.accountStatus === 'banned' && <Badge color="bg-red-600 text-white">Gesperrt</Badge>}
                        {user.isChatRestricted && <Badge color="bg-orange-100 text-orange-800 flex w-fit gap-1"><MicOff size={10}/> Stumm</Badge>}
                    </div>
                  </td>
                  <td className="p-4">
                    <select 
                      value={user.role}
                      onChange={(e) => adminUpdateUserRole(user.id, e.target.value as UserRole)}
                      className="bg-white border border-stone-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary-600 outline-none"
                    >
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.ORGANIZER}>Organizer</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                      <div className="flex gap-2">
                          <button 
                            onClick={() => adminToggleChatRestriction(user.id)} 
                            className={`p-2 rounded hover:bg-stone-200 ${user.isChatRestricted ? 'text-red-500' : 'text-stone-400'}`}
                            title={user.isChatRestricted ? "Chat entsperren" : "Chat sperren"}
                          >
                              {user.isChatRestricted ? <MicOff size={18} /> : <Mic size={18} />}
                          </button>
                          <button 
                            onClick={() => adminToggleBan(user.id)}
                            className={`p-2 rounded hover:bg-red-100 ${user.accountStatus === 'banned' ? 'text-red-600 bg-red-50' : 'text-stone-400'}`}
                            title={user.accountStatus === 'banned' ? "Konto entsperren" : "Konto sperren"}
                          >
                              <Ban size={18} />
                          </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const MentoringView = () => (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-xl font-bold text-primary-900 mb-4">Mentoring Anfragen</h2>
      {pendingMentoring.length === 0 ? (
         <Card className="p-8 text-center text-stone-500">
           <HeartHandshake size={48} className="mx-auto mb-2 opacity-30" />
           <p>Keine offenen Anfragen.</p>
         </Card>
      ) : (
        <div className="grid gap-4">
          {pendingMentoring.map(match => {
            const mentor = users.find(u => u.id === match.mentorID);
            const mentee = users.find(u => u.id === match.menteeID);
            return (
              <Card key={match.id} className="p-4 border-l-4 border-purple-500">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                       <span className="block text-xs font-bold text-stone-400">Mentee</span>
                       <span className="font-bold text-stone-800">{mentee?.name}</span>
                    </div>
                    <div className="text-purple-300">→</div>
                    <div className="text-center">
                       <span className="block text-xs font-bold text-stone-400">Mentor</span>
                       <span className="font-bold text-stone-800">{mentor?.name}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => adminUpdateMentoringStatus(match.id, 'active')} className="bg-green-600 hover:bg-green-700">Bestätigen</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      
      <h3 className="text-lg font-bold text-primary-900 mt-8 mb-2">Aktive Matches</h3>
      <Card className="p-4">
        {mentoringMatches.filter(m => m.status === 'active').length === 0 ? (
           <p className="text-stone-500 text-sm">Keine aktiven Matches.</p>
        ) : (
           <ul className="space-y-2">
             {mentoringMatches.filter(m => m.status === 'active').map(match => {
                const mentor = users.find(u => u.id === match.mentorID);
                const mentee = users.find(u => u.id === match.menteeID);
                return (
                  <li key={match.id} className="flex justify-between text-sm p-2 bg-stone-50 rounded">
                    <span>{mentee?.name} & {mentor?.name}</span>
                    <Badge color="bg-green-100 text-green-800">Aktiv</Badge>
                  </li>
                );
             })}
           </ul>
        )}
      </Card>
    </div>
  );

  const SuggestionsView = () => (
      <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold text-primary-900 mb-4">Eingereichte Vorschläge</h2>
          
          {suggestions.length === 0 ? (
               <Card className="p-8 text-center text-stone-500">
                   <Lightbulb size={48} className="mx-auto mb-2 opacity-30" />
                   <p>Keine Vorschläge vorhanden.</p>
               </Card>
          ) : (
              <div className="space-y-4">
                  {suggestions.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(s => {
                      const user = users.find(u => u.id === s.userId);
                      return (
                          <Card key={s.id} className={`p-4 ${s.status === 'new' ? 'border-l-4 border-yellow-400' : s.status === 'approved' ? 'opacity-80 bg-green-50/50' : 'opacity-60'}`}>
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <div className="flex items-center gap-2">
                                         <Badge color="bg-stone-100 text-stone-600 uppercase tracking-wider text-[10px]">{s.type}</Badge>
                                         <span className="text-xs text-stone-400">{new Date(s.createdAt).toLocaleDateString()} von {user?.name || 'Unbekannt'}</span>
                                      </div>
                                      <h3 className="font-bold text-lg text-stone-800 mt-1">{s.title}</h3>
                                      {/* Contact Info */}
                                      {(s.contactEmail || s.contactPhone) && (
                                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-stone-500">
                                              {s.contactEmail && <span className="flex items-center gap-1"><Mail size={12}/> {s.contactEmail}</span>}
                                              {s.contactPhone && <span className="flex items-center gap-1"><Phone size={12}/> {s.contactPhone}</span>}
                                          </div>
                                      )}
                                  </div>
                                  <div className="shrink-0">
                                      {s.status === 'new' && <Badge color="bg-yellow-100 text-yellow-800">Neu</Badge>}
                                      {s.status === 'approved' && <Badge color="bg-green-100 text-green-800">Angenommen</Badge>}
                                      {s.status === 'rejected' && <Badge color="bg-red-100 text-red-800">Abgelehnt</Badge>}
                                  </div>
                              </div>
                              <p className="text-stone-600 text-sm mb-3">{s.description}</p>
                              
                              {s.adminResponse && (
                                  <div className="bg-white p-3 rounded border border-stone-200 text-sm text-stone-700 mb-3 flex gap-2">
                                      <MessageSquare size={16} className="mt-0.5 text-stone-400" />
                                      <p><span className="font-bold">Admin:</span> {s.adminResponse}</p>
                                  </div>
                              )}

                              {s.status === 'new' && (
                                  <div className="flex gap-2 justify-end border-t border-stone-100 pt-2">
                                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleSuggestionAction(s, 'rejected')}>Ablehnen</Button>
                                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleSuggestionAction(s, 'approved')}>Annehmen</Button>
                                  </div>
                              )}
                          </Card>
                      )
                  })}
              </div>
          )}
      </div>
  );

  const DesignView = () => (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-xl font-bold text-primary-900 mb-4">Design Anpassung</h2>
      <Card className="p-6">
        <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2">
          <Palette size={20} /> Hauptfarbe (Markenidentität)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.values(THEME_PRESETS).map((theme) => {
            const isActive = currentTheme.id === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => updateTheme(theme.id)}
                className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${isActive ? 'border-stone-800 bg-stone-50' : 'border-transparent hover:bg-stone-50'}`}
              >
                <div 
                  className="w-12 h-12 rounded-full mb-3 shadow-sm border border-black/10 transition-transform group-hover:scale-110" 
                  style={{ backgroundColor: theme.colors[600] }}
                />
                <span className={`font-medium text-sm ${isActive ? 'text-stone-900 font-bold' : 'text-stone-600'}`}>
                  {theme.name}
                </span>
                {isActive && <div className="absolute top-2 right-2 text-green-600"><CheckCircle size={16} /></div>}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const NavigationView = () => (
      <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-primary-900">App Navigation</h2>
             <Button onClick={saveNavConfig} className="bg-green-600 hover:bg-green-700">Änderungen Speichern</Button>
          </div>
          
          <div className="space-y-3">
             {editAppConfig.navigation.sort((a, b) => a.order - b.order).map(item => (
                 <Card key={item.id} className={`p-4 flex items-center gap-4 transition-colors ${!item.isVisible ? 'bg-stone-50 opacity-75' : ''}`}>
                     <div className={`p-2 rounded-full ${item.isVisible ? 'bg-primary-100 text-primary-800' : 'bg-stone-200 text-stone-500'}`}>
                         {item.isVisible ? <Eye size={20}/> : <EyeOff size={20}/>}
                     </div>
                     
                     <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                             <label className="text-xs font-bold text-stone-500 block mb-1">Name im Menü</label>
                             <Input 
                                value={item.label} 
                                onChange={e => updateNavLabel(item.id, e.target.value)} 
                                className="mb-0"
                             />
                         </div>
                         <div className="flex items-center justify-end sm:justify-start">
                             <button 
                                onClick={() => toggleNavItem(item.id)} 
                                className={`px-4 py-2 rounded-lg font-bold text-sm border ${item.isVisible ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                             >
                                {item.isVisible ? 'Ausblenden' : 'Einblenden'}
                             </button>
                         </div>
                     </div>
                 </Card>
             ))}
          </div>
          <p className="text-sm text-stone-500 mt-4 bg-blue-50 p-3 rounded border border-blue-100 flex items-start gap-2">
              <Info size={16} className="shrink-0 mt-0.5 text-blue-600"/>
              <span>
                  Ausgeblendete Tabs verschwinden sofort aus der Navigation für alle Nutzer. 
                  Verwende dies z.B., wenn der Co-Working Bereich temporär geschlossen ist oder Features gewartet werden.
              </span>
          </p>
      </div>
  );

  return (
    <div className="space-y-6">
      {/* Action Modal for Room Booking */}
      {processingBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-primary-900 mb-2">
              Anfrage {processingBooking.action === 'approved' ? 'genehmigen' : 'ablehnen'}
            </h3>
            <p className="text-stone-600 text-sm mb-4">
              {processingBooking.action === 'approved' 
                ? 'Möchtest du dieser Buchung zustimmen? Du kannst optional eine Nachricht an den Organisator hinterlassen.'
                : 'Bitte gib einen Grund für die Ablehnung an oder schlage eine Alternative vor.'}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {processingBooking.action === 'approved' ? 'Anmerkung (Optional)' : 'Grund / Alternativvorschlag'}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 min-h-[100px]"
                placeholder={processingBooking.action === 'approved' ? "Alles okay, Schlüssel liegt bereit..." : "Raum ist belegt, versuche es um 18 Uhr..."}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={cancelAction} className="flex-1">Abbrechen</Button>
              <Button 
                onClick={confirmAction} 
                className="flex-1"
                variant={processingBooking.action === 'approved' ? 'primary' : 'danger'}
              >
                Bestätigen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal for Suggestions */}
      {processingSuggestion && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold text-primary-900 mb-2">
                      Vorschlag {processingSuggestion.action === 'approved' ? 'annehmen' : 'ablehnen'}
                  </h3>
                  <p className="text-stone-600 text-sm mb-4">
                      Du kannst eine Antwort an den Nutzer hinterlassen.
                  </p>
                  <div className="mb-4">
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                          Antwort / Kommentar
                      </label>
                      <textarea
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 min-h-[100px]"
                          placeholder="Vielen Dank für deinen Vorschlag..."
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                      />
                  </div>
                  <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setProcessingSuggestion(null)} className="flex-1">Abbrechen</Button>
                      <Button 
                          onClick={confirmSuggestionAction} 
                          className="flex-1"
                          variant={processingSuggestion.action === 'approved' ? 'primary' : 'danger'}
                      >
                          Speichern
                      </Button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <h1 className="text-2xl font-bold text-primary-900">Admin Dashboard</h1>
         <div className="flex bg-white rounded-lg p-1 shadow-sm border border-stone-200 overflow-x-auto max-w-full w-full md:w-auto no-scrollbar">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-primary-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'users' ? 'bg-primary-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Nutzer</button>
            <button onClick={() => setActiveTab('suggestions')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'suggestions' ? 'bg-primary-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Vorschläge</button>
            <button onClick={() => setActiveTab('mentoring')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'mentoring' ? 'bg-primary-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Mentoring</button>
            <button onClick={() => setActiveTab('navigation')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'navigation' ? 'bg-primary-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Navigation</button>
            <button onClick={() => setActiveTab('design')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'design' ? 'bg-primary-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Design</button>
         </div>
      </div>

      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'users' && <UsersView />}
      {activeTab === 'mentoring' && <MentoringView />}
      {activeTab === 'design' && <DesignView />}
      {activeTab === 'suggestions' && <SuggestionsView />}
      {activeTab === 'navigation' && <NavigationView />}
    </div>
  );
};

export default Admin;
