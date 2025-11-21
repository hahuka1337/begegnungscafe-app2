
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../services/store';
import { Card, Button, Badge } from '../components/Shared';
import { User, UserPlus, CheckCircle, UserMinus, Briefcase, Heart, Info, Shield, Lock, ArrowLeft } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { users, currentUser, sendFriendRequest, removeFriend } = useApp();
  const navigate = useNavigate();

  // If no ID, or ID matches current user, redirect to own profile
  React.useEffect(() => {
      if (!userId || (currentUser && userId === currentUser.id)) {
          navigate('/profile');
      }
  }, [userId, currentUser, navigate]);

  const viewedUser = users.find(u => u.id === userId);

  if (!viewedUser) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <h2 className="text-xl font-bold text-stone-700 mb-2">Nutzer nicht gefunden</h2>
              <Link to="/"><Button variant="secondary">Zur Startseite</Button></Link>
          </div>
      );
  }

  const isFriend = currentUser?.friends.includes(viewedUser.id);
  const hasRequested = viewedUser.friendRequests.includes(currentUser?.id || '');
  const isMeRequested = currentUser?.friendRequests.includes(viewedUser.id); // They asked me

  // Helper to check privacy
  const canSee = (setting: 'profile' | 'details' | 'groups' | 'friends') => {
      // Default to public if settings missing (legacy data safety)
      const level = viewedUser.privacySettings?.[setting] || 'public';
      
      if (level === 'public') return true;
      if (level === 'private') return false; // Only owner, handled by redirect above
      if (level === 'friends') return isFriend;
      return false;
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 mb-2 flex items-center gap-1">
            <ArrowLeft size={18} /> Zurück
        </Button>

        <Card className="p-6 text-center relative overflow-hidden">
            <div className="h-24 w-full bg-primary-100 absolute top-0 left-0 opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center mt-8">
                <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md mb-3">
                    <div className="h-full w-full rounded-full bg-primary-800 text-white flex items-center justify-center text-3xl font-bold overflow-hidden">
                        {viewedUser.avatarUrl ? (
                            <img src={viewedUser.avatarUrl} alt={viewedUser.name} className="w-full h-full object-cover" />
                        ) : (
                            viewedUser.name.charAt(0)
                        )}
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-primary-900">{viewedUser.name}</h1>
                {viewedUser.isVerified && (
                    <Badge color="bg-green-100 text-green-800 mt-1 flex items-center gap-1 px-2">
                        <CheckCircle size={12}/> Verifiziert
                    </Badge>
                )}

                <div className="mt-4">
                    {isFriend ? (
                        <Button variant="secondary" onClick={() => removeFriend(viewedUser.id)} className="flex items-center gap-2 text-red-600 hover:text-red-800">
                            <UserMinus size={18} /> Freund entfernen
                        </Button>
                    ) : hasRequested ? (
                        <Button disabled variant="secondary" className="opacity-70">Anfrage gesendet</Button>
                    ) : isMeRequested ? (
                        <Button onClick={() => navigate('/profile')} className="bg-blue-600">Anfrage beantworten</Button>
                    ) : (
                        <Button onClick={() => sendFriendRequest(viewedUser.id)} className="flex items-center gap-2">
                            <UserPlus size={18} /> Als Freund hinzufügen
                        </Button>
                    )}
                </div>
            </div>
        </Card>

        {/* Details Section */}
        {canSee('details') ? (
            <Card className="p-6 space-y-6">
                <div>
                    <h3 className="font-bold text-stone-700 mb-2 flex items-center gap-2"><Info size={18}/> Über mich</h3>
                    <p className="text-stone-600">{viewedUser.bio || "Keine Beschreibung vorhanden."}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-bold text-stone-700 mb-1 flex items-center gap-2"><Briefcase size={16}/> Beruf / Tätigkeit</h4>
                        <p className="text-stone-600">{viewedUser.job || "-"}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-stone-700 mb-1 flex items-center gap-2"><Heart size={16}/> Hobbys & Interessen</h4>
                        <div className="flex flex-wrap gap-2">
                            {viewedUser.hobbies && viewedUser.hobbies.length > 0 ? (
                                viewedUser.hobbies.map((h, i) => (
                                    <span key={i} className="bg-stone-100 text-stone-700 px-2 py-1 rounded text-sm">{h}</span>
                                ))
                            ) : (
                                <span className="text-stone-400">-</span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        ) : (
            <div className="p-8 text-center text-stone-500 bg-stone-100 rounded-xl border border-stone-200">
                <Lock size={32} className="mx-auto mb-2 opacity-30" />
                <p>Details sind nur für Freunde sichtbar.</p>
            </div>
        )}

        {/* Groups Section */}
        {canSee('groups') && (
             <Card className="p-6">
                 <h3 className="font-bold text-stone-700 mb-3">Mitglied in Gruppen</h3>
                 {/* In a real app, fetch group names. Using ID length for now as mock placeholder or filter from existing state */}
                 <p className="text-sm text-stone-500 italic">Feature folgt: Anzeige der gemeinsamen Gruppen.</p>
             </Card>
        )}
    </div>
  );
};

export default UserProfile;
