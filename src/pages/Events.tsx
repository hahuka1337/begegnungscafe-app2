import React, { useState, useEffect } from 'react';
import { useApp } from '../services/store';
import { Event, Resource } from '../types';
import { Card, Button, Badge, Input, ImageUpload } from '../components/Shared';
import { MapPin, Clock, User, Search, CalendarCheck, AlertCircle, QrCode, Star, Download, CheckCircle, Plus, X, Calendar, FileText, Video, Link as LinkIcon, Trash2, Share2, Baby, PersonStanding, Lock, Unlock, Mail, Tag, Sparkles, Palette, BookOpen, HelpCircle, Users, Edit2, Save, Smile, Repeat } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';

const Events: React.FC = () => {
  const { events, eventCategories, addEventCategory, removeEventCategory, currentUser, users, joinEvent, leaveEvent, respondToEventRequest, submitFeedback, feedbacks, createEvent, updateEvent, resources, addResource, deleteResource } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'resources' | 'requests' | 'participants'>('details');
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Event>>({});
  
  // Sync URL to State
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
        const evt = events.find(e => e.id === id);
        if (evt) {
            setSelectedEvent(evt);
            setIsEditing(false);
        }
    } else {
        setSelectedEvent(null);
        setActiveTab('details');
        setIsEditing(false);
    }
  }, [searchParams, events]);

  // Admin/Organizer Category Management
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Create Event State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState<{
    title: string;
    description: string;
    category: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location: string;
    maxParticipants: string;
    imageUrl: string;
    registrationMode: 'instant' | 'request';
    genderRestriction: 'none' | 'male' | 'female';
    minAge: string;
    maxAge: string;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrenceEnd: string;
  }>({
    title: '',
    description: '',
    category: eventCategories[0] || '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    maxParticipants: '',
    imageUrl: '',
    registrationMode: 'instant',
    genderRestriction: 'none',
    minAge: '',
    maxAge: '',
    recurrence: 'none',
    recurrenceEnd: ''
  });

  // Resource Upload State
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResource, setNewResource] = useState<{title: string, type: 'pdf' | 'video' | 'link', url: string, description: string}>({
    title: '',
    type: 'pdf',
    url: '',
    description: ''
  });

  // Feedback State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // --- HELPER FUNCTIONS FOR VISUALS ---

  const getCategoryConfig = (category: string) => {
    switch (category) {
        case 'Spiritualität':
            return { color: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-500', icon: Sparkles };
        case 'Familie':
            return { color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-500', icon: Baby };
        case 'Kunst':
            return { color: 'text-pink-800', bg: 'bg-pink-50', border: 'border-pink-500', icon: Palette };
        case 'Bildung':
            return { color: 'text-sky-800', bg: 'bg-sky-50', border: 'border-sky-500', icon: BookOpen };
        default:
            return { color: 'text-stone-800', bg: 'bg-stone-50', border: 'border-stone-400', icon: HelpCircle };
    }
  };

  const getAudienceConfig = (event: Event) => {
      if (event.genderRestriction === 'female') return { label: 'Nur Frauen', icon: PersonStanding, color: 'bg-pink-100 text-pink-700' };
      if (event.genderRestriction === 'male') return { label: 'Nur Männer', icon: PersonStanding, color: 'bg-blue-100 text-blue-700' };
      if (event.category === 'Familie') return { label: 'Familien', icon: Baby, color: 'bg-orange-100 text-orange-800' };
      return { label: 'Alle willkommen', icon: Users, color: 'bg-green-100 text-green-800' };
  };

  const getFriendText = (event: Event) => {
      if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) return null;
      const friendIds = event.participants.filter(id => currentUser.friends.includes(id));
      if (friendIds.length === 0) return null;

      if (friendIds.length === 1) {
          const name = users.find(u => u.id === friendIds[0])?.name.split(' ')[0] || 'Ein Freund';
          return `${name} ist auch dabei`;
      } else if (friendIds.length === 2) {
          const name1 = users.find(u => u.id === friendIds[0])?.name.split(' ')[0];
          return `${name1} & 1 Freund sind dabei`;
      } else {
          return `${friendIds.length} Freunde sind dabei`;
      }
  };

  // Filter logic
  const filteredEvents = events.filter(e => {
    const matchesCategory = filter === 'ALL' || e.category === filter;
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort by date
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(a.dateTimeStart).getTime() - new Date(b.dateTimeStart).getTime()
  );

  // Group by Date
  const groupedEvents = sortedEvents.reduce((groups, event) => {
    const date = new Date(event.dateTimeStart);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateKey = date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

    if (date.toDateString() === today.toDateString()) dateKey = "Heute";
    if (date.toDateString() === tomorrow.toDateString()) dateKey = "Morgen";

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, Event[]>);


  // Helper to check status
  const getStatus = (event: Event) => {
    if (!currentUser) return 'guest';
    if (event.participants.includes(currentUser.id)) return 'joined';
    if (event.pendingParticipants.includes(currentUser.id)) return 'pending';
    if (event.waitlist.includes(currentUser.id)) return 'waiting';
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) return 'full';
    return 'open';
  };
  
  const canJoin = (event: Event) => {
      if (!currentUser) return false;
      if (!event.isRegistrationOpen) return false;
      
      // Gender Check
      if (event.genderRestriction !== 'none' && currentUser.gender !== event.genderRestriction) return false;
      // Age Check
      if (currentUser.birthYear) {
          const age = new Date().getFullYear() - currentUser.birthYear;
          if (event.minAge && age < event.minAge) return false;
          if (event.maxAge && age > event.maxAge) return false;
      }
      return true;
  };
  
  const canEditEvent = (event: Event) => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true;
      if (currentUser.role === 'organizer') {
          // Can edit own events OR events in allowed categories
          if (event.createdBy === currentUser.id) return true;
          if (currentUser.allowedCategories?.includes(event.category)) return true;
      }
      return false;
  };

  const handleDownloadICS = (event: Event) => {
    const formatDate = (dateStr: string) => dateStr.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const start = formatDate(event.dateTimeStart);
    const end = formatDate(event.dateTimeEnd);
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Begegnungscafé//Nürnberg//DE
BEGIN:VEVENT
UID:${event.id}@begegnungscafe-nuernberg.de
DTSTAMP:${formatDate(new Date().toISOString())}
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGoogleCalendar = (event: Event) => {
    const formatDate = (dateStr: string) => dateStr.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const start = formatDate(event.dateTimeStart);
    const end = formatDate(event.dateTimeEnd);
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  const handleShare = async (event: Event) => {
    const shareData = {
      title: `Begegnungscafé: ${event.title}`,
      text: `Schau dir dieses Event an: ${event.title}\n📅 ${new Date(event.dateTimeStart).toLocaleDateString('de-DE')} um ${new Date(event.dateTimeStart).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})} Uhr\n📍 ${event.location}\n\n`,
      url: window.location.href 
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}Link: ${shareData.url}`);
        alert("Infos in die Zwischenablage kopiert!");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleFeedbackSubmit = () => {
    if (selectedEvent && currentUser && rating > 0) {
      submitFeedback({
        eventId: selectedEvent.id,
        userId: currentUser.id,
        rating,
        comment
      });
      setRating(0);
      setComment('');
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const start = new Date(`${newEvent.startDate}T${newEvent.startTime}`);
    const end = new Date(`${newEvent.endDate}T${newEvent.endTime}`);

    if (end <= start) {
        alert("Endzeit muss nach der Startzeit liegen.");
        return;
    }
    
    if (newEvent.recurrence !== 'none' && !newEvent.recurrenceEnd) {
        alert("Bitte Enddatum für die Wiederholung angeben.");
        return;
    }

    createEvent({
        title: newEvent.title,
        description: newEvent.description,
        category: newEvent.category,
        dateTimeStart: start.toISOString(),
        dateTimeEnd: end.toISOString(),
        location: newEvent.location,
        createdBy: currentUser.id,
        maxParticipants: newEvent.maxParticipants ? parseInt(newEvent.maxParticipants) : undefined,
        imageUrl: newEvent.imageUrl || undefined,
        averageRating: undefined,
        registrationMode: newEvent.registrationMode,
        genderRestriction: newEvent.genderRestriction,
        minAge: newEvent.minAge ? parseInt(newEvent.minAge) : undefined,
        maxAge: newEvent.maxAge ? parseInt(newEvent.maxAge) : undefined,
        isRegistrationOpen: true,
        recurrence: newEvent.recurrence,
        recurrenceEnd: newEvent.recurrenceEnd
    });

    setShowCreateModal(false);
    setNewEvent({
        title: '',
        description: '',
        category: eventCategories[0] || '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        maxParticipants: '',
        imageUrl: '',
        registrationMode: 'instant',
        genderRestriction: 'none',
        minAge: '',
        maxAge: '',
        recurrence: 'none',
        recurrenceEnd: ''
    });
  };
  
  const handleUpdateEvent = () => {
      if (!selectedEvent) return;
      updateEvent(selectedEvent.id, editData);
      setIsEditing(false);
  };
  
  const handleStartEdit = () => {
      if (!selectedEvent) return;
      setEditData(selectedEvent);
      setIsEditing(true);
  };

  const handleAddCategory = () => {
      if(newCatName.trim()) {
          addEventCategory(newCatName.trim());
          setNewCatName('');
      }
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !currentUser) return;

    addResource({
      eventId: selectedEvent.id,
      title: newResource.title,
      type: newResource.type,
      url: newResource.url, // In a real app, this would be a result of a file upload
      description: newResource.description,
      uploadedBy: currentUser.id
    });

    setShowResourceModal(false);
    setNewResource({ title: '', type: 'pdf', url: '', description: '' });
  };

  const handleResourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
         setNewResource(prev => ({ ...prev, url: reader.result as string }));
       };
       reader.readAsDataURL(file);
    }
  };

  // Modal/Detail View
  if (selectedEvent) {
    const status = getStatus(selectedEvent);
    const isPast = new Date(selectedEvent.dateTimeEnd) < new Date();
    const hasGivenFeedback = currentUser && feedbacks.some(f => f.eventId === selectedEvent.id && f.userId === currentUser.id);
    const eventResources = resources.filter(r => r.eventId === selectedEvent.id);
    const canManage = canEditEvent(selectedEvent);
    const catConfig = getCategoryConfig(selectedEvent.category);
    const audienceConfig = getAudienceConfig(selectedEvent);
    const AudienceIcon = audienceConfig.icon;
    const friendText = getFriendText(selectedEvent);

    const ResourceView = () => (
      <div className="space-y-4 animate-in fade-in">
         {canManage && (
            <Button onClick={() => setShowResourceModal(true)} className="w-full flex items-center justify-center gap-2 mb-4" variant="secondary">
              <Plus size={18} /> Material hochladen
            </Button>
         )}

         {/* Upload Modal */}
         {showResourceModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Material hinzufügen</h3>
                <form onSubmit={handleAddResource} className="space-y-3">
                   <Input label="Titel" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} required />
                   <div className="mb-2">
                      <label className="block text-sm font-medium text-stone-700 mb-1">Typ</label>
                      <select 
                        className="w-full p-2 border border-stone-300 rounded-lg"
                        value={newResource.type}
                        onChange={e => setNewResource({...newResource, type: e.target.value as any})}
                      >
                        <option value="pdf">PDF Dokument</option>
                        <option value="video">Video Link</option>
                        <option value="link">Webseite</option>
                      </select>
                   </div>
                   
                   {newResource.type === 'pdf' ? (
                     <div className="mb-2">
                        <label className="block text-sm font-medium text-stone-700 mb-1">Datei</label>
                        <input type="file" accept="application/pdf" onChange={handleResourceFileChange} className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                     </div>
                   ) : (
                      <Input label="URL" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} required placeholder="https://..." />
                   )}
                   
                   <Input label="Beschreibung (optional)" value={newResource.description} onChange={e => setNewResource({...newResource, description: e.target.value})} />

                   <div className="flex gap-2 mt-4">
                      <Button type="button" variant="ghost" onClick={() => setShowResourceModal(false)} className="flex-1">Abbrechen</Button>
                      <Button type="submit" className="flex-1">Hochladen</Button>
                   </div>
                </form>
              </div>
            </div>
         )}

         {/* List */}
         {eventResources.length > 0 ? (
           <div className="space-y-3">
              {eventResources.map(r => (
                <Card key={r.id} className="p-3 flex items-center gap-3 hover:bg-stone-50 transition-colors">
                   <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 text-stone-500">
                      {r.type === 'pdf' && <FileText size={20} className="text-red-500" />}
                      {r.type === 'video' && <Video size={20} className="text-blue-500" />}
                      {r.type === 'link' && <LinkIcon size={20} className="text-green-500" />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 truncate">{r.title}</h4>
                      <p className="text-xs text-stone-500 truncate">{r.description || 'Keine Beschreibung'}</p>
                   </div>
                   <div className="flex items-center gap-1">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="p-2 text-primary-600 hover:bg-primary-50 rounded-full">
                         <Download size={18} />
                      </a>
                      {canManage && (
                        <button onClick={() => deleteResource(r.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full">
                           <Trash2 size={18} />
                        </button>
                      )}
                   </div>
                </Card>
              ))}
           </div>
         ) : (
           <div className="text-center py-8 text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-300">
             <FileText size={32} className="mx-auto mb-2 opacity-30" />
             <p>Keine Materialien vorhanden.</p>
           </div>
         )}
      </div>
    );

    const RequestsView = () => (
        <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-stone-800 flex items-center gap-2"><Mail size={20}/> Offene Anfragen ({selectedEvent.pendingParticipants.length})</h3>
            {selectedEvent.pendingParticipants.length === 0 ? (
                <p className="text-stone-500 italic">Keine ausstehenden Anfragen.</p>
            ) : (
                selectedEvent.pendingParticipants.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return (
                        <Card key={userId} className="p-3 flex justify-between items-center">
                             <Link to={`/users/${userId}`} className="flex items-center gap-3 hover:bg-stone-50 p-1 rounded">
                                <div className="font-bold text-stone-900 hover:underline">{user?.name || 'Unbekannt'}</div>
                            </Link>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => respondToEventRequest(selectedEvent.id, userId, 'reject')} className="text-red-500 hover:bg-red-50">Ablehnen</Button>
                                <Button size="sm" onClick={() => respondToEventRequest(selectedEvent.id, userId, 'approve')} className="bg-green-600 hover:bg-green-700">Zulassen</Button>
                            </div>
                        </Card>
                    );
                })
            )}
        </div>
    );

    const ParticipantsView = () => (
        <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                <Users size={20}/> Teilnehmerliste ({selectedEvent.participants.length})
            </h3>
            {selectedEvent.participants.length === 0 ? (
                <p className="text-stone-500 italic">Noch keine Teilnehmer.</p>
            ) : (
                <div className="space-y-2">
                    {selectedEvent.participants.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return (
                            <Link key={userId} to={`/users/${userId}`}>
                                <Card className="p-3 flex items-center gap-3 hover:bg-stone-50 transition-colors mb-2">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold shrink-0 overflow-hidden">
                                        {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover"/> : user?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-stone-900">{user?.name || 'Unbekannt'}</div>
                                        <div className="text-xs text-stone-500">{user?.role === 'organizer' ? 'Organisator' : 'Teilnehmer'}</div>
                                    </div>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    );

    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <Button variant="ghost" onClick={() => setSearchParams({})} className="pl-0 mb-2">← Zurück zur Übersicht</Button>
        
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200">
          <div className={`relative ${selectedEvent.imageUrl ? 'h-64' : 'h-32 bg-stone-900'} flex flex-col justify-end`}>
            {selectedEvent.imageUrl && !isEditing && (
               <>
                 <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="absolute inset-0 w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
               </>
            )}
            {isEditing && (
                <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center z-10 p-4">
                    <ImageUpload 
                        currentImage={editData.imageUrl}
                        onImageSelected={(base64) => setEditData({...editData, imageUrl: base64})}
                        label="Hintergrundbild ändern"
                    />
                </div>
            )}
            
            <div className="relative p-6 z-20 flex justify-between items-end">
               <div className="flex-1">
                 {!isEditing && (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold mb-2 backdrop-blur-sm ${selectedEvent.imageUrl ? 'bg-white/20 text-white' : 'bg-white/10 text-stone-200'}`}>
                        <catConfig.icon size={14}/> {selectedEvent.category}
                    </div>
                 )}
                 {isEditing ? (
                     <div className="bg-white/90 p-2 rounded-lg">
                        <Input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="Event Titel" className="mb-2 text-xl font-bold text-black"/>
                        <select 
                            className="w-full p-1 text-sm border rounded mb-1"
                            value={editData.category}
                            onChange={e => setEditData({...editData, category: e.target.value})}
                        >
                            {eventCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                 ) : (
                     <h1 className="text-2xl font-bold text-white leading-tight text-shadow-sm">{selectedEvent.title}</h1>
                 )}
               </div>
               <div className="flex gap-2">
                    {!isEditing && (
                        <button 
                            onClick={() => handleShare(selectedEvent)} 
                            className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/30 transition-colors shadow-lg"
                            title="Teilen"
                        >
                            <Share2 size={24} />
                        </button>
                    )}
                    {canManage && !isEditing && (
                         <button 
                            onClick={handleStartEdit} 
                            className="bg-white text-primary-800 p-3 rounded-full hover:bg-stone-100 transition-colors shadow-lg"
                            title="Bearbeiten"
                         >
                            <Edit2 size={24} />
                        </button>
                    )}
                    {isEditing && (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="bg-white text-red-600 p-3 rounded-full shadow-lg"><X size={24}/></button>
                            <button onClick={handleUpdateEvent} className="bg-green-600 text-white p-3 rounded-full shadow-lg"><Save size={24}/></button>
                        </div>
                    )}
               </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-stone-200 px-6 mt-2 overflow-x-auto no-scrollbar">
             <button 
               onClick={() => setActiveTab('details')} 
               className={`py-3 mr-6 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'details' ? 'border-primary-800 text-primary-800' : 'border-transparent text-stone-500'}`}
             >
               Details
             </button>
             {(status === 'joined' || canManage) && (
               <button 
                onClick={() => setActiveTab('resources')} 
                className={`py-3 mr-6 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'resources' ? 'border-primary-800 text-primary-800' : 'border-transparent text-stone-500'}`}
               >
                Material & Infos
               </button>
             )}
             {canManage && (
                 <button
                     onClick={() => setActiveTab('participants')}
                     className={`py-3 mr-6 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'participants' ? 'border-primary-800 text-primary-800' : 'border-transparent text-stone-500'}`}
                 >
                     Teilnehmer ({selectedEvent.participants.length})
                 </button>
             )}
             {canManage && selectedEvent.registrationMode === 'request' && (
                 <button 
                 onClick={() => setActiveTab('requests')} 
                 className={`py-3 mr-6 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'requests' ? 'border-primary-800 text-primary-800' : 'border-transparent text-stone-500'}`}
                >
                 Anfragen {selectedEvent.pendingParticipants.length > 0 && `(${selectedEvent.pendingParticipants.length})`}
                </button>
             )}
          </div>
          
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 text-stone-600">
                  
                  {friendText && (
                      <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-purple-800 font-medium text-sm flex items-center gap-2">
                          <Smile size={18} />
                          {friendText}
                      </div>
                  )}
                  
                  {selectedEvent.recurrenceRule && (
                      <div className="flex items-center gap-2 text-sm font-medium bg-blue-50 text-blue-800 px-3 py-2 rounded-lg">
                          <Repeat size={16} />
                          Wiederkehrender Termin ({selectedEvent.recurrenceRule === 'daily' ? 'Täglich' : selectedEvent.recurrenceRule === 'weekly' ? 'Wöchentlich' : 'Monatlich'})
                      </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Clock className="text-primary-600 mt-0.5" size={20} />
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                             <div className="flex gap-2">
                                 <input type="datetime-local" className="border p-1 rounded" value={editData.dateTimeStart?.substring(0, 16)} onChange={e => setEditData({...editData, dateTimeStart: new Date(e.target.value).toISOString()})} />
                                 <span>bis</span>
                                 <input type="datetime-local" className="border p-1 rounded" value={editData.dateTimeEnd?.substring(0, 16)} onChange={e => setEditData({...editData, dateTimeEnd: new Date(e.target.value).toISOString()})} />
                             </div>
                        </div>
                    ) : (
                        <div>
                        <p className="font-medium text-stone-900">
                            {new Date(selectedEvent.dateTimeStart).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-sm">
                            {new Date(selectedEvent.dateTimeStart).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(selectedEvent.dateTimeEnd).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                        </p>
                        </div>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary-600 mt-0.5" size={20} />
                    {isEditing ? (
                        <Input value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} placeholder="Ort" className="mb-0" />
                    ) : (
                        <p className="text-stone-900">{selectedEvent.location}</p>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-3">
                      <AudienceIcon className="text-primary-600 mt-0.5" size={20} />
                      {isEditing ? (
                          <div className="space-y-2 w-full">
                              <select 
                                className="w-full p-2 border rounded"
                                value={editData.genderRestriction}
                                onChange={e => setEditData({...editData, genderRestriction: e.target.value as any})}
                              >
                                  <option value="none">Alle willkommen</option>
                                  <option value="male">Nur Männer</option>
                                  <option value="female">Nur Frauen</option>
                              </select>
                              <div className="flex gap-2">
                                  <Input type="number" placeholder="Min Alter" value={editData.minAge} onChange={e => setEditData({...editData, minAge: parseInt(e.target.value)})} className="mb-0" />
                                  <Input type="number" placeholder="Max Alter" value={editData.maxAge} onChange={e => setEditData({...editData, maxAge: parseInt(e.target.value)})} className="mb-0" />
                              </div>
                          </div>
                      ) : (
                        <div>
                            <p className="font-bold text-stone-900">Zielgruppe: {audienceConfig.label}</p>
                            <div className="text-xs text-stone-500 mt-1">
                                {selectedEvent.minAge && <span>ab {selectedEvent.minAge} Jahren </span>}
                                {selectedEvent.maxAge && <span>bis {selectedEvent.maxAge} Jahren</span>}
                            </div>
                        </div>
                      )}
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="text-primary-600 mt-0.5" size={20} />
                    {isEditing ? (
                        <Input 
                            label="Max. Teilnehmer" 
                            type="number" 
                            value={editData.maxParticipants} 
                            onChange={e => setEditData({...editData, maxParticipants: parseInt(e.target.value)})} 
                            className="mb-0"
                        />
                    ) : (
                        <p className="text-sm">
                        {selectedEvent.participants.length} 
                        {selectedEvent.maxParticipants ? ` / ${selectedEvent.maxParticipants}` : ''} Teilnehmer
                        </p>
                    )}
                  </div>

                  {selectedEvent.averageRating && !isEditing && (
                    <div className="flex items-center gap-3">
                      <Star className="text-yellow-500 fill-current mt-0.5" size={20} />
                      <span className="font-bold text-stone-900">{selectedEvent.averageRating} / 5.0</span>
                    </div>
                  )}
                </div>
                
                {/* Edit Registration Status */}
                {isEditing && (
                    <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                        <h4 className="font-bold text-stone-800 mb-2">Anmeldestatus</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={editData.isRegistrationOpen} 
                                onChange={e => setEditData({...editData, isRegistrationOpen: e.target.checked})} 
                                className="w-5 h-5 text-primary-600 rounded"
                            />
                            <span>Anmeldung geöffnet</span>
                        </label>
                    </div>
                )}

                <div className="prose prose-stone">
                  <h3 className="text-lg font-bold text-stone-900">Beschreibung</h3>
                  {isEditing ? (
                      <textarea 
                        className="w-full p-2 border border-stone-300 rounded h-40"
                        value={editData.description}
                        onChange={e => setEditData({...editData, description: e.target.value})}
                      />
                  ) : (
                      <p className="whitespace-pre-line">{selectedEvent.description}</p>
                  )}
                </div>

                {/* Action Area */}
                {!isPast && currentUser && !isEditing && (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    {!selectedEvent.isRegistrationOpen && status !== 'joined' ? (
                        <div className="p-3 bg-red-50 text-red-800 text-center rounded-lg border border-red-100">
                            <p className="font-bold flex items-center justify-center gap-2"><Lock size={16}/> Anmeldung geschlossen</p>
                            <p className="text-xs mt-1">Der Organisator hat die Anmeldung für dieses Event beendet.</p>
                        </div>
                    ) : (
                        <>
                            {status === 'joined' && (
                            <div className="text-center space-y-4">
                                <div className="flex items-center justify-center gap-2 text-green-700 font-bold">
                                <CalendarCheck size={24} /> Du nimmst teil
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-stone-200 inline-block">
                                <QrCode size={120} className="mx-auto text-stone-900" />
                                <p className="text-xs text-stone-500 mt-2 font-mono uppercase tracking-widest">Ticket: {currentUser.id}-{selectedEvent.id}</p>
                                </div>
                                <Button variant="danger" size="sm" onClick={() => leaveEvent(selectedEvent.id)} className="w-full">Abmelden</Button>
                                
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" className="flex-1 flex items-center justify-center gap-2" onClick={() => handleDownloadICS(selectedEvent)}>
                                    <Download size={16} /> ICS
                                    </Button>
                                    <Button variant="secondary" size="sm" className="flex-1 flex items-center justify-center gap-2" onClick={() => handleGoogleCalendar(selectedEvent)}>
                                    <Calendar size={16} /> Google
                                    </Button>
                                </div>
                            </div>
                            )}
                            
                            {status === 'pending' && (
                            <div className="text-center space-y-3">
                                <div className="text-blue-600 font-bold flex items-center justify-center gap-2">
                                <Mail /> Anfrage gesendet
                                </div>
                                <p className="text-sm text-stone-600">Der Organisator muss deine Teilnahme noch bestätigen.</p>
                                <Button variant="danger" size="sm" onClick={() => leaveEvent(selectedEvent.id)}>Anfrage zurückziehen</Button>
                            </div>
                            )}
                            
                            {status === 'waiting' && (
                            <div className="text-center space-y-3">
                                <div className="text-orange-600 font-bold flex items-center justify-center gap-2">
                                <AlertCircle /> Auf Warteliste
                                </div>
                                <p className="text-sm text-stone-600">Du wirst benachrichtigt, sobald ein Platz frei wird.</p>
                                <Button variant="danger" size="sm" onClick={() => leaveEvent(selectedEvent.id)}>Von Warteliste entfernen</Button>
                            </div>
                            )}

                            {status === 'full' && (
                            <div className="space-y-3">
                                <div className="text-red-600 font-bold text-center">Leider ausgebucht</div>
                                <Button onClick={() => joinEvent(selectedEvent.id)} className="w-full bg-orange-600 hover:bg-orange-700">
                                Auf Warteliste setzen
                                </Button>
                            </div>
                            )}

                            {status === 'open' && (
                            canJoin(selectedEvent) ? (
                                <Button onClick={() => joinEvent(selectedEvent.id)} className="w-full py-3 text-lg shadow-lg shadow-primary-800/20">
                                    {selectedEvent.registrationMode === 'request' ? 'Teilnahme anfragen' : 'Jetzt Anmelden'}
                                </Button>
                            ) : (
                                <div className="p-3 bg-red-50 text-red-800 text-center rounded-lg border border-red-100">
                                    <p className="font-bold flex items-center justify-center gap-2"><Lock size={16}/> Teilnahme nicht möglich</p>
                                    <p className="text-xs mt-1">Du erfüllst leider nicht die Kriterien für dieses Event.</p>
                                </div>
                            )
                            )}
                        </>
                    )}
                  </div>
                )}
                
                {!currentUser && !isPast && (
                  <div className="text-center p-4 bg-stone-100 rounded-lg">
                    <p className="mb-2 text-sm">Bitte melde dich an, um teilzunehmen.</p>
                  </div>
                )}

                {isPast && (
                  <div className="bg-stone-100 p-4 rounded-xl">
                    <p className="text-stone-500 mb-3 text-center font-medium">Dieses Event hat bereits stattgefunden.</p>
                    
                    {status === 'joined' && !hasGivenFeedback && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-bold text-primary-900 mb-2">Wie hat es dir gefallen?</h4>
                        <div className="flex justify-center gap-2 mb-3">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                              <Star size={28} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-stone-300"} />
                            </button>
                          ))}
                        </div>
                        {rating > 0 && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <textarea 
                              className="w-full p-2 border border-stone-300 rounded-md text-sm focus:ring-primary-600 focus:border-primary-600"
                              placeholder="Dein Feedback (optional)..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                            <Button size="sm" className="w-full" onClick={handleFeedbackSubmit}>Feedback absenden</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {hasGivenFeedback && (
                      <div className="text-center text-green-600 font-bold text-sm flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> Danke für dein Feedback!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )} 
            {activeTab === 'resources' && <ResourceView />}
            {activeTab === 'requests' && canManage && <RequestsView />}
            {activeTab === 'participants' && canManage && <ParticipantsView />}
          </div>
        </div>
      </div>
    );
  }

  // List View (Redesigned)
  return (
    <div className="space-y-6">
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 my-8 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-primary-900">Neues Event erstellen</h2>
                    <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600"><X size={24}/></button>
                </div>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <ImageUpload 
                        label="Eventbild (Optional)"
                        onImageSelected={(base64) => setNewEvent({...newEvent, imageUrl: base64})}
                    />

                    <Input 
                        label="Titel" 
                        required 
                        value={newEvent.title} 
                        onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    />
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-stone-700 mb-1">Kategorie</label>
                        <div className="flex gap-2">
                            <select 
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
                                value={newEvent.category}
                                onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                            >
                                {eventCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Datum" type="date" required value={newEvent.startDate} onChange={e => setNewEvent({...newEvent, startDate: e.target.value})} />
                        <Input label="Start Zeit" type="time" required value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Ende Datum" type="date" required value={newEvent.endDate} onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} />
                        <Input label="Ende Zeit" type="time" required value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} />
                    </div>

                    {/* RECURRENCE SECTION */}
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-4">
                        <div className="flex items-center gap-2 font-bold text-blue-900 mb-2">
                            <Repeat size={18} /> Wiederholung
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-600 mb-1">Intervall</label>
                            <select 
                                className="w-full p-2 border border-stone-300 rounded bg-white text-sm"
                                value={newEvent.recurrence}
                                onChange={e => setNewEvent({...newEvent, recurrence: e.target.value as any})}
                            >
                                <option value="none">Keine Wiederholung</option>
                                <option value="daily">Täglich</option>
                                <option value="weekly">Wöchentlich</option>
                                <option value="monthly">Monatlich</option>
                            </select>
                        </div>
                        {newEvent.recurrence !== 'none' && (
                             <Input 
                                label="Wiederholen bis" 
                                type="date" 
                                required={newEvent.recurrence !== 'none'}
                                value={newEvent.recurrenceEnd}
                                onChange={e => setNewEvent({...newEvent, recurrenceEnd: e.target.value})}
                                className="bg-white"
                             />
                        )}
                    </div>

                    <Input label="Ort / Raum" required value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                    
                    <div className="mb-4">
                         <label className="block text-sm font-medium text-stone-700 mb-1">Beschreibung</label>
                         <textarea 
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                            rows={3}
                            value={newEvent.description}
                            onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                         />
                    </div>

                    <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-4">
                        <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2"><Tag size={16}/> Einstellungen & Zielgruppe</h4>
                        
                        {/* Registration Mode */}
                        <div>
                            <label className="block text-xs font-bold text-stone-600 mb-1">Anmeldemodus</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="radio" name="regMode" checked={newEvent.registrationMode === 'instant'} onChange={() => setNewEvent({...newEvent, registrationMode: 'instant'})} />
                                    Sofortbuchung
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="radio" name="regMode" checked={newEvent.registrationMode === 'request'} onChange={() => setNewEvent({...newEvent, registrationMode: 'request'})} />
                                    Anfrage (Genehmigung nötig)
                                </label>
                            </div>
                        </div>

                        {/* Gender Restriction */}
                        <div>
                            <label className="block text-xs font-bold text-stone-600 mb-1">Geschlecht</label>
                            <select 
                                className="w-full p-2 border border-stone-300 rounded bg-white text-sm"
                                value={newEvent.genderRestriction}
                                onChange={e => setNewEvent({...newEvent, genderRestriction: e.target.value as any})}
                            >
                                <option value="none">Alle willkommen</option>
                                <option value="male">Nur Männer</option>
                                <option value="female">Nur Frauen</option>
                            </select>
                        </div>

                        {/* Age Restriction */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="Min. Alter" 
                                type="number" 
                                value={newEvent.minAge} 
                                onChange={e => setNewEvent({...newEvent, minAge: e.target.value})} 
                                placeholder="z.B. 18"
                                className="bg-white"
                            />
                            <Input 
                                label="Max. Alter" 
                                type="number" 
                                value={newEvent.maxAge} 
                                onChange={e => setNewEvent({...newEvent, maxAge: e.target.value})} 
                                placeholder="Optional"
                                className="bg-white"
                            />
                        </div>

                        <Input 
                            label="Max. Teilnehmer (optional)" 
                            type="number" 
                            min="1"
                            value={newEvent.maxParticipants} 
                            onChange={e => setNewEvent({...newEvent, maxParticipants: e.target.value})}
                            className="bg-white"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                         <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCreateModal(false)}>Abbrechen</Button>
                         <Button type="submit" className="flex-1">Erstellen</Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-primary-900">Programm & Kalender</h1>
        {(currentUser?.role === 'admin' || currentUser?.role === 'organizer') && (
            <div className="flex gap-2">
                {currentUser.role === 'admin' && (
                    <Button variant="secondary" onClick={() => setShowCatManager(!showCatManager)} title="Kategorien verwalten">
                        <Tag size={18} />
                    </Button>
                )}
                <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                    <Plus size={18} /> Neues Event
                </Button>
            </div>
        )}
      </div>

      {/* Category Manager (Admin only) */}
      {showCatManager && (
          <Card className="p-4 bg-stone-100 border-stone-200 animate-in slide-in-from-top-2">
              <h3 className="font-bold text-stone-700 mb-2 text-sm">Kategorien verwalten</h3>
              <div className="flex gap-2 mb-3">
                  <Input placeholder="Neue Kategorie..." value={newCatName} onChange={e => setNewCatName(e.target.value)} className="mb-0 bg-white"/>
                  <Button onClick={handleAddCategory} size="sm">Hinzufügen</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                  {eventCategories.map(cat => (
                      <span key={cat} className="bg-white border border-stone-300 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          {cat}
                          <button onClick={() => removeEventCategory(cat)} className="text-red-500 hover:bg-red-50 rounded-full p-0.5"><X size={12}/></button>
                      </span>
                  ))}
              </div>
          </Card>
      )}
      
      {/* Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="Suche nach Titel..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-primary-600 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'ALL' ? 'bg-primary-800 text-white' : 'bg-white border border-stone-300 text-stone-600'}`}
          >
            Alle
          </button>
          {eventCategories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === cat ? 'bg-primary-800 text-white' : 'bg-white border border-stone-300 text-stone-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped List View */}
      <div className="space-y-8">
        {Object.keys(groupedEvents).length === 0 ? (
          <p className="text-center text-stone-500 py-8">Keine Events gefunden.</p>
        ) : (
          Object.keys(groupedEvents).map(dateKey => (
            <div key={dateKey}>
              <h3 className="text-primary-900 font-bold text-lg mb-3 sticky top-[72px] md:top-[80px] bg-stone-50/90 backdrop-blur py-2 z-10 border-b border-stone-200">
                {dateKey}
              </h3>
              <div className="space-y-3">
                {groupedEvents[dateKey].map(event => {
                  const isPast = new Date(event.dateTimeEnd) < new Date();
                  const status = getStatus(event);
                  const catConfig = getCategoryConfig(event.category);
                  const audienceConfig = getAudienceConfig(event);
                  const CatIcon = catConfig.icon;
                  const AudienceIcon = audienceConfig.icon;
                  const friendText = getFriendText(event);
                  const spotsLeft = event.maxParticipants ? Math.max(0, event.maxParticipants - event.participants.length) : null;
                  
                  return (
                    <Card key={event.id} onClick={() => setSearchParams({id: event.id})} className={`flex flex-col md:flex-row overflow-hidden hover:ring-2 ring-primary-100 transition-all cursor-pointer border-l-[6px] ${catConfig.border} ${isPast ? 'opacity-70 grayscale-[50%]' : ''}`}>
                       <div className="flex-1 p-4">
                          <div className="flex justify-between items-start mb-1">
                             <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${catConfig.bg} ${catConfig.color}`}>
                                <CatIcon size={12} /> {event.category}
                             </div>
                             {status === 'joined' && <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><CalendarCheck size={14}/> Angemeldet</span>}
                             {!event.isRegistrationOpen && !isPast && <span className="text-red-600 flex items-center gap-1 text-xs font-bold"><Lock size={14}/> Geschlossen</span>}
                          </div>
                          
                          <h3 className="font-bold text-stone-900 text-lg leading-snug mb-2">{event.title}</h3>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600 mb-2">
                             <span className="flex items-center gap-1"><Clock size={14}/> {new Date(event.dateTimeStart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(event.dateTimeEnd).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                             <span className="flex items-center gap-1"><MapPin size={14}/> {event.location}</span>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                              {spotsLeft !== null && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${spotsLeft === 0 ? 'bg-red-100 text-red-600' : spotsLeft < 5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                      {spotsLeft === 0 ? 'Ausgebucht' : `${spotsLeft} Plätze frei`}
                                  </span>
                              )}

                              {friendText && (
                                  <div className="flex items-center gap-1 text-xs text-purple-600 font-bold">
                                      <Smile size={14} /> {friendText}
                                  </div>
                              )}
                          </div>

                          {/* Audience Badge */}
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${audienceConfig.color}`}>
                             <AudienceIcon size={14} /> {audienceConfig.label}
                             {(event.minAge || event.maxAge) && <span className="opacity-75 ml-1">({event.minAge ? `${event.minAge}+` : ''}{event.maxAge ? `-${event.maxAge}` : ''})</span>}
                          </div>
                       </div>
                       
                       {/* Right Side / Bottom on Mobile */}
                       {event.maxParticipants && event.participants.length >= event.maxParticipants && status !== 'joined' && !isPast && (
                         <div className="bg-red-50 p-2 md:w-32 flex items-center justify-center text-red-700 text-xs font-bold border-t md:border-t-0 md:border-l border-red-100">
                           Ausgebucht
                         </div>
                       )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;
