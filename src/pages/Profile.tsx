import React, { useState } from 'react';
import { useApp } from '../services/store';
import { Button, Card, Input, Badge, ImageUpload, Select } from '../components/Shared';
import { User, LogOut, ShieldCheck, Download, Trash2, CheckCircle, AlertCircle, QrCode, Lightbulb, X, Laptop, Calendar, Users, UserPlus, UserMinus, Smile, Globe, Lock, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PrivacyLevel } from '../types';

const Profile: React.FC = () => {
  const { currentUser, logout, updateProfile, events, feedbacks, pollVotes, requestNotificationPermission, notifications, submitSuggestion, coworkingBookings, cancelCoworkingBooking, coworkingDesks, users, sendFriendRequest, respondToFriendRequest, removeFriend } = useApp();
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  // Edit State
  const [formData, setFormData] = useState({
      name: '',
      avatarUrl: '',
      bio: '',
      job: '',
      hobbies: '',
      privacyDetails: 'public' as PrivacyLevel,
      privacyGroups: 'friends' as PrivacyLevel,
      privacyFriends: 'friends' as PrivacyLevel
  });

  // Suggestion Modal State
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionType, setSuggestionType] = useState<'activity' | 'improvement' | 'other'>('activity');
  const [suggestionDesc, setSuggestionDesc] = useState('');
  const [suggestionPhone, setSuggestionPhone] = useState('');
  const [suggestionEmail, setSuggestionEmail] = useState('');

  // Friend Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Update email state when user opens modal or logs in
  React.useEffect(() => {
    if (currentUser) {
        setSuggestionEmail(currentUser.email);
        // Initialize form data
        setFormData({
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl || '',
            bio: currentUser.bio || '',
            job: currentUser.job || '',
            hobbies: currentUser.hobbies?.join(', ') || '',
            privacyDetails: currentUser.privacySettings?.details || 'public',
            privacyGroups: currentUser.privacySettings?.groups || 'friends',
            privacyFriends: currentUser.privacySettings?.friends || 'friends'
        });
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <User size={64} className="text-stone-300" />
        <h2 className="text-xl font-bold text-stone-700">Nicht angemeldet</h2>
        <p className="text-stone-500">Bitte melde dich an, um dein Profil zu sehen.</p>
        <Link to="/login"><Button>Zum Login</Button></Link>
      </div>
    );
  }

  const handleSave = () => {
    updateProfile({ 
        name: formData.name, 
        avatarUrl: formData.avatarUrl,
        bio: formData.bio,
        job: formData.job,
        hobbies: formData.hobbies.split(',').map(s => s.trim()).filter(s => s),
        privacySettings: {
            details: formData.privacyDetails,
            groups: formData.privacyGroups,
            friends: formData.privacyFriends
        }
    });
    setEditing(false);
  };

  const handleExportData = () => {
    const data = {
      userProfile: currentUser,
      myEvents: events.filter(e => e.participants.includes(currentUser.id)),
      myFeedbacks: feedbacks.filter(f => f.userId === currentUser.id),
      myVotes: pollVotes.filter(v => v.userId === currentUser.id),
      myCoworking: coworkingBookings.filter(b => b.userId === currentUser.id),
      friends: currentUser.friends,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `begegnungscafe_data_${currentUser.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitSuggestion = (e: React.FormEvent) => {
      e.preventDefault();
      submitSuggestion({
          userId: currentUser.id,
          title: suggestionTitle,
          type: suggestionType,
          description: suggestionDesc,
          contactPhone: suggestionPhone,
          contactEmail: suggestionEmail
      });
      setShowSuggestionModal(false);
      setSuggestionTitle('');
      setSuggestionDesc('');
      setSuggestionPhone('');
      setSuggestionEmail(currentUser.email);
      setSuggestionType('activity');
  };

  const canCheckIn = currentUser.role === 'organizer' || currentUser.role === 'admin';
  const myCoworkingBookings = coworkingBookings.filter(b => b.userId === currentUser.id && new Date(b.date) >= new Date(new Date().setHours(0,0,0,0))).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const friendRequests = currentUser.friendRequests || [];
  const friends = currentUser.friends || [];
  
  const availableUsers = users.filter(u => 
      u.id !== currentUser.id && 
      !friends.includes(u.id) && 
      !friendRequests.includes(u.id) &&
      !u.friendRequests.includes(currentUser.id) &&
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {showSuggestionModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-primary-900">Idee oder Vorschlag einreichen</h3>
                      <button onClick={() => setShowSuggestionModal(false)} className="text-stone-400 hover:text-stone-600"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSubmitSuggestion} className="space-y-4">
                      <Input 
                        label="Titel" 
                        value={suggestionTitle} 
                        onChange={e => setSuggestionTitle(e.target.value)} 
                        required 
                        placeholder="Kurzer Titel deines Vorschlags..."
                      />
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-stone-700 mb-1">Art des Vorschlags</label>
                          <select 
                            className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                            value={suggestionType}
                            onChange={e => setSuggestionType(e.target.value as any)}
                          >
                              <option value="activity">Neue Aktivität / Event</option>
                              <option value="improvement">Verbesserungsvorschlag</option>
                              <option value="other">Sonstiges</option>
                          </select>
                      </div>
                      <div className="mb-4">
                           <label className="block text-sm font-medium text-stone-700 mb-1">Beschreibung</label>
                           <textarea 
                              className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-600 outline-none"
                              rows={4}
                              value={suggestionDesc}
                              onChange={e => setSuggestionDesc(e.target.value)}
                              required
                              placeholder="Beschreibe deine Idee genauer..."
                           />
                      </div>
                      
                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-3">
                          <h4 className="text-sm font-bold text-stone-700">Kontaktdaten für Rückfragen</h4>
                          <Input 
                            label="E-Mail"
                            type="email"
                            value={suggestionEmail} 
                            onChange={e => setSuggestionEmail(e.target.value)} 
                            required 
                            className="mb-0 bg-white"
                          />
                          <Input 
                            label="Telefon (Optional)"
                            type="tel"
                            value={suggestionPhone} 
                            onChange={e => setSuggestionPhone(e.target.value)} 
                            placeholder="z.B. 0170 12345678"
                            className="mb-0 bg-white"
                          />
                      </div>

                      <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setShowSuggestionModal(false)}>Abbrechen</Button>
                          <Button type="submit">Einreichen</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-900">Dein Profil</h1>
        <Button variant="ghost" onClick={logout} className="text-red-600"><LogOut size={20} /></Button>
      </div>

      <Card className="p-6">
        {editing ? (
          <div className="flex flex-col gap-6">
             <div className="flex flex-col items-center">
                <ImageUpload 
                  currentImage={formData.avatarUrl} 
                  onImageSelected={url => setFormData({...formData, avatarUrl: url})} 
                  circular 
                  label="Profilbild ändern"
                  className="self-center"
                />
             </div>
             
             <div className="space-y-4">
                 <h3 className="font-bold text-stone-800 border-b border-stone-200 pb-2">Basisdaten</h3>
                 <Input 
                   label="Anzeigename"
                   value={formData.name} 
                   onChange={(e) => setFormData({...formData, name: e.target.value})} 
                 />
                 
                 <div className="mb-4">
                     <label className="block text-sm font-medium text-stone-700 mb-1">Über mich (Bio)</label>
                     <textarea 
                        className="w-full p-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        rows={3}
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                        placeholder="Erzähl etwas über dich..."
                     />
                 </div>

                 <Input 
                   label="Beruf / Tätigkeit"
                   value={formData.job} 
                   onChange={(e) => setFormData({...formData, job: e.target.value})} 
                   placeholder="z.B. Lehrer, Student..."
                 />

                 <Input 
                   label="Hobbys (kommagetrennt)"
                   value={formData.hobbies} 
                   onChange={(e) => setFormData({...formData, hobbies: e.target.value})} 
                   placeholder="z.B. Lesen, Wandern, Kochen"
                 />

                 <h3 className="font-bold text-stone-800 border-b border-stone-200 pb-2 pt-4">Privatsphäre</h3>
                 <p className="text-xs text-stone-500 mb-4">Bestimme, wer welche Informationen sehen darf.</p>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Select 
                        label="Details (Bio, Job, Hobbys)" 
                        value={formData.privacyDetails}
                        onChange={e => setFormData({...formData, privacyDetails: e.target.value as PrivacyLevel})}
                     >
                         <option value="public">Jeder (Öffentlich)</option>
                         <option value="friends">Nur Freunde</option>
                         <option value="private">Nur ich</option>
                     </Select>

                     <Select 
                        label="Meine Gruppen" 
                        value={formData.privacyGroups}
                        onChange={e => setFormData({...formData, privacyGroups: e.target.value as PrivacyLevel})}
                     >
                         <option value="public">Jeder</option>
                         <option value="friends">Nur Freunde</option>
                         <option value="private">Nur ich</option>
                     </Select>

                     <Select 
                        label="Meine Freundesliste" 
                        value={formData.privacyFriends}
                        onChange={e => setFormData({...formData, privacyFriends: e.target.value as PrivacyLevel})}
                     >
                         <option value="public">Jeder</option>
                         <option value="friends">Nur Freunde</option>
                         <option value="private">Nur ich</option>
                     </Select>
                 </div>
             </div>

             <div className="flex gap-2 justify-end pt-4 border-t border-stone-100">
               <Button variant="ghost" onClick={() => setEditing(false)} size="sm">Abbrechen</Button>
               <Button onClick={handleSave} size="sm">Speichern</Button>
             </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-20 rounded-full bg-primary-800 text-white text-3xl font-bold flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                    currentUser.name.charAt(0)
                )}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-stone-900">{currentUser.name}</h2>
                    <p className="text-stone-500">{currentUser.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs uppercase tracking-wider text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">{currentUser.role}</span>
                        {currentUser.isVerified ? (
                            <Badge color="bg-green-100 text-green-800 flex items-center gap-1 px-2"><CheckCircle size={12}/> Verifiziert</Badge>
                        ) : (
                            <Badge color="bg-yellow-100 text-yellow-800 flex items-center gap-1 px-2"><AlertCircle size={12}/> Unverifiziert</Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                    <p className="text-xs font-bold text-stone-400 uppercase mb-1">Über mich</p>
                    <p className="text-stone-700 text-sm">{currentUser.bio || "Keine Beschreibung angegeben."}</p>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between bg-stone-50 p-2 rounded border border-stone-100 text-sm">
                        <span className="text-stone-500">Beruf</span>
                        <span className="font-medium">{currentUser.job || "-"}</span>
                    </div>
                    <div className="flex justify-between bg-stone-50 p-2 rounded border border-stone-100 text-sm">
                        <span className="text-stone-500">Hobbys</span>
                        <span className="font-medium truncate max-w-[150px] text-right">{currentUser.hobbies && currentUser.hobbies.length > 0 ? currentUser.hobbies.join(", ") : "-"}</span>
                    </div>
                </div>
            </div>
            
            <Button variant="secondary" onClick={() => setEditing(true)} size="sm" className="w-full md:w-auto">Profil & Privatsphäre bearbeiten</Button>
          </>
        )}
      </Card>

      <section>
        <h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2"><Users size={18}/> Community & Freunde</h3>
        
        {friendRequests.length > 0 && (
            <Card className="p-4 mb-4 bg-primary-50 border border-primary-100">
                <h4 className="font-bold text-primary-900 text-sm mb-3">Offene Freundschaftsanfragen</h4>
                <div className="space-y-2">
                    {friendRequests.map(reqId => {
                        const requester = users.find(u => u.id === reqId);
                        if (!requester) return null;
                        return (
                            <div key={reqId} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                                <Link to={`/users/${reqId}`} className="flex items-center gap-2 hover:bg-stone-50 rounded p-1">
                                    <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden">
                                        {requester.avatarUrl ? <img src={requester.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-stone-500">{requester.name[0]}</div>}
                                    </div>
                                    <span className="font-medium text-sm text-stone-900">{requester.name}</span>
                                </Link>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="text-red-500 p-1 h-auto" onClick={() => respondToFriendRequest(reqId, 'reject')}><X size={16}/></Button>
                                    <Button size="sm" className="bg-primary-600 text-white p-1 h-auto" onClick={() => respondToFriendRequest(reqId, 'accept')}><CheckCircle size={16}/></Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
        )}

        <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-stone-100">
                <h4 className="font-bold text-stone-800 text-sm">Meine Freunde ({friends.length})</h4>
            </div>
            {friends.length === 0 ? (
                <div className="p-6 text-center text-stone-500">
                    <p className="text-sm">Du hast noch keine Freunde hinzugefügt.</p>
                </div>
            ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-stone-100">
                    {friends.map(friendId => {
                        const friend = users.find(u => u.id === friendId);
                        if(!friend) return null;
                        return (
                            <div key={friendId} className="p-3 flex items-center justify-between hover:bg-stone-50">
                                <Link to={`/users/${friendId}`} className="flex items-center gap-3 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden">
                                         {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-stone-500">{friend.name[0]}</div>}
                                    </div>
                                    <span className="font-medium text-sm text-stone-900">{friend.name}</span>
                                </Link>
                                <button onClick={() => removeFriend(friendId)} className="text-stone-400 hover:text-red-500 p-2" title="Freund entfernen">
                                    <UserMinus size={16}/>
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
            
            <div className="p-4 bg-stone-50 border-t border-stone-100">
                <h4 className="font-bold text-stone-800 text-sm mb-2">Nutzer finden</h4>
                <Input 
                    placeholder="Name suchen..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="mb-2 bg-white"
                />
                {searchTerm && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableUsers.length === 0 ? (
                            <p className="text-xs text-stone-500 italic">Keine Nutzer gefunden.</p>
                        ) : (
                            availableUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between bg-white p-2 rounded border border-stone-200">
                                    <Link to={`/users/${user.id}`} className="text-sm font-medium truncate pr-2 hover:underline text-primary-800">{user.name}</Link>
                                    <Button size="sm" variant="secondary" className="text-xs px-2 py-1 h-auto" onClick={() => sendFriendRequest(user.id)}>
                                        <UserPlus size={14} className="mr-1"/> Adden
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </Card>
      </section>

      <section>
          <h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2"><Laptop size={18}/> Meine Co-Working Slots</h3>
          {myCoworkingBookings.length === 0 ? (
              <Card className="p-4 bg-stone-50 text-center">
                  <p className="text-sm text-stone-500">Keine anstehenden Buchungen.</p>
                  <Link to="/coworking" className="text-primary-600 text-sm font-bold hover:underline block mt-2">Jetzt buchen</Link>
              </Card>
          ) : (
              <div className="space-y-3">
                  {myCoworkingBookings.map(b => {
                      const desk = coworkingDesks.find(d => d.id === b.deskId);
                      return (
                          <Card key={b.id} className="p-4 border-l-4 border-primary-500 relative overflow-hidden">
                              <div className="flex justify-between items-start relative z-10">
                                  <div>
                                      <h4 className="font-bold text-stone-900">{new Date(b.date).toLocaleDateString('de-DE', {weekday: 'long', day: 'numeric', month: 'long'})}</h4>
                                      <p className="text-stone-600 text-sm flex items-center gap-1 mt-1">
                                          <Laptop size={14}/> {desk?.name} ({b.slot === 'FULL' ? 'Ganztags' : b.slot === 'AM' ? 'Vormittag' : 'Nachmittag'})
                                      </p>
                                  </div>
                                  <QrCode size={48} className="text-stone-800 bg-white p-1 rounded shadow-sm" />
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-500 hover:text-red-700 text-xs px-0 mt-2 relative z-10"
                                onClick={() => cancelCoworkingBooking(b.id)}
                              >
                                  Stornieren
                              </Button>
                              <Laptop className="absolute -right-4 -bottom-4 text-stone-100 w-32 h-32 z-0" />
                          </Card>
                      );
                  })}
              </div>
          )}
      </section>

      {!currentUser.isVerified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
              <h3 className="font-bold text-yellow-800 text-sm flex items-center gap-2"><AlertCircle size={16}/> Eingeschränkte Funktionen</h3>
              <p className="text-yellow-700 text-sm mt-1">
                  Du kannst dich für Events anmelden, aber um in Gruppen zu schreiben, muss dein Account von einem Admin verifiziert werden.
                  Bitte sprich uns beim nächsten Event an!
              </p>
          </div>
      )}

      <section>
          <h3 className="font-bold text-stone-700 mb-3">Aktionen</h3>
          <Card className="p-4" onClick={() => setShowSuggestionModal(true)}>
             <div className="flex items-center gap-3 cursor-pointer hover:bg-stone-50 p-2 -m-2 rounded-lg transition-colors">
                 <div className="h-10 w-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                    <Lightbulb size={20} />
                 </div>
                 <div className="flex-1">
                    <h4 className="font-bold text-stone-800">Vorschlag einreichen</h4>
                    <p className="text-xs text-stone-500">Hast du Ideen für Events oder Verbesserungen?</p>
                 </div>
             </div>
          </Card>
      </section>

      <section>
        <h3 className="font-bold text-stone-700 mb-3">Benachrichtigungen</h3>
        
        <Card className="divide-y divide-stone-100 mb-4">
            <div className="p-4 flex justify-between items-center">
                <div>
                    <p className="text-stone-700 font-medium">Browser-Push aktivieren</p>
                    <p className="text-xs text-stone-400">Erhalte Nachrichten auch bei geschlossener App</p>
                </div>
                {Notification.permission === 'granted' ? (
                    <span className="text-green-600 text-sm font-bold flex items-center gap-1"><CheckCircle size={16}/> Aktiv</span>
                ) : (
                    <Button size="sm" onClick={requestNotificationPermission}>Aktivieren</Button>
                )}
            </div>
        </Card>

        <Card className="divide-y divide-stone-100">
          {[
            { key: 'events', label: 'Neue Events' },
            { key: 'groups', label: 'Gruppenaktivitäten' },
            { key: 'announcements', label: 'Wichtige Ankündigungen' }
          ].map(setting => (
            <div key={setting.key} className="p-4 flex justify-between items-center">
              <span className="text-stone-700">{setting.label}</span>
              <div 
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${currentUser.notificationSettings[setting.key as keyof typeof currentUser.notificationSettings] ? 'bg-primary-600' : 'bg-stone-300'}`}
                onClick={() => updateProfile({
                  notificationSettings: {
                    ...currentUser.notificationSettings,
                    [setting.key]: !currentUser.notificationSettings[setting.key as keyof typeof currentUser.notificationSettings]
                  }
                })}
              >
                <div className={`absolute top-1 h-4 w-4 bg-white rounded-full transition-all ${currentUser.notificationSettings[setting.key as keyof typeof currentUser.notificationSettings] ? 'left-7' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </Card>
      </section>

      {(currentUser.role === 'admin' || currentUser.role === 'organizer') && (
        <section>
            <h3 className="font-bold text-stone-700 mb-3">Organisation</h3>
            <div className="grid gap-3">
                {currentUser.role === 'admin' && (
                    <Link to="/admin">
                    <Button className="w-full flex items-center justify-center gap-2" variant="primary">
                        <ShieldCheck size={18} /> Admin Dashboard
                    </Button>
                    </Link>
                )}
                {canCheckIn && (
                    <Link to="/checkin">
                        <Button className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white" variant="primary">
                            <QrCode size={18} /> Ticket Scanner (Check-In)
                        </Button>
                    </Link>
                )}
            </div>
        </section>
      )}

      <section>
        <h3 className="font-bold text-stone-700 mb-3">Datenschutz & Account</h3>
        <Card className="divide-y divide-stone-100">
          <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-stone-50" onClick={handleExportData}>
            <Download size={20} className="text-stone-500" />
            <div className="flex-1">
              <p className="font-medium text-stone-800">Meine Daten exportieren</p>
              <p className="text-xs text-stone-500">Lade eine Kopie all deiner Aktivitäten herunter.</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-red-50 group">
            <Trash2 size={20} className="text-red-500" />
            <div className="flex-1">
              <p className="font-medium text-red-600">Account löschen</p>
              <p className="text-xs text-stone-500">Unwiderruflich. Beiträge werden anonymisiert.</p>
            </div>
          </div>
        </Card>
      </section>
      
      <div className="text-center text-xs text-stone-400 pt-6">
        <Link to="/impressum" className="hover:underline">Impressum</Link> • <Link to="/datenschutz" className="hover:underline">Datenschutz</Link>
      </div>
    </div>
  );
};

export default Profile;
