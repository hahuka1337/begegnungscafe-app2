import React, { useState } from 'react';
import { useApp } from '../services/store';
import { Card, Button, Input, Badge } from '../components/Shared';
import { QrCode, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CheckIn: React.FC = () => {
  const { currentUser, events, users, checkInUser, checkIns } = useApp();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<{success: boolean, msg: string} | null>(null);

  if (!currentUser || (currentUser.role !== 'organizer' && currentUser.role !== 'admin')) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={48} className="mx-auto text-orange-500 mb-4"/>
        <h2 className="font-bold text-stone-700">Zugriff verweigert</h2>
        <p className="text-stone-500 mb-4">Nur Organisatoren können den Check-in durchführen.</p>
        <Link to="/"><Button>Zurück zum Start</Button></Link>
      </div>
    );
  }

  // Only show today's or future events
  const activeEvents = events
    .filter(e => new Date(e.dateTimeEnd) > new Date(Date.now() - 86400000)) // Last 24h included
    .sort((a,b) => new Date(a.dateTimeStart).getTime() - new Date(b.dateTimeStart).getTime());

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleManualCheckIn = (userId: string) => {
    if (!selectedEventId) return;
    
    // Validate user belongs to event
    const event = events.find(e => e.id === selectedEventId);
    if (!event?.participants.includes(userId)) {
       setLastScanResult({ success: false, msg: 'Nutzer ist nicht für dieses Event angemeldet.' });
       return;
    }

    checkInUser(selectedEventId, userId);
    const user = users.find(u => u.id === userId);
    setLastScanResult({ success: true, msg: `${user?.name || 'Nutzer'} erfolgreich eingecheckt.` });
    setManualInput('');
  };

  const handleQrScanSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    // Format expected: userID-eventID (as generated in Events.tsx)
    const parts = manualInput.split('-');
    if (parts.length < 2) {
      setLastScanResult({ success: false, msg: 'Ungültiger Code-Format.' });
      return;
    }
    
    const [userId, eventId] = parts;
    
    if (eventId !== selectedEventId) {
      setLastScanResult({ success: false, msg: 'Ticket ist für ein anderes Event!' });
      return;
    }

    handleManualCheckIn(userId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
        <QrCode /> Event Check-in
      </h1>

      {/* Event Selection */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-stone-700 mb-2">Event auswählen</label>
        <select 
          className="w-full p-2 border border-stone-300 rounded-lg bg-white"
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setLastScanResult(null);
          }}
        >
          <option value="">-- Bitte wählen --</option>
          {activeEvents.map(e => (
            <option key={e.id} value={e.id}>
              {new Date(e.dateTimeStart).toLocaleDateString()} - {e.title}
            </option>
          ))}
        </select>
      </Card>

      {selectedEvent && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
           {/* Stats */}
           <div className="grid grid-cols-2 gap-4">
             <Card className="p-4 text-center bg-stone-800 text-white">
               <span className="block text-2xl font-bold">{selectedEvent.participants.length}</span>
               <span className="text-xs opacity-70">Angemeldet</span>
             </Card>
             <Card className="p-4 text-center bg-primary-600 text-white">
               <span className="block text-2xl font-bold">
                 {checkIns.filter(c => c.eventId === selectedEventId).length}
               </span>
               <span className="text-xs opacity-70">Eingecheckt</span>
             </Card>
           </div>

           {/* Scanner / Input */}
           <Card className="p-4 border-2 border-primary-100">
             <h3 className="font-bold text-primary-900 mb-2">Ticket Scannen (Simulation)</h3>
             <form onSubmit={handleQrScanSimulation} className="flex gap-2">
               <Input 
                 placeholder="Ticket-ID scannen oder tippen..." 
                 value={manualInput}
                 onChange={e => setManualInput(e.target.value)}
                 className="flex-1"
               />
               <Button type="submit">Check-In</Button>
             </form>
             
             {lastScanResult && (
                <div className={`mt-4 p-3 rounded-lg text-sm font-bold text-center ${lastScanResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                   {lastScanResult.msg}
                </div>
             )}
           </Card>

           {/* Participant List for Manual Checkin */}
           <Card className="overflow-hidden">
             <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
               <h3 className="font-bold text-stone-700">Teilnehmerliste</h3>
               <div className="text-xs text-stone-500">Manuelle Suche</div>
             </div>
             <div className="max-h-[400px] overflow-y-auto divide-y divide-stone-100">
               {selectedEvent.participants.map(userId => {
                  const user = users.find(u => u.id === userId);
                  const isCheckedIn = checkIns.some(c => c.eventId === selectedEventId && c.userId === userId);

                  return (
                    <div key={userId} className="p-4 flex justify-between items-center hover:bg-stone-50">
                       <div className="flex items-center gap-3">
                         <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${isCheckedIn ? 'bg-primary-100 text-primary-800' : 'bg-stone-200 text-stone-500'}`}>
                           {user?.name.charAt(0)}
                         </div>
                         <div>
                           <div className="font-bold text-sm text-stone-900">{user?.name || 'Unbekannt'}</div>
                           <div className="text-xs text-stone-400">{user?.email}</div>
                         </div>
                       </div>
                       {isCheckedIn ? (
                         <Badge color="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle size={12}/> Anwesend</Badge>
                       ) : (
                         <Button size="sm" variant="secondary" onClick={() => handleManualCheckIn(userId)}>Check-In</Button>
                       )}
                    </div>
                  );
               })}
             </div>
           </Card>
        </div>
      )}
    </div>
  );
};

export default CheckIn;
