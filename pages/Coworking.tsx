
import React, { useState } from 'react';
import { useApp } from '../services/store';
import { Card, Button, Input, Badge } from '../components/Shared';
import { Laptop, Calendar, Clock, Zap, Users, CheckCircle, AlertCircle, Wifi, VolumeX, CalendarX, Edit2, X, Save, Trash2, Plus, Coffee } from 'lucide-react';
import { CoworkingDesk, CoworkingRule, CoworkingSlotType } from '../types';
import { Link } from 'react-router-dom';

const ICON_MAP = {
    wifi: Wifi,
    volume: VolumeX,
    clock: Clock,
    zap: Zap,
    calendar: Calendar,
    coffee: Coffee
};

const Coworking: React.FC = () => {
  const { coworkingDesks, coworkingBookings, bookCoworkingSlot, currentUser, events, coworkingRules, updateCoworkingRules, addCoworkingDesk, updateCoworkingDesk, deleteCoworkingDesk } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<CoworkingSlotType>('FULL');
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editRules, setEditRules] = useState<CoworkingRule[]>([]);
  const [editDesks, setEditDesks] = useState<CoworkingDesk[]>([]);

  const isAdmin = currentUser?.role === 'admin';

  // --- LOGIC ---

  const startEditing = () => {
      setEditRules(JSON.parse(JSON.stringify(coworkingRules)));
      setEditDesks(JSON.parse(JSON.stringify(coworkingDesks)));
      setIsEditing(true);
  };

  const cancelEditing = () => {
      setIsEditing(false);
  };

  const saveEditing = () => {
      updateCoworkingRules(editRules);
      // Desks are updated live via store actions in this version for simplicity
      setIsEditing(false);
  };
  
  // Rules Handlers
  const updateRule = (idx: number, field: keyof CoworkingRule, value: string) => {
      const newRules = [...editRules];
      newRules[idx] = { ...newRules[idx], [field]: value };
      setEditRules(newRules);
  };

  // Desk Handlers (Direct Store Manipulation for Simplicity in this View)
  const handleAddDesk = () => {
      addCoworkingDesk({
          name: 'Neuer Tisch',
          capacity: 1,
          features: ['Steckdose']
      });
  };

  const handleDeleteDesk = (id: string) => {
      if(window.confirm("Tisch wirklich löschen?")) {
          deleteCoworkingDesk(id);
      }
  };

  const handleUpdateDesk = (id: string, field: keyof CoworkingDesk, value: any) => {
      updateCoworkingDesk(id, { [field]: value });
  };


  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <Laptop size={48} className="text-stone-300" />
        <h2 className="text-xl font-bold text-stone-700">Co-Working Space</h2>
        <p className="text-stone-500">Bitte melde dich an, um einen Arbeitsplatz zu buchen.</p>
        <Link to="/login"><Button>Zum Login</Button></Link>
      </div>
    );
  }

  // 1. Check for Event Conflicts
  const conflictingEvents = events.filter(e => {
      const eventDate = new Date(e.dateTimeStart).toISOString().split('T')[0];
      if (eventDate !== selectedDate) return false;
      return e.location === 'Hauptsaal'; 
  });

  const isBlocked = conflictingEvents.length > 0;

  // 2. Check Desk Availability
  const getDeskStatus = (deskId: string) => {
      const bookingsForDay = coworkingBookings.filter(b => b.date === selectedDate && b.deskId === deskId && b.status === 'active');
      const isBookedAM = bookingsForDay.some(b => b.slot === 'AM' || b.slot === 'FULL');
      const isBookedPM = bookingsForDay.some(b => b.slot === 'PM' || b.slot === 'FULL');
      
      if (selectedSlot === 'FULL' && (isBookedAM || isBookedPM)) return 'booked';
      if (selectedSlot === 'AM' && isBookedAM) return 'booked';
      if (selectedSlot === 'PM' && isBookedPM) return 'booked';

      return 'available';
  };

  const handleBook = (deskId: string) => {
      if (isBlocked) return;
      bookCoworkingSlot(deskId, selectedDate, selectedSlot);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
       {/* Admin Controls */}
       {isAdmin && (
          <div className="flex justify-end sticky top-20 z-30">
              {isEditing ? (
                  <div className="flex gap-2 bg-white p-2 rounded-lg shadow-lg border border-stone-200">
                      <Button variant="ghost" onClick={cancelEditing} className="flex items-center gap-2"><X size={16}/> Abbrechen</Button>
                      <Button onClick={saveEditing} className="flex items-center gap-2 bg-green-600 hover:bg-green-700"><Save size={16}/> Regeln Speichern</Button>
                  </div>
              ) : (
                  <Button onClick={startEditing} variant="secondary" className="flex items-center gap-2 shadow-sm border border-stone-300">
                      <Edit2 size={16} /> Seite bearbeiten
                  </Button>
              )}
          </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
           <Laptop className="text-primary-800" /> Co-Working Space
        </h1>
      </div>

      {/* Rules Section */}
      <Card className="p-6 bg-stone-800 text-stone-200">
         <h2 className="font-bold text-lg text-white mb-4">Regeln & Infos</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {(isEditing ? editRules : coworkingRules).map((rule, idx) => {
                const Icon = ICON_MAP[rule.icon] || Wifi;
                return (
                    <div key={rule.id || idx} className={`flex items-start gap-3 ${isEditing ? 'bg-stone-700 p-3 rounded border border-stone-600' : ''}`}>
                        {isEditing ? (
                             <div className="flex flex-col gap-2 w-full">
                                 <div className="flex gap-2">
                                     <select 
                                        className="bg-white border border-stone-300 rounded p-1 text-stone-900"
                                        value={rule.icon}
                                        onChange={e => updateRule(idx, 'icon', e.target.value)}
                                     >
                                         {Object.keys(ICON_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                                     </select>
                                     <input 
                                        className="bg-white border border-stone-300 rounded p-1 text-stone-900 font-bold flex-1" 
                                        value={rule.title} 
                                        onChange={e => updateRule(idx, 'title', e.target.value)} 
                                     />
                                 </div>
                                 <textarea 
                                    className="bg-white border border-stone-300 rounded p-1 text-stone-900 w-full text-xs"
                                    rows={2}
                                    value={rule.text}
                                    onChange={e => updateRule(idx, 'text', e.target.value)} 
                                 />
                             </div>
                        ) : (
                            <>
                                <Icon className="text-primary-400 shrink-0" size={20} />
                                <div>
                                    <span className="font-bold block text-white">{rule.title}</span>
                                    <p className="opacity-80">{rule.text}</p>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
         </div>
      </Card>

      {/* Booking Controls */}
      <Card className="p-6">
         <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-primary-900">Arbeitsplatz buchen</h2>
            {isEditing && (
                <Button size="sm" onClick={handleAddDesk} className="flex items-center gap-2">
                    <Plus size={16}/> Tisch hinzufügen
                </Button>
            )}
         </div>
         
         {!isEditing && (
             <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                <label className="block text-sm font-medium text-stone-700 mb-1">Datum</label>
                <input 
                    type="date" 
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-900"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                />
                </div>
                <div className="flex-1">
                <label className="block text-sm font-medium text-stone-700 mb-1">Zeitraum</label>
                <div className="flex bg-stone-100 rounded-lg p-1">
                    <button 
                        onClick={() => setSelectedSlot('AM')} 
                        className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${selectedSlot === 'AM' ? 'bg-white shadow text-primary-800' : 'text-stone-500'}`}
                    >
                        Vormittag (10-12)
                    </button>
                    <button 
                        onClick={() => setSelectedSlot('PM')} 
                        className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${selectedSlot === 'PM' ? 'bg-white shadow text-primary-800' : 'text-stone-500'}`}
                    >
                        Nachmittag (12-14)
                    </button>
                    <button 
                        onClick={() => setSelectedSlot('FULL')} 
                        className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${selectedSlot === 'FULL' ? 'bg-white shadow text-primary-800' : 'text-stone-500'}`}
                    >
                        Ganztags
                    </button>
                </div>
                </div>
            </div>
         )}

         {/* Conflict Warning */}
         {!isEditing && (
             isBlocked ? (
                 <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4 flex items-start gap-3">
                     <CalendarX className="text-red-600 shrink-0" />
                     <div>
                         <h3 className="font-bold text-red-800">Keine Buchung möglich</h3>
                         <p className="text-red-700 text-sm mt-1">
                             An diesem Tag findet ein Event im Hauptsaal statt: 
                             <span className="font-bold"> "{conflictingEvents[0].title}"</span>.
                             Der Co-Working Bereich ist daher geschlossen.
                         </p>
                     </div>
                 </div>
             ) : (
                 <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-4 flex items-start gap-3">
                     <CheckCircle className="text-green-600 shrink-0" />
                     <div>
                         <h3 className="font-bold text-green-800">Verfügbar</h3>
                         <p className="text-green-700 text-sm mt-1">
                             Der Bereich ist frei. Wähle unten einen Platz.
                         </p>
                     </div>
                 </div>
             )
         )}

         {/* Desk Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {coworkingDesks.map(desk => {
                 const status = getDeskStatus(desk.id);
                 const isUnavailable = isBlocked || status === 'booked';
                 
                 if (isEditing) {
                     return (
                         <div key={desk.id} className="border border-dashed border-primary-300 bg-primary-50 rounded-xl p-4 relative">
                             <button onClick={() => handleDeleteDesk(desk.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                             <div className="space-y-2">
                                 <Input 
                                    value={desk.name} 
                                    onChange={e => handleUpdateDesk(desk.id, 'name', e.target.value)} 
                                    placeholder="Name"
                                    className="bg-white text-stone-900 mb-0"
                                 />
                                 <div className="flex gap-2 items-center">
                                     <Users size={14} className="text-stone-500" />
                                     <Input 
                                        type="number"
                                        value={desk.capacity} 
                                        onChange={e => handleUpdateDesk(desk.id, 'capacity', parseInt(e.target.value))} 
                                        className="bg-white text-stone-900 mb-0 w-20"
                                     />
                                 </div>
                                 <Input 
                                    value={desk.features.join(', ')} 
                                    onChange={e => handleUpdateDesk(desk.id, 'features', e.target.value.split(',').map(s => s.trim()))} 
                                    placeholder="Features (kommagetrennt)"
                                    className="bg-white text-stone-900 mb-0 text-xs"
                                 />
                             </div>
                         </div>
                     );
                 }

                 return (
                     <div key={desk.id} className={`border rounded-xl p-4 transition-all ${isUnavailable ? 'bg-stone-50 border-stone-200 opacity-60' : 'bg-white border-stone-200 hover:border-primary-500 hover:shadow-md'}`}>
                         <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-stone-800">{desk.name}</h3>
                             {isUnavailable ? (
                                 <Badge color="bg-stone-200 text-stone-500">Belegt</Badge>
                             ) : (
                                 <Badge color="bg-green-100 text-green-800">Frei</Badge>
                             )}
                         </div>
                         <div className="flex flex-wrap gap-1 mb-4">
                             {desk.features.map(f => (
                                 <span key={f} className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">{f}</span>
                             ))}
                             <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded flex items-center gap-1"><Users size={10}/> {desk.capacity}</span>
                         </div>
                         
                         <Button 
                           size="sm" 
                           className="w-full" 
                           disabled={isUnavailable}
                           onClick={() => handleBook(desk.id)}
                           variant={isUnavailable ? 'secondary' : 'primary'}
                         >
                             {isUnavailable ? (isBlocked ? 'Geschlossen' : 'Besetzt') : 'Buchen'}
                         </Button>
                     </div>
                 );
             })}
         </div>
      </Card>
    </div>
  );
};

export default Coworking;
