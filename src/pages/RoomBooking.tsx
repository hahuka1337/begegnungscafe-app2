import React, { useState } from 'react';
import { useApp } from '../services/store';
import { Room, RoomBooking } from '../types';
import { Card, Button, Badge, Input } from '../components/Shared';
import { Building2, CalendarClock, CheckCircle, XCircle, Clock, Users, Pencil, Trash2, MessageSquare, Plus, Lock, Unlock, Info } from 'lucide-react';

const RoomBookingPage: React.FC = () => {
  const { rooms, roomBookings, currentUser, requestRoom, deleteRoomRequest, updateRoomRequest, addRoom, updateRoom, deleteRoom } = useApp();
  const [activeTab, setActiveTab] = useState<'rooms' | 'my_requests'>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editingBooking, setEditingBooking] = useState<RoomBooking | null>(null);
  
  // Admin Room Editing State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room>>({ name: '', capacity: 10, description: '', isAvailable: true });

  // Booking Form State
  const [bookingTitle, setBookingTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  if (!currentUser || (currentUser.role !== 'organizer' && currentUser.role !== 'admin')) {
    return <div className="p-8 text-center text-stone-500">Zugriff verweigert. Diese Funktion ist nur für Organisatoren.</div>;
  }
  
  const isAdmin = currentUser.role === 'admin';

  // Filter rooms logic
  const visibleRooms = rooms.filter(room => {
      if (isAdmin) return true;
      if (!currentUser.allowedRoomIds) return true;
      return currentUser.allowedRoomIds.includes(room.id);
  });

  const myBookings = roomBookings.filter(b => b.requestedBy === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // --- BOOKING LOGIC ---
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    const startIso = new Date(`${date}T${startTime}`).toISOString();
    const endIso = new Date(`${date}T${endTime}`).toISOString();

    if (editingBooking) {
      updateRoomRequest(editingBooking.id, {
        title: bookingTitle,
        startTime: startIso,
        endTime: endIso
      });
      closeBookingModal();
      setActiveTab('my_requests');
    } else {
      const success = await requestRoom({
        roomId: selectedRoom.id,
        requestedBy: currentUser.id,
        title: bookingTitle,
        startTime: startIso,
        endTime: endIso
      });
      
      if (success) {
        closeBookingModal();
        setActiveTab('my_requests');
      }
    }
  };

  const closeBookingModal = () => {
    setSelectedRoom(null);
    setEditingBooking(null);
    setBookingTitle('');
    setDate('');
    setStartTime('');
    setEndTime('');
  };

  const openEditBookingModal = (booking: RoomBooking) => {
    const room = rooms.find(r => r.id === booking.roomId);
    if (!room) return;

    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);

    const dateStr = startDate.toISOString().split('T')[0];
    const startTimeStr = startDate.toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'});
    const endTimeStr = endDate.toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'});

    setSelectedRoom(room);
    setEditingBooking(booking);
    setBookingTitle(booking.title);
    setDate(dateStr);
    setStartTime(startTimeStr);
    setEndTime(endTimeStr);
  };

  const handleDeleteBooking = (id: string) => {
    if (window.confirm('Möchtest du diese Anfrage wirklich zurückziehen?')) {
      deleteRoomRequest(id);
    }
  };

  // --- ROOM MANAGEMENT LOGIC ---
  const handleSaveRoom = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingRoom.id) {
          updateRoom(editingRoom.id, editingRoom);
      } else {
          addRoom({
              name: editingRoom.name || 'Neuer Raum',
              capacity: editingRoom.capacity || 0,
              description: editingRoom.description || '',
              isAvailable: editingRoom.isAvailable ?? true
          });
      }
      closeRoomModal();
  };

  const closeRoomModal = () => {
      setShowRoomModal(false);
      setEditingRoom({ name: '', capacity: 10, description: '', isAvailable: true });
  };
  
  const openEditRoomModal = (room: Room) => {
      setEditingRoom(room);
      setShowRoomModal(true);
  };
  
  const handleDeleteRoom = (id: string) => {
      if(window.confirm("Möchtest du diesen Raum wirklich löschen? Alle Buchungen bleiben bestehen, aber der Raum verschwindet aus der Liste.")) {
          deleteRoom(id);
      }
  };
  
  const toggleRoomAvailability = (room: Room) => {
      updateRoom(room.id, { isAvailable: !room.isAvailable });
  };

  const BookingModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-primary-900 mb-1">{editingBooking ? 'Anfrage bearbeiten' : 'Raum anfragen'}</h2>
        <p className="text-stone-500 text-sm mb-4">{selectedRoom?.name}</p>
        
        <form onSubmit={handleSubmitBooking} className="space-y-4">
          <Input 
            label="Titel / Verwendungszweck" 
            placeholder="z.B. Planungstreffen, Workshop" 
            required 
            value={bookingTitle}
            onChange={e => setBookingTitle(e.target.value)}
          />
          
          <Input 
            label="Datum" 
            type="date" 
            required 
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Startzeit" 
              type="time" 
              required 
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
            <Input 
              label="Endzeit" 
              type="time" 
              required 
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeBookingModal} className="flex-1">Abbrechen</Button>
            <Button type="submit" className="flex-1">{editingBooking ? 'Speichern' : 'Anfrage senden'}</Button>
          </div>
        </form>
      </div>
    </div>
  );

  const RoomModal = () => (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-primary-900 mb-4">{editingRoom.id ? 'Raum bearbeiten' : 'Neuen Raum hinzufügen'}</h2>
            <form onSubmit={handleSaveRoom} className="space-y-4">
                <Input 
                    label="Raumname" 
                    value={editingRoom.name} 
                    onChange={e => setEditingRoom({...editingRoom, name: e.target.value})} 
                    required 
                />
                <Input 
                    label="Kapazität (Personen)" 
                    type="number"
                    value={editingRoom.capacity} 
                    onChange={e => setEditingRoom({...editingRoom, capacity: parseInt(e.target.value)})} 
                    required 
                />
                <div className="mb-4">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Beschreibung / Ausstattung</label>
                    <textarea 
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        rows={3}
                        value={editingRoom.description}
                        onChange={e => setEditingRoom({...editingRoom, description: e.target.value})}
                    />
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <input 
                        type="checkbox" 
                        id="isAvailable" 
                        checked={editingRoom.isAvailable} 
                        onChange={e => setEditingRoom({...editingRoom, isAvailable: e.target.checked})}
                        className="w-5 h-5 text-primary-600"
                    />
                    <label htmlFor="isAvailable" className="text-stone-700">Raum ist buchbar (aktiv)</label>
                </div>
                
                <div className="flex gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={closeRoomModal} className="flex-1">Abbrechen</Button>
                    <Button type="submit" className="flex-1">Speichern</Button>
                </div>
            </form>
        </div>
      </div>
  );

  const getStatusBadge = (status: RoomBooking['status']) => {
    switch(status) {
      case 'approved': return <Badge color="bg-green-100 text-green-800">Genehmigt</Badge>;
      case 'rejected': return <Badge color="bg-red-100 text-red-800">Abgelehnt</Badge>;
      default: return <Badge color="bg-yellow-100 text-yellow-800">Ausstehend</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {selectedRoom && <BookingModal />}
      {showRoomModal && <RoomModal />}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-900">Raumverwaltung</h1>
        {isAdmin && (
            <Button onClick={() => setShowRoomModal(true)} className="flex items-center gap-2">
                <Plus size={18} /> Neuer Raum
            </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-6">
        <button 
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'rooms' ? 'border-primary-800 text-primary-800' : 'border-transparent text-stone-500'}`}
          onClick={() => setActiveTab('rooms')}
        >
          Verfügbare Räume
        </button>
        <button 
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'my_requests' ? 'border-primary-800 text-primary-800' : 'border-transparent text-stone-500'}`}
          onClick={() => setActiveTab('my_requests')}
        >
          Meine Anfragen
        </button>
      </div>

      {activeTab === 'rooms' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleRooms.map(room => (
            <Card key={room.id} className={`p-4 flex flex-col justify-between h-full ${!room.isAvailable ? 'opacity-75 bg-stone-100 border-dashed' : ''}`}>
              <div>
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-primary-900 flex items-center gap-2">
                        {room.name} 
                        {!room.isAvailable && <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">Geschlossen</span>}
                    </h3>
                    {isAdmin && (
                        <div className="flex gap-1">
                             <button onClick={() => toggleRoomAvailability(room)} className={`p-1.5 rounded hover:bg-stone-200 ${!room.isAvailable ? 'text-red-500' : 'text-stone-400'}`} title={room.isAvailable ? "Raum sperren" : "Raum öffnen"}>
                                 {room.isAvailable ? <Unlock size={16}/> : <Lock size={16}/>}
                             </button>
                             <button onClick={() => openEditRoomModal(room)} className="p-1.5 rounded hover:bg-stone-200 text-stone-400" title="Bearbeiten">
                                 <Pencil size={16}/>
                             </button>
                             <button onClick={() => handleDeleteRoom(room.id)} className="p-1.5 rounded hover:bg-red-100 text-stone-400 hover:text-red-600" title="Löschen">
                                 <Trash2 size={16}/>
                             </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center text-stone-500 text-sm mb-3 gap-2">
                  <Users size={16} /> <span>Kapazität: {room.capacity}</span>
                </div>
                <p className="text-stone-600 text-sm mb-4">{room.description}</p>
              </div>
              
              {room.isAvailable ? (
                  <Button variant="secondary" onClick={() => setSelectedRoom(room)}>Raum anfragen</Button>
              ) : (
                  <Button disabled variant="secondary" className="opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
                      <Lock size={16}/> Momentan nicht buchbar
                  </Button>
              )}
            </Card>
          ))}
          {visibleRooms.length === 0 && (
              <div className="col-span-full text-center py-10 text-stone-500">
                  {isAdmin ? 'Keine Räume vorhanden.' : 'Keine Räume für dich freigeschaltet oder verfügbar.'}
              </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {myBookings.length === 0 ? (
            <p className="text-stone-500 text-center py-8">Keine Anfragen vorhanden.</p>
          ) : (
            myBookings.map(booking => {
              const room = rooms.find(r => r.id === booking.roomId);
              return (
                <Card key={booking.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-stone-900">{booking.title}</h3>
                      <p className="text-sm text-stone-600 mt-1 flex items-center gap-1">
                        <Building2 size={14} /> {room?.name || 'Gelöschter Raum'}
                      </p>
                      <p className="text-sm text-stone-600 flex items-center gap-1">
                        <CalendarClock size={14} />
                        {new Date(booking.startTime).toLocaleDateString('de-DE')} • {new Date(booking.startTime).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {booking.adminNote && (
                     <div className={`mt-2 p-3 rounded-lg text-sm flex gap-2 items-start ${booking.status === 'approved' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                       <MessageSquare size={16} className="mt-0.5 shrink-0" />
                       <div>
                         <span className="font-bold">Admin:</span> {booking.adminNote}
                       </div>
                     </div>
                  )}
                  
                  <div className="flex justify-end gap-2 border-t border-stone-100 pt-3 mt-3">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-stone-500 hover:text-primary-800"
                      onClick={() => openEditBookingModal(booking)}
                    >
                      <Pencil size={16} className="mr-1" /> Bearbeiten
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-stone-500 hover:text-red-600"
                      onClick={() => handleDeleteBooking(booking.id)}
                    >
                      <Trash2 size={16} className="mr-1" /> Zurückziehen
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default RoomBookingPage;
