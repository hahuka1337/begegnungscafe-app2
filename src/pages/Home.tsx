

import React, { useState, useEffect } from 'react';
import { useApp } from '../services/store';
import { Card, Button, Input, Badge } from '../components/Shared';
import { PollCard } from '../components/PollCard';
import { Calendar, ArrowRight, PlusCircle, X, Coffee, Edit, Save, Eye, EyeOff, Trash2, Plus, ChevronUp, ChevronDown, Clock, Lock, Unlock, CheckCircle, Users, Palette, BookOpen, Sparkles, HelpCircle, Baby, Smile } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeConfig, HomeSectionConfig, Event } from '../types';

// Extracted SectionWrapper to prevent re-mounting on parent state updates
const SectionWrapper: React.FC<{ 
    sectionKey: string;
    titleLabel?: string;
    children: React.ReactNode;
    isEditing: boolean;
    editConfig: HomeConfig;
    homeConfig: HomeConfig;
    updateSection: (section: keyof HomeConfig, field: string, value: any) => void;
    moveSection?: (direction: 'up' | 'down') => void;
    isFirst?: boolean;
    isLast?: boolean;
}> = ({ sectionKey, titleLabel = "Titel", children, isEditing, editConfig, homeConfig, updateSection, moveSection, isFirst, isLast }) => {
    const config = isEditing ? (editConfig as any)[sectionKey] : (homeConfig as any)[sectionKey];
    
    if (!isEditing && !config.isVisible) return null;

    return (
        <div className={`relative ${isEditing ? 'p-4 border-2 border-dashed border-primary-300 rounded-xl bg-stone-50 my-4' : ''}`}>
            {isEditing && (
                <div className="flex justify-between items-center mb-3 bg-white p-2 rounded border border-stone-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        {moveSection && (
                            <div className="flex flex-col gap-1 mr-2">
                                <button onClick={() => moveSection('up')} disabled={isFirst} className="p-0.5 hover:bg-stone-100 rounded disabled:opacity-30">
                                    <ChevronUp size={16}/>
                                </button>
                                <button onClick={() => moveSection('down')} disabled={isLast} className="p-0.5 hover:bg-stone-100 rounded disabled:opacity-30">
                                    <ChevronDown size={16}/>
                                </button>
                            </div>
                        )}
                        <span className="text-xs font-bold text-primary-800 uppercase tracking-wider">{sectionKey}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {'title' in config && (
                            <input 
                              className="text-sm border border-stone-300 rounded px-2 py-1 bg-white text-stone-900 placeholder-stone-400" 
                              value={config.title || ''} 
                              onChange={e => updateSection(sectionKey as keyof HomeConfig, 'title', e.target.value)}
                              placeholder={titleLabel}
                            />
                        )}
                        {'subtitle' in config && (
                            <input 
                              className="text-sm border border-stone-300 rounded px-2 py-1 bg-white text-stone-900 placeholder-stone-400" 
                              value={config.subtitle || ''} 
                              onChange={e => updateSection(sectionKey as keyof HomeConfig, 'subtitle', e.target.value)}
                              placeholder="Untertitel"
                            />
                        )}
                        <button 
                          onClick={() => updateSection(sectionKey as keyof HomeConfig, 'isVisible', !config.isVisible)}
                          className={`p-1.5 rounded ${config.isVisible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          title={config.isVisible ? "Sichtbar" : "Versteckt"}
                        >
                            {config.isVisible ? <Eye size={16}/> : <EyeOff size={16}/>}
                        </button>
                    </div>
                </div>
            )}
            <div className={isEditing && !config.isVisible ? 'opacity-50 grayscale' : ''}>
                {children}
            </div>
        </div>
    );
};

// Helper to determine category style
const getCategoryStyle = (category: string) => {
    switch (category) {
        case 'Spiritualität':
            return { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', icon: Sparkles };
        case 'Familie':
            return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', icon: Baby };
        case 'Kunst':
            return { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', icon: Palette };
        case 'Bildung':
            return { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200', icon: BookOpen };
        default:
            return { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-200', icon: HelpCircle };
    }
};

const Home: React.FC = () => {
  const { announcements, events, currentUser, polls, createPoll, homeConfig, updateHomeConfig, addAnnouncement, deleteAnnouncement, cafeConfig, updateCafeConfig, joinEvent, users } = useApp();
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const navigate = useNavigate();
  
  // Admin Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editConfig, setEditConfig] = useState<HomeConfig>(homeConfig);
  
  // Announcement Create State
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnText, setNewAnnText] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const canManageCafe = currentUser?.role === 'admin' || (currentUser?.role === 'organizer' && currentUser?.canManageCafe);

  // Get next 2 events
  const upcomingEvents = events
    .filter(e => new Date(e.dateTimeStart) > new Date())
    .sort((a, b) => new Date(a.dateTimeStart).getTime() - new Date(b.dateTimeStart).getTime())
    .slice(0, 2);

  const globalPolls = polls.filter(p => p.scope === 'global');

  // --- EVENT STATUS LOGIC FOR WELCOME WIDGET ---
  const now = new Date();
  
  // Check if an event is happening right now
  const currentEvent = events.find(e => {
      const start = new Date(e.dateTimeStart);
      const end = new Date(e.dateTimeEnd);
      return now >= start && now <= end;
  });

  // Find the next event
  const nextEvent = events
      .filter(e => new Date(e.dateTimeStart) > now)
      .sort((a, b) => new Date(a.dateTimeStart).getTime() - new Date(b.dateTimeStart).getTime())[0];

  let cafeStatusLabel = "Momentan";
  let cafeStatusText = "Geschlossen";
  let cafeTimeInfo = "";
  let isStatusOpen = false;

  if (currentEvent) {
      cafeStatusLabel = "Aktuell im Café";
      cafeStatusText = currentEvent.title;
      cafeTimeInfo = `Bis ${new Date(currentEvent.dateTimeEnd).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})} Uhr`;
      isStatusOpen = true;
  } else if (cafeConfig.isOpen) {
      // Manual Override: OPEN
      cafeStatusLabel = "Momentan";
      cafeStatusText = "Freier Zugang";
      cafeTimeInfo = "Geöffnet durch Organisator";
      isStatusOpen = true;
  } else {
      // Closed logic
      cafeStatusLabel = "Momentan";
      cafeStatusText = "Geschlossen";
      
      // Show when next event is, as subtext
      if (nextEvent) {
          const start = new Date(nextEvent.dateTimeStart);
          const diffMs = start.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          
          if (diffMins < 60) {
              cafeTimeInfo = `Nächstes Event in ${diffMins} Min: ${nextEvent.title}`;
          } else if (start.getDate() === now.getDate()) {
              cafeTimeInfo = `Nächstes Event um ${start.toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})} Uhr`;
          } else {
              cafeTimeInfo = `Nächstes Event am ${start.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'})}`;
          }
      } else {
           cafeTimeInfo = "Bitte Öffnungszeiten beachten";
      }
  }

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


  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim() || newPollOptions.some(o => !o.trim()) || !currentUser) return;

    createPoll({
      question: newPollQuestion,
      options: newPollOptions,
      scope: 'global',
      createdBy: currentUser.id
    });
    setShowPollCreator(false);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOpts = [...newPollOptions];
    newOpts[index] = value;
    setNewPollOptions(newOpts);
  };

  // --- EDIT HANDLERS ---
  const startEditing = () => {
      // Ensure order exists, if not in mock data (legacy support), create default
      const initialConfig = { ...homeConfig };
      if (!initialConfig.order) {
          initialConfig.order = ['welcome', 'events', 'cafeWidget', 'news', 'actions', 'polls'];
      }
      setEditConfig(initialConfig);
      setIsEditing(true);
  };

  const saveConfig = () => {
      updateHomeConfig(editConfig);
      setIsEditing(false);
  };

  const cancelEditing = () => {
      setIsEditing(false);
  };

  const updateSection = (section: keyof HomeConfig, field: string, value: any) => {
      setEditConfig(prev => ({
          ...prev,
          [section]: { ...prev[section], [field]: value }
      }));
  };
  
  const moveSection = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...editConfig.order];
      if (direction === 'up' && index > 0) {
          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      } else if (direction === 'down' && index < newOrder.length - 1) {
          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      }
      setEditConfig(prev => ({ ...prev, order: newOrder }));
  };
  
  const handleAddAnnouncement = (e: React.FormEvent) => {
      e.preventDefault();
      addAnnouncement(newAnnTitle, newAnnText);
      setNewAnnTitle('');
      setNewAnnText('');
  };

  const toggleCafeStatus = () => {
      updateCafeConfig({ isOpen: !cafeConfig.isOpen });
  };

  // --- RENDER SECTIONS ---
  
  const renderSection = (key: string) => {
      switch(key) {
          case 'welcome':
              return (
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-primary-900">
                            {(isEditing ? editConfig : homeConfig).welcome.title?.replace('{name}', currentUser?.name.split(' ')[0] || 'Gast')}
                        </h1>
                        <p className="text-stone-500 text-sm mt-1">
                            {(isEditing ? editConfig : homeConfig).welcome.subtitle}
                        </p>
                        {!currentUser && (
                        <Link to="/login" className="inline-block mt-2">
                            <Button size="sm">Anmelden</Button>
                        </Link>
                        )}
                        {canManageCafe && (
                            <div className="mt-4">
                                <button 
                                    onClick={toggleCafeStatus}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 ${cafeConfig.isOpen ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'}`}
                                >
                                    {cafeConfig.isOpen ? <Unlock size={14} /> : <Lock size={14} />}
                                    {cafeConfig.isOpen ? 'Café ist manuell geöffnet' : 'Café ist manuell geschlossen'}
                                </button>
                                <p className="text-[10px] text-stone-400 mt-1 ml-1">Klicke um Status zu ändern ("Freier Zugang")</p>
                            </div>
                        )}
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-stone-100 pt-4 sm:pt-0 sm:ml-4 min-w-[140px]">
                        <div className={`text-xs font-bold uppercase mb-0.5 ${isStatusOpen ? 'text-green-600' : 'text-red-500'}`}>
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isStatusOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {cafeStatusLabel}
                        </div>
                        <div className="text-base font-bold text-stone-800 leading-tight line-clamp-2">{cafeStatusText}</div>
                        {cafeTimeInfo && <div className="text-sm text-stone-500 font-medium mt-1">{cafeTimeInfo}</div>}
                        <Link to="/cafe" className="text-[10px] text-stone-400 hover:text-primary-600 hover:underline mt-2 block">Infos & Karte</Link>
                    </div>
                </section>
              );
          case 'cafeWidget':
              return (
                <div className="relative">
                    {isEditing && (
                        <div className="mb-2 flex gap-2">
                            <Input 
                                placeholder="Angebot Name" 
                                value={editConfig.cafeWidget.offerText} 
                                onChange={e => updateSection('cafeWidget', 'offerText', e.target.value)} 
                                className="mb-0 bg-white text-stone-900"
                            />
                            <Input 
                                placeholder="Preis" 
                                value={editConfig.cafeWidget.offerPrice} 
                                onChange={e => updateSection('cafeWidget', 'offerPrice', e.target.value)} 
                                className="mb-0 w-24 bg-white text-stone-900"
                            />
                        </div>
                    )}
                    <Link to="/cafe" className="block">
                        <Card className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors border-l-4 border-orange-400">
                            <div>
                                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                                    <Coffee size={18} className="text-orange-600"/> 
                                    {(isEditing ? editConfig : homeConfig).cafeWidget.title}
                                </h3>
                                <p className="text-sm text-stone-600 mt-1">
                                    {(isEditing ? editConfig : homeConfig).cafeWidget.offerText}
                                </p>
                            </div>
                            <Badge color="bg-orange-100 text-orange-800 font-bold">
                                {(isEditing ? editConfig : homeConfig).cafeWidget.offerPrice}
                            </Badge>
                        </Card>
                    </Link>
                </div>
              );
          case 'news':
              return (
                <section>
                  <h2 className="text-lg font-bold text-primary-900 mb-3">{(isEditing ? editConfig : homeConfig).news.title}</h2>
                  
                  {isEditing && (
                      <div className="bg-stone-100 p-4 rounded-lg mb-4 border border-stone-200">
                          <h4 className="text-sm font-bold text-stone-700 mb-2">Neue Ankündigung verfassen</h4>
                          <form onSubmit={handleAddAnnouncement} className="space-y-2">
                              <Input placeholder="Titel" value={newAnnTitle} onChange={e => setNewAnnTitle(e.target.value)} required className="bg-white text-stone-900 mb-0" />
                              <textarea 
                                className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-600" 
                                rows={2}
                                placeholder="Text..."
                                value={newAnnText}
                                onChange={e => setNewAnnText(e.target.value)}
                                required
                              />
                              <div className="flex justify-end">
                                  <Button type="submit" size="sm" className="flex items-center gap-1"><Plus size={14}/> Hinzufügen</Button>
                              </div>
                          </form>
                      </div>
                  )}
        
                  {announcements.length > 0 ? (
                       announcements.map(a => (
                        <div key={a.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-2 flex justify-between items-start">
                          <div>
                              <h3 className="font-bold text-yellow-900">{a.title}</h3>
                              <p className="text-yellow-800 text-sm">{a.text}</p>
                              <span className="text-[10px] text-yellow-800/60 mt-1 block">{new Date(a.date).toLocaleDateString()}</span>
                          </div>
                          {isEditing && (
                              <button onClick={() => deleteAnnouncement(a.id)} className="text-yellow-700 hover:text-red-600 p-1">
                                  <Trash2 size={16} />
                              </button>
                          )}
                        </div>
                      ))
                  ) : (
                      <p className="text-stone-400 text-sm italic">Keine Neuigkeiten.</p>
                  )}
                </section>
              );
          case 'actions':
              return (
                <div className="grid grid-cols-2 gap-4">
                    <Link to="/events" className="block">
                        <Card className="p-4 h-full flex flex-col items-center justify-center text-center hover:bg-stone-50">
                            <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center mb-2">
                                <Calendar size={20} />
                            </div>
                            <span className="font-medium text-stone-800">Programm</span>
                        </Card>
                    </Link>
                    <Link to="/groups" className="block">
                        <Card className="p-4 h-full flex flex-col items-center justify-center text-center hover:bg-stone-50">
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mb-2">
                                <UsersIcon />
                            </div>
                            <span className="font-medium text-stone-800">Gruppen</span>
                        </Card>
                    </Link>
                </div>
              );
          case 'polls':
              return (
                <section>
                    <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-primary-900">{(isEditing ? editConfig : homeConfig).polls.title}</h2>
                    {currentUser?.role === 'admin' && (
                        <Button size="sm" variant="ghost" onClick={() => setShowPollCreator(!showPollCreator)}>
                        {showPollCreator ? <X size={16} /> : <PlusCircle size={16} />}
                        </Button>
                    )}
                    </div>
                    
                    {showPollCreator && (
                    <Card className="p-4 mb-4 bg-primary-50 border-primary-100 animate-in fade-in slide-in-from-top-2">
                        <h3 className="font-bold text-primary-900 mb-2">Neue Umfrage erstellen</h3>
                        <form onSubmit={handleCreatePoll}>
                        <Input placeholder="Frage stellen..." value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)} required className="mb-2 bg-white text-stone-900" />
                        {newPollOptions.map((opt, idx) => (
                            <Input key={idx} placeholder={`Option ${idx + 1}`} value={opt} onChange={e => handleOptionChange(idx, e.target.value)} required className="mb-2 bg-white text-stone-900" />
                        ))}
                        <div className="flex gap-2 mt-2">
                            <Button type="button" size="sm" variant="ghost" onClick={() => setNewPollOptions([...newPollOptions, ''])}>+ Option</Button>
                            <Button type="submit" size="sm" className="ml-auto">Erstellen</Button>
                        </div>
                        </form>
                    </Card>
                    )}
        
                    {globalPolls.length > 0 ? (
                    <div className="space-y-4">
                        {globalPolls.map(poll => (
                        <PollCard key={poll.id} poll={poll} />
                        ))}
                    </div>
                    ) : (
                    <p className="text-stone-400 text-sm italic">Derzeit keine aktiven Umfragen.</p>
                    )}
                </section>
              );
          case 'events':
              return (
                <section>
                    <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-primary-900">{(isEditing ? editConfig : homeConfig).events.title}</h2>
                    <Link to="/events" className="text-primary-600 text-sm font-medium flex items-center">
                        Alle <ArrowRight size={16} className="ml-1" />
                    </Link>
                    </div>
                    <div className="space-y-3">
                    {upcomingEvents.map(e => {
                        const isJoined = currentUser && e.participants.includes(currentUser.id);
                        const isFull = e.maxParticipants && e.participants.length >= e.maxParticipants;
                        const spotsLeft = e.maxParticipants ? Math.max(0, e.maxParticipants - e.participants.length) : null;
                        const catStyle = getCategoryStyle(e.category);
                        const CatIcon = catStyle.icon;
                        const friendText = getFriendText(e);
                        
                        return (
                        <Card key={e.id} className="flex flex-row p-3 items-center gap-3 border border-stone-200">
                        {/* Date Box with dynamic color */}
                        <div className={`${catStyle.bg} ${catStyle.text} rounded-lg p-3 text-center min-w-[60px] h-full flex flex-col justify-center shrink-0 border ${catStyle.border}`}>
                            <span className="block text-xs font-bold uppercase">{new Date(e.dateTimeStart).toLocaleDateString('de-DE', { month: 'short' })}</span>
                            <span className="block text-xl font-bold">{new Date(e.dateTimeStart).getDate()}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/events?id=${e.id}`)}>
                            {/* Category Badge above Title */}
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className={`p-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                                    <CatIcon size={10} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${catStyle.text}`}>{e.category}</span>
                            </div>
                            
                            <h3 className="font-bold text-stone-900 text-sm line-clamp-1 hover:text-primary-700">{e.title}</h3>
                            <p className="text-stone-500 text-xs truncate mb-1">{e.dateTimeStart.split('T')[1].substring(0, 5)} Uhr • {e.location}</p>
                            
                            <div className="flex items-center gap-2 mt-1">
                                {/* Spots Info */}
                                {spotsLeft !== null && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${spotsLeft < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                        {spotsLeft === 0 ? 'Ausgebucht' : `${spotsLeft} Plätze frei`}
                                    </span>
                                )}

                                {/* Friend Info */}
                                {friendText && (
                                    <div className="flex items-center gap-1 text-[10px] text-purple-600 font-bold">
                                        <Smile size={10} /> {friendText}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0">
                            {isJoined ? (
                                <div className="flex flex-col items-center text-green-600">
                                    <CheckCircle size={20} />
                                    <span className="text-[10px] font-bold">Dabei</span>
                                </div>
                            ) : isFull ? (
                                <Link to="/events">
                                    <Button size="sm" variant="secondary" className="text-xs px-2 py-1 h-auto">Warteliste</Button>
                                </Link>
                            ) : (
                                <Button 
                                    size="sm" 
                                    className="text-xs px-3 py-1.5 h-auto shadow-sm"
                                    onClick={() => {
                                        if (currentUser) joinEvent(e.id);
                                        else navigate('/login');
                                    }}
                                >
                                    Anmelden
                                </Button>
                            )}
                        </div>
                        </Card>
                    )})}
                    </div>
                </section>
              );
          default:
              return null;
      }
  };

  const currentOrder = isEditing ? editConfig.order : homeConfig.order;

  return (
    <div className="space-y-6">
      {/* Admin Toolbar */}
      {isAdmin && (
          <div className="flex justify-end sticky top-20 z-30">
              {isEditing ? (
                  <div className="flex gap-2 bg-white p-2 rounded-lg shadow-lg border border-stone-200">
                      <Button variant="ghost" onClick={cancelEditing} className="flex items-center gap-2"><X size={16}/> Abbrechen</Button>
                      <Button onClick={saveConfig} className="flex items-center gap-2 bg-green-600 hover:bg-green-700"><Save size={16}/> Änderungen Speichern</Button>
                  </div>
              ) : (
                  <Button onClick={startEditing} variant="secondary" className="flex items-center gap-2 shadow-sm border border-stone-300">
                      <Edit size={16} /> Startseite bearbeiten
                  </Button>
              )}
          </div>
      )}
      
      {/* Render Sections based on Order */}
      {currentOrder.map((key, index) => (
          <SectionWrapper 
              key={key}
              sectionKey={key}
              isEditing={isEditing} 
              editConfig={editConfig} 
              homeConfig={homeConfig} 
              updateSection={updateSection}
              moveSection={(direction) => moveSection(index, direction)}
              isFirst={index === 0}
              isLast={index === currentOrder.length - 1}
          >
              {renderSection(key)}
          </SectionWrapper>
      ))}
    </div>
  );
};

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export default Home;
