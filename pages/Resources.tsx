
import React from 'react';
import { useApp } from '../services/store';
import { Card } from '../components/Shared';
import { FileText, Video, Link as LinkIcon, Download, Library, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Resources: React.FC = () => {
  const { resources, events, currentUser } = useApp();

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Library size={48} className="text-stone-300 mb-4" />
        <h2 className="text-xl font-bold text-stone-700">Bitte anmelden</h2>
        <p className="text-stone-500">Melde dich an, um auf Kursmaterialien zuzugreifen.</p>
      </div>
    );
  }

  // Find events the user has joined
  const myEvents = events.filter(e => e.participants.includes(currentUser.id));
  const myEventIds = myEvents.map(e => e.id);

  // Find resources for these events
  const myResources = resources.filter(r => myEventIds.includes(r.eventId));

  // Group by Event
  const groupedResources = myResources.reduce((acc, resource) => {
    if (!acc[resource.eventId]) {
      acc[resource.eventId] = [];
    }
    acc[resource.eventId].push(resource);
    return acc;
  }, {} as Record<string, typeof resources>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
           <Library className="text-primary-800" /> Meine Ressourcen
         </h1>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md text-sm text-blue-800">
        Hier findest du alle Materialien, die für deine gebuchten Kurse und Events bereitgestellt wurden.
      </div>

      {Object.keys(groupedResources).length === 0 ? (
         <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-300">
            <Library size={48} className="mx-auto mb-4 text-stone-300" />
            <h3 className="font-bold text-stone-600 mb-1">Keine Materialien gefunden</h3>
            <p className="text-stone-500 mb-4">Sobald du dich für Events anmeldest und die Organisatoren Material hochladen, erscheint es hier.</p>
            <Link to="/events" className="text-primary-600 font-bold hover:underline">Zu den Events →</Link>
         </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedResources).map(eventId => {
            const event = events.find(e => e.id === eventId);
            if (!event) return null;

            return (
              <div key={eventId} className="animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-lg text-stone-800">{event.title}</h2>
                    <Link to="/events" className="text-xs text-primary-600 flex items-center hover:underline">
                       Zum Event <ArrowRight size={12} className="ml-1"/>
                    </Link>
                 </div>
                 <div className="grid gap-3 md:grid-cols-2">
                    {groupedResources[eventId].map(r => (
                       <Card key={r.id} className="p-4 flex items-start gap-4 hover:shadow-md transition-shadow border border-stone-200">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                             r.type === 'pdf' ? 'bg-red-100 text-red-600' : 
                             r.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                             {r.type === 'pdf' && <FileText size={24} />}
                             {r.type === 'video' && <Video size={24} />}
                             {r.type === 'link' && <LinkIcon size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <h3 className="font-bold text-stone-900 truncate">{r.title}</h3>
                             <p className="text-xs text-stone-500 line-clamp-2 mb-2">{r.description || 'Keine Beschreibung verfügbar.'}</p>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">{r.type}</span>
                                <a 
                                  href={r.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-sm font-bold text-primary-700 hover:underline flex items-center gap-1"
                                >
                                  Öffnen <Download size={14} />
                                </a>
                             </div>
                          </div>
                       </Card>
                    ))}
                 </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Resources;