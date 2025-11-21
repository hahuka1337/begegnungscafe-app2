

import React, { useState } from 'react';
import { useApp } from '../services/store';
import { Card, Badge, Button, Input } from '../components/Shared';
import { MapPin, Clock, Phone, Mail, Instagram, Coffee, Croissant, Info, Edit2, Save, X, Plus, Trash2, Utensils, Laptop, Calendar } from 'lucide-react';
import { MenuItem, MenuCategory } from '../types';

const Cafe: React.FC = () => {
  const { cafeConfig, updateCafeConfig, currentUser, events } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  
  // Local editing state
  const [editConfig, setEditConfig] = useState(cafeConfig);

  const canManageCafe = currentUser?.role === 'admin' || (currentUser?.role === 'organizer' && currentUser?.canManageCafe);

  // --- DYNAMIC EVENT LOGIC ---
  const today = new Date();
  const todaysEvents = events.filter(e => {
    const start = new Date(e.dateTimeStart);
    return start.getDate() === today.getDate() && 
           start.getMonth() === today.getMonth() && 
           start.getFullYear() === today.getFullYear();
  }).sort((a, b) => new Date(a.dateTimeStart).getTime() - new Date(b.dateTimeStart).getTime());

  const handleSave = () => {
      updateCafeConfig(editConfig);
      setIsEditing(false);
  };

  const handleCancel = () => {
      setEditConfig(cafeConfig);
      setIsEditing(false);
  };

  // Helper for updating nested state
  const updateContact = (field: keyof typeof editConfig.contact, value: string) => {
      setEditConfig(prev => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
  };

  const updateOpeningHour = (index: number, field: 'label' | 'value', newVal: string) => {
      const newHours = [...editConfig.openingHours];
      newHours[index] = { ...newHours[index], [field]: newVal };
      setEditConfig(prev => ({ ...prev, openingHours: newHours }));
  };

  const addOpeningHour = () => {
      setEditConfig(prev => ({ ...prev, openingHours: [...prev.openingHours, { label: 'Tag', value: 'Zeit' }] }));
  };
  
  const removeOpeningHour = (index: number) => {
      setEditConfig(prev => ({ ...prev, openingHours: prev.openingHours.filter((_, i) => i !== index) }));
  };

  // --- MENU MANAGEMENT ---

  const updateMenuItem = (id: string, field: keyof MenuItem, value: string) => {
      setEditConfig(prev => ({
          ...prev,
          menu: prev.menu.map(m => m.id === id ? { ...m, [field]: value } : m)
      }));
  };

  const addMenuItem = (categoryId: string) => {
      const newItem: MenuItem = {
          id: Date.now().toString(),
          categoryId,
          name: 'Neues Gericht',
          price: '0,00 €',
          description: 'Beschreibung'
      };
      setEditConfig(prev => ({ ...prev, menu: [...prev.menu, newItem] }));
  };

  const removeMenuItem = (id: string) => {
      setEditConfig(prev => ({ ...prev, menu: prev.menu.filter(m => m.id !== id) }));
  };

  // --- CATEGORY MANAGEMENT ---

  const addCategory = () => {
      const newCat: MenuCategory = {
          id: Date.now().toString(),
          title: 'Neue Kategorie'
      };
      setEditConfig(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
  };

  const updateCategory = (id: string, title: string) => {
      setEditConfig(prev => ({
          ...prev,
          categories: prev.categories.map(c => c.id === id ? { ...c, title } : c)
      }));
  };

  const removeCategory = (id: string) => {
      // Optional: Prevent if items exist, or just delete items too. Let's delete items too for simplicity.
      if (window.confirm("Möchtest du diese Kategorie und alle ihre Gerichte löschen?")) {
          setEditConfig(prev => ({
              ...prev,
              categories: prev.categories.filter(c => c.id !== id),
              menu: prev.menu.filter(m => m.categoryId !== id)
          }));
      }
  };

  // --- DISPLAY COMPONENTS ---

  const MenuSectionDisplay: React.FC<{ category: MenuCategory, items: MenuItem[] }> = ({ category, items }) => (
      <div className="mb-8">
         <h3 className="font-bold text-lg text-stone-800 mb-4 border-b border-primary-200 pb-2 flex items-center gap-2">
             {category.title}
         </h3>
         <div className="space-y-4">
             {items.length === 0 && <p className="text-sm text-stone-400 italic">Noch keine Einträge.</p>}
             {items.map(item => (
                 <div key={item.id} className="flex justify-between items-start animate-in fade-in">
                     <div>
                         <h4 className="font-bold text-stone-800">{item.name}</h4>
                         <p className="text-xs text-stone-500">{item.description}</p>
                     </div>
                     <span className="font-bold text-primary-800 bg-primary-50 px-2 py-1 rounded text-sm whitespace-nowrap">{item.price}</span>
                 </div>
             ))}
         </div>
      </div>
  );

  const MenuSectionEdit: React.FC<{ category: MenuCategory, items: MenuItem[] }> = ({ category, items }) => (
      <div className="mb-8 p-4 border border-dashed border-stone-300 rounded-xl bg-stone-50/50">
         <div className="flex items-center gap-2 mb-4 border-b border-primary-200 pb-2">
             <Input 
                value={category.title} 
                onChange={e => updateCategory(category.id, e.target.value)} 
                className="font-bold text-lg mb-0 flex-1 bg-white text-stone-900 border-stone-300" 
                placeholder="Kategorie Name"
             />
             <Button variant="danger" size="sm" onClick={() => removeCategory(category.id)} className="shrink-0"><Trash2 size={16}/></Button>
         </div>

         <div className="space-y-4">
             {items.map(item => (
                 <div key={item.id} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        <Input value={item.name} onChange={e => updateMenuItem(item.id, 'name', e.target.value)} placeholder="Name" className="mb-0 bg-white text-stone-900 border-stone-300" />
                        <Input value={item.price} onChange={e => updateMenuItem(item.id, 'price', e.target.value)} placeholder="Preis" className="mb-0 bg-white text-stone-900 border-stone-300" />
                        <div className="flex gap-2">
                             <Input value={item.description} onChange={e => updateMenuItem(item.id, 'description', e.target.value)} placeholder="Beschreibung" className="mb-0 flex-1 bg-white text-stone-900 border-stone-300" />
                             <Button variant="danger" size="sm" onClick={() => removeMenuItem(item.id)} className="px-2"><Trash2 size={16}/></Button>
                        </div>
                     </div>
                 </div>
             ))}
             <Button variant="secondary" size="sm" onClick={() => addMenuItem(category.id)} className="w-full flex items-center justify-center gap-2">
                 <Plus size={16}/> Gericht hinzufügen
             </Button>
         </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Admin Controls */}
      {canManageCafe && (
          <div className="flex justify-end sticky top-20 z-30">
              {isEditing ? (
                  <div className="flex gap-2 bg-white p-2 rounded-lg shadow-lg border border-stone-200">
                      <Button variant="ghost" onClick={handleCancel} className="flex items-center gap-2"><X size={16}/> Abbrechen</Button>
                      <Button onClick={handleSave} className="flex items-center gap-2 bg-green-600 hover:bg-green-700"><Save size={16}/> Speichern</Button>
                  </div>
              ) : (
                  <Button onClick={() => setIsEditing(true)} variant="secondary" className="flex items-center gap-2 shadow-sm border border-stone-300">
                      <Edit2 size={16} /> Seite bearbeiten
                  </Button>
              )}
          </div>
      )}

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden h-48 md:h-64 bg-primary-900">
        <img 
            src="https://placehold.co/1200x400/115e59/ffffff?text=Begegnungscafé+Nürnberg" 
            alt="Café Interior" 
            className="absolute inset-0 w-full h-full object-cover opacity-40" 
        />
        <div className="absolute inset-0 flex flex-col justify-center p-8">
            <Badge color="bg-white/20 text-white backdrop-blur-md w-fit mb-2">Offen für Alle</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Willkommen im Café</h1>
            <p className="text-primary-100 max-w-lg">Ein Raum für Begegnung, Kultur und köstlichen Kaffee mitten in Nürnberg.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Info */}
          <div className="space-y-6">
              {/* Today's Events Logic - Dynamic */}
              {todaysEvents.length > 0 && (
                  <Card className="p-4 border-l-4 border-orange-400 bg-orange-50">
                      <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-3">
                          <Calendar size={18} /> Heute im Café
                      </h3>
                      <div className="space-y-2">
                          {todaysEvents.map(e => (
                              <div key={e.id} className="bg-white/60 p-2 rounded border border-orange-100">
                                  <div className="flex justify-between items-start">
                                      <span className="text-xs font-bold text-orange-800">{new Date(e.dateTimeStart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} Uhr</span>
                                      <Badge color="bg-white text-stone-500 text-[10px]">{e.location}</Badge>
                                  </div>
                                  <p className="text-sm font-medium text-stone-800 mt-1 leading-tight">{e.title}</p>
                                  <p className="text-xs text-stone-500 mt-1 truncate">{e.description}</p>
                              </div>
                          ))}
                      </div>
                      <p className="text-[10px] text-orange-800 mt-2 italic">Bitte beachte mögliche Einschränkungen im Sitzbereich.</p>
                  </Card>
              )}

              <Card className="p-6 border-t-4 border-primary-600">
                  <h2 className="font-bold text-xl text-primary-900 mb-4 flex items-center gap-2"><Clock /> Öffnungszeiten</h2>
                  
                  {isEditing ? (
                      <div className="space-y-2">
                          {editConfig.openingHours.map((oh, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                  <input className="w-1/3 p-1 border border-stone-300 rounded text-sm bg-white text-stone-900" value={oh.label} onChange={e => updateOpeningHour(idx, 'label', e.target.value)} />
                                  <input className="flex-1 p-1 border border-stone-300 rounded text-sm bg-white text-stone-900" value={oh.value} onChange={e => updateOpeningHour(idx, 'value', e.target.value)} />
                                  <button onClick={() => removeOpeningHour(idx)} className="text-red-500 hover:text-red-700"><X size={16}/></button>
                              </div>
                          ))}
                          <Button size="sm" variant="secondary" onClick={addOpeningHour} className="w-full mt-2 text-xs">+ Zeit hinzufügen</Button>
                          <div className="mt-4 border-t pt-2">
                              <label className="text-xs text-stone-500">Hinweis (z.B. Heute offen)</label>
                              <input className="w-full p-1 border border-stone-300 rounded text-sm bg-white text-stone-900" value={editConfig.specialNote} onChange={e => setEditConfig({...editConfig, specialNote: e.target.value})} />
                          </div>
                      </div>
                  ) : (
                    <>
                      <div className="space-y-2 text-sm">
                          {cafeConfig.openingHours.map((oh, idx) => (
                              <div key={idx} className="flex justify-between border-b border-stone-100 pb-2">
                                  <span className="text-stone-500">{oh.label}</span>
                                  <span className="font-medium">{oh.value}</span>
                              </div>
                          ))}
                      </div>
                      {cafeConfig.specialNote && (
                        <div className="mt-4 bg-green-50 text-green-800 text-xs p-2 rounded flex items-center gap-2">
                            <Info size={16} />
                            <span>{cafeConfig.specialNote}</span>
                        </div>
                      )}
                    </>
                  )}
              </Card>

              {/* Co-Working Box */}
              <Card className="p-6 bg-stone-800 text-stone-200">
                  <h2 className="font-bold text-lg text-white mb-3 flex items-center gap-2"><Laptop size={20}/> Co-Working</h2>
                  {isEditing ? (
                      <div>
                          <textarea 
                            className="w-full p-2 border border-stone-300 rounded bg-white text-stone-900 text-sm" 
                            rows={3} 
                            value={editConfig.coworkingNote || ''} 
                            onChange={e => setEditConfig({...editConfig, coworkingNote: e.target.value})} 
                            placeholder="Infos zu WLAN, Ruhezeiten etc."
                          />
                      </div>
                  ) : (
                      <p className="text-sm leading-relaxed opacity-90">
                          {cafeConfig.coworkingNote || "Unser Café steht auch als Arbeitsplatz zur Verfügung. Frag an der Theke nach dem WLAN-Passwort."}
                      </p>
                  )}
              </Card>

              <Card className="p-6">
                  <h2 className="font-bold text-xl text-primary-900 mb-4 flex items-center gap-2"><MapPin /> Kontakt</h2>
                  {isEditing ? (
                      <div className="space-y-3 text-sm">
                          <div>
                              <label className="block text-xs font-bold mb-1">Adresse</label>
                              <textarea className="w-full p-2 border border-stone-300 rounded bg-white text-stone-900" rows={2} value={editConfig.contact.address} onChange={e => updateContact('address', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold mb-1">Telefon</label>
                              <input className="w-full p-2 border border-stone-300 rounded bg-white text-stone-900" value={editConfig.contact.phone} onChange={e => updateContact('phone', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold mb-1">Email</label>
                              <input className="w-full p-2 border border-stone-300 rounded bg-white text-stone-900" value={editConfig.contact.email} onChange={e => updateContact('email', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold mb-1">Instagram</label>
                              <input className="w-full p-2 border border-stone-300 rounded bg-white text-stone-900" value={editConfig.contact.instagram} onChange={e => updateContact('instagram', e.target.value)} />
                          </div>
                      </div>
                  ) : (
                    <div className="space-y-4 text-sm text-stone-600">
                        <div>
                            <p className="font-bold text-stone-900">Adresse</p>
                            <p className="whitespace-pre-line">{cafeConfig.contact.address}</p>
                        </div>
                        <div>
                            <p className="font-bold text-stone-900">Kontakt</p>
                            <p className="flex items-center gap-2 mt-1"><Phone size={14}/> {cafeConfig.contact.phone}</p>
                            <p className="flex items-center gap-2 mt-1"><Mail size={14}/> {cafeConfig.contact.email}</p>
                        </div>
                        <div className="pt-2">
                            <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                                <Instagram size={16} /> {cafeConfig.contact.instagram}
                            </Button>
                        </div>
                    </div>
                  )}
              </Card>
          </div>

          {/* Right Column: Menu */}
          <div className="md:col-span-2">
              <Card className="p-6 h-full">
                  <h2 className="font-bold text-2xl text-primary-900 mb-6 flex items-center gap-2">
                      <Coffee className="text-primary-600" /> Speisekarte
                  </h2>

                  {isEditing ? (
                      <>
                         <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8">
                            {editConfig.categories.map(category => (
                                <MenuSectionEdit 
                                    key={category.id}
                                    category={category}
                                    items={editConfig.menu.filter(m => m.categoryId === category.id)}
                                />
                            ))}
                         </div>
                         <Button onClick={addCategory} className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-primary-300 bg-primary-50 text-primary-800 hover:bg-primary-100">
                             <Plus size={18} /> Neue Menü-Kategorie hinzufügen
                         </Button>
                      </>
                  ) : (
                      <div className="grid md:grid-cols-2 gap-8">
                          {cafeConfig.categories.map(category => (
                              <MenuSectionDisplay 
                                  key={category.id}
                                  category={category}
                                  items={cafeConfig.menu.filter(m => m.categoryId === category.id)}
                              />
                          ))}
                      </div>
                  )}

                  {isEditing ? (
                      <div className="mt-8 p-4 bg-stone-100 rounded-xl border border-stone-200">
                          <label className="block text-xs font-bold mb-2">Fußzeile (z.B. Halal Hinweis)</label>
                          <textarea className="w-full p-2 border border-stone-300 rounded bg-white text-stone-900" rows={2} value={editConfig.footerNote} onChange={e => setEditConfig({...editConfig, footerNote: e.target.value})} />
                      </div>
                  ) : (
                      <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100 text-center">
                          <p className="text-primary-800 font-medium">{cafeConfig.footerNote}</p>
                      </div>
                  )}
              </Card>
          </div>
      </div>
    </div>
  );
};

export default Cafe;