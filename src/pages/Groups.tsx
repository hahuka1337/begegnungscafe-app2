import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../services/store';
import { Group, Message, User } from '../types';
import { Card, Button, Input, Badge } from '../components/Shared';
import { PollCard } from '../components/PollCard';
import { Lock, Unlock, Send, Users, HeartHandshake, MessageSquare, BarChart2, PlusCircle, AlertTriangle, Search, ShieldAlert, Plus, X, CheckCircle, UserPlus, MicOff, Ban } from 'lucide-react';

// --- CHAT COMPONENT ---
// Extracted to prevent conditional hook execution errors
interface ChatViewProps {
  group: Group;
  messages: Message[];
  users: User[]; // Added users to check status
  currentUser: User | null;
  joinGroup: (id: string) => void;
  postMessage: (groupId: string, text: string) => void;
  openReportModal: (msgId: string) => void;
  adminToggleChatRestriction: (userId: string) => void;
  adminToggleBan: (userId: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ 
  group, messages, users, currentUser, joinGroup, postMessage, openReportModal, 
  adminToggleChatRestriction, adminToggleBan 
}) => {
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && currentUser?.isVerified && !currentUser?.isChatRestricted) {
      postMessage(group.id, messageText);
      setMessageText('');
    }
  };

  const isMember = currentUser && group.members.includes(currentUser.id);
  const hasRequested = currentUser && group.joinRequests.includes(currentUser.id);

  return (
       <div className="flex flex-col h-[calc(100vh-200px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && <p className="text-center text-stone-400 mt-10">Noch keine Nachrichten.</p>}
            {messages.map(msg => {
              const isMe = msg.authorID === currentUser?.id;
              const isAdmin = currentUser?.role === 'admin';
              
              // Check author status
              const author = users.find(u => u.id === msg.authorID);
              const isContentHidden = author && (author.accountStatus === 'banned' || author.isChatRestricted);
              
              return (
                <div key={msg.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm relative ${isMe ? 'bg-primary-700 text-white rounded-tr-none' : 'bg-stone-200 text-stone-900 rounded-tl-none'}`}>
                    {!isMe && <span className="block text-xs font-bold opacity-70 mb-1">{msg.authorName}</span>}
                    
                    {isContentHidden ? (
                        <span className="italic opacity-60">Nutzer gelöscht</span>
                    ) : (
                        msg.text
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] text-stone-400">{new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                     {!isMe && (
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                           <button 
                             onClick={() => openReportModal(msg.id)} 
                             className="text-stone-300 hover:text-orange-500"
                             title="Melden"
                           >
                             <AlertTriangle size={14} />
                           </button>
                           {isAdmin && (
                               <>
                                   <button
                                       onClick={() => adminToggleChatRestriction(msg.authorID)}
                                       className={`hover:text-red-500 ${author?.isChatRestricted ? 'text-red-500' : 'text-stone-300'}`}
                                       title="Chat Sperre (Mute)"
                                   >
                                       <MicOff size={14} />
                                   </button>
                                   <button
                                       onClick={() => adminToggleBan(msg.authorID)}
                                       className={`hover:text-black ${author?.accountStatus === 'banned' ? 'text-black' : 'text-stone-300'}`}
                                       title="Account Sperren (Ban)"
                                   >
                                       <Ban size={14} />
                                   </button>
                               </>
                           )}
                       </div>
                     )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          {isMember ? (
            <>
               {!currentUser?.isVerified ? (
                   <div className="p-4 bg-yellow-50 border-t border-yellow-100 text-yellow-800 text-sm flex items-center justify-center gap-2">
                       <ShieldAlert size={18} />
                       <span>Nur verifizierte Nutzer können Nachrichten schreiben. Bitte kontaktiere einen Admin im Café.</span>
                   </div>
               ) : currentUser?.isChatRestricted ? (
                   <div className="p-4 bg-red-50 border-t border-red-100 text-red-800 text-sm flex items-center justify-center gap-2">
                       <Lock size={18} />
                       <span>Du bist für den Chat gesperrt.</span>
                   </div>
               ) : (
                  <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200 flex gap-2">
                      <input 
                      className="flex-1 bg-stone-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="Nachricht schreiben..."
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      disabled={currentUser?.isChatRestricted}
                      />
                      <button type="submit" className="bg-primary-800 text-white p-2 rounded-full hover:bg-primary-900 disabled:opacity-50" disabled={!messageText.trim() || currentUser?.isChatRestricted}>
                      <Send size={20} />
                      </button>
                  </form>
               )}
            </>
          ) : (
            <div className="p-6 text-center bg-stone-100 h-full flex flex-col items-center justify-center">
                <Lock size={48} className="text-stone-300 mb-4" />
                <h3 className="font-bold text-stone-700 mb-2">Geschlossener Bereich</h3>
                <p className="text-stone-500 mb-6 max-w-xs mx-auto">
                    {group.type === 'private' 
                      ? 'Dies ist eine private Gruppe. Du musst eine Beitrittsanfrage senden.' 
                      : 'Tritt der Gruppe bei, um mitzudiskutieren.'}
                </p>
                
                {hasRequested ? (
                    <Button disabled variant="secondary" className="opacity-75">
                        Anfrage gesendet
                    </Button>
                ) : (
                  <Button onClick={() => joinGroup(group.id)}>
                      {group.type === 'private' ? 'Beitritt anfragen' : 'Gruppe beitreten'}
                  </Button>
                )}
            </div>
          )}
       </div>
  );
};

const Groups: React.FC = () => {
  const { groups, currentUser, joinGroup, messages, postMessage, users, requestMentoring, mentoringMatches, polls, createPoll, reportContent, createGroup, respondToGroupRequest, adminToggleChatRestriction, adminToggleBan } = useApp();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'polls' | 'mentoring' | 'admin'>('chat');
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Poll Creation State
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  // Group Creation State
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', type: 'public' as 'public' | 'private' });

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState('');
  const [reportReason, setReportReason] = useState('');

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupMessages = selectedGroup 
    ? messages.filter(m => m.groupID === selectedGroup.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];
  
  const groupPolls = selectedGroup
    ? polls.filter(p => p.scope === 'group' && p.targetGroupId === selectedGroup.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim() || newPollOptions.some(o => !o.trim()) || !currentUser || !selectedGroup) return;

    createPoll({
      question: newPollQuestion,
      options: newPollOptions,
      scope: 'group',
      targetGroupId: selectedGroup.id,
      createdBy: currentUser.id
    });
    setShowPollCreator(false);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
      e.preventDefault();
      createGroup({
          name: newGroup.name,
          description: newGroup.description,
          type: newGroup.type,
          isConvertGroup: false
      });
      setShowCreateGroup(false);
      setNewGroup({ name: '', description: '', type: 'public' });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOpts = [...newPollOptions];
    newOpts[index] = value;
    setNewPollOptions(newOpts);
  };

  const openReportModal = (messageId: string) => {
     setReportTargetId(messageId);
     setReportReason('');
     setShowReportModal(true);
  };

  const submitReport = (e: React.FormEvent) => {
      e.preventDefault();
      if(reportReason.trim()) {
          reportContent(reportTargetId, 'message', reportReason);
          setShowReportModal(false);
      }
  };

  // --- VIEWS ---

  const renderPollsView = () => {
    if (!selectedGroup) return null;
    const isModerator = currentUser && (selectedGroup.moderators.includes(currentUser.id) || currentUser.role === 'admin' || currentUser.role === 'organizer');
    
    return (
      <div className="p-4 space-y-4 h-[calc(100vh-200px)] overflow-y-auto">
         {isModerator && (
            <div className="mb-6">
               {showPollCreator ? (
                  <Card className="p-4 bg-primary-50 border-primary-100">
                    <h3 className="font-bold text-primary-900 mb-2">Umfrage erstellen</h3>
                    <form onSubmit={handleCreatePoll}>
                      <Input placeholder="Frage..." value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)} required className="mb-2 bg-white" />
                      {newPollOptions.map((opt, idx) => (
                        <Input key={idx} placeholder={`Option ${idx + 1}`} value={opt} onChange={e => handleOptionChange(idx, e.target.value)} required className="mb-2 bg-white" />
                      ))}
                      <div className="flex gap-2 mt-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setNewPollOptions([...newPollOptions, ''])}>+ Option</Button>
                        <div className="ml-auto flex gap-2">
                           <Button type="button" size="sm" variant="ghost" onClick={() => setShowPollCreator(false)}>Abbrechen</Button>
                           <Button type="submit" size="sm">Erstellen</Button>
                        </div>
                      </div>
                    </form>
                  </Card>
               ) : (
                  <Button className="w-full flex items-center justify-center gap-2" onClick={() => setShowPollCreator(true)}>
                     <PlusCircle size={18} /> Neue Umfrage
                  </Button>
               )}
            </div>
         )}

         {groupPolls.length > 0 ? (
            groupPolls.map(poll => (
               <PollCard key={poll.id} poll={poll} />
            ))
         ) : (
            <div className="text-center text-stone-500 py-10">
               <BarChart2 size={40} className="mx-auto mb-2 opacity-20" />
               <p>Keine Umfragen in dieser Gruppe.</p>
            </div>
         )}
      </div>
    );
  };

  const renderMentoringView = () => {
    if (!selectedGroup) return null;
    const mentors = users.filter(u => u.isMentor);
    const myMentors = mentoringMatches.filter(m => m.menteeID === currentUser?.id && m.status === 'active');
    
    return (
      <div className="p-4 space-y-6 h-[calc(100vh-200px)] overflow-y-auto">
        <div className="bg-primary-50 border border-primary-100 p-4 rounded-xl">
          <h3 className="font-bold text-primary-900 flex items-center gap-2"><HeartHandshake size={20}/> Mentoring Programm</h3>
          <p className="text-sm text-primary-800 mt-1">Finde erfahrene Gemeindemitglieder, die dich auf deinem Weg begleiten.</p>
        </div>

        {myMentors.length > 0 && (
          <div>
             <h4 className="font-bold mb-2 text-stone-700">Dein Mentor</h4>
             {myMentors.map(match => {
               const mentor = users.find(u => u.id === match.mentorID);
               return (
                 <Card key={match.id} className="p-3 bg-green-50 border-green-200">
                   <p className="font-bold">{mentor?.name}</p>
                   <Badge color="bg-green-200 text-green-800">Aktiv</Badge>
                 </Card>
               )
             })}
          </div>
        )}

        <div>
          <h4 className="font-bold mb-2 text-stone-700">Verfügbare Mentoren</h4>
          <div className="space-y-3">
            {mentors.map(mentor => (
              <Card key={mentor.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold">{mentor.name}</h5>
                    <p className="text-sm text-stone-500 mt-1">{mentor.mentoringProfile || 'Keine Beschreibung.'}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => requestMentoring(mentor.id)}>Anfragen</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderAdminView = () => {
      if (!selectedGroup) return null;
      const requests = selectedGroup.joinRequests;
      
      return (
          <div className="p-4 space-y-4 h-[calc(100vh-200px)] overflow-y-auto">
              <h3 className="font-bold text-stone-900 flex items-center gap-2"><ShieldAlert size={20} /> Moderation</h3>
              
              <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-500 uppercase">Beitrittsanfragen ({requests.length})</h4>
                  {requests.length === 0 ? (
                      <p className="text-stone-400 text-sm italic">Keine offenen Anfragen.</p>
                  ) : (
                      requests.map(userId => {
                          const user = users.find(u => u.id === userId);
                          return (
                              <Card key={userId} className="p-3 flex items-center justify-between">
                                  <div>
                                      <div className="font-bold">{user?.name || 'Unbekannt'}</div>
                                      <div className="text-xs text-stone-500">{user?.email}</div>
                                  </div>
                                  <div className="flex gap-2">
                                      <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => respondToGroupRequest(selectedGroup.id, userId, 'reject')}>
                                          <X size={16} />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => respondToGroupRequest(selectedGroup.id, userId, 'accept')}>
                                          <CheckCircle size={16} />
                                      </Button>
                                  </div>
                              </Card>
                          );
                      })
                  )}
              </div>
          </div>
      );
  };

  const renderDetailView = () => {
      if (!selectedGroup) return null;
      const isModerator = currentUser && (selectedGroup.moderators.includes(currentUser.id) || currentUser.role === 'admin' || currentUser.role === 'organizer');

      return (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-stone-200 p-4 flex items-center gap-3 sticky top-0 z-10">
            <Button variant="ghost" onClick={() => setSelectedGroup(null)} className="px-0 mr-2">←</Button>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-stone-900 leading-tight">{selectedGroup.name}</h1>
              <p className="text-xs text-stone-500">{selectedGroup.members.length} Mitglieder • {selectedGroup.type === 'private' ? 'Privat' : 'Öffentlich'}</p>
            </div>
            <div className="flex bg-stone-100 rounded-lg p-1">
                <button onClick={() => setActiveTab('chat')} className={`p-2 rounded-md transition-colors ${activeTab === 'chat' ? 'bg-white shadow-sm text-primary-800' : 'text-stone-500'}`}>
                    <MessageSquare size={20} />
                </button>
                <button onClick={() => setActiveTab('polls')} className={`p-2 rounded-md transition-colors ${activeTab === 'polls' ? 'bg-white shadow-sm text-primary-800' : 'text-stone-500'}`}>
                    <BarChart2 size={20} />
                </button>
                {selectedGroup.isConvertGroup && (
                  <button onClick={() => setActiveTab('mentoring')} className={`p-2 rounded-md transition-colors ${activeTab === 'mentoring' ? 'bg-white shadow-sm text-primary-800' : 'text-stone-500'}`}>
                      <HeartHandshake size={20} />
                  </button>
                )}
                {isModerator && (
                    <div className="relative">
                          <button onClick={() => setActiveTab('admin')} className={`p-2 rounded-md transition-colors ${activeTab === 'admin' ? 'bg-white shadow-sm text-primary-800' : 'text-stone-500'}`}>
                              <ShieldAlert size={20} />
                          </button>
                          {selectedGroup.joinRequests.length > 0 && (
                              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                          )}
                    </div>
                )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-stone-50">
            {activeTab === 'chat' && (
                <ChatView 
                    group={selectedGroup}
                    messages={groupMessages}
                    users={users}
                    currentUser={currentUser}
                    joinGroup={joinGroup}
                    postMessage={postMessage}
                    openReportModal={openReportModal}
                    adminToggleChatRestriction={adminToggleChatRestriction}
                    adminToggleBan={adminToggleBan}
                />
            )}
            {activeTab === 'polls' && renderPollsView()}
            {activeTab === 'mentoring' && renderMentoringView()}
            {activeTab === 'admin' && isModerator && renderAdminView()}
          </div>
        </div>
      );
  };

  const renderListView = () => {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-900">Gruppen</h1>
            {currentUser?.role === 'admin' && (
                <Button onClick={() => setShowCreateGroup(true)} className="flex items-center gap-2">
                    <Plus size={18} /> Neue Gruppe
                </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
                type="text" 
                placeholder="Gruppen suchen..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-primary-600 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredGroups.length === 0 ? (
              <p className="text-center text-stone-500 py-8">Keine Gruppen gefunden.</p>
            ) : (
              filteredGroups.map(group => {
              const isPrivate = group.type === 'private';
              const isMember = currentUser && group.members.includes(currentUser.id);
              const hasRequested = currentUser && group.joinRequests.includes(currentUser.id);

              return (
                <Card key={group.id} onClick={() => setSelectedGroup(group)} className="p-4 hover:bg-stone-50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary-300">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-stone-900">{group.name}</h3>
                    {isPrivate ? <Lock size={16} className="text-stone-400" /> : <Unlock size={16} className="text-stone-400" />}
                  </div>
                  <p className="text-stone-600 text-sm mb-3">{group.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex -space-x-2 items-center">
                      {/* Fake avatars */}
                      <div className="w-6 h-6 rounded-full bg-stone-300 border-2 border-white"></div>
                      <div className="w-6 h-6 rounded-full bg-primary-300 border-2 border-white"></div>
                      <div className="w-6 h-6 rounded-full bg-orange-300 border-2 border-white flex items-center justify-center text-[8px] font-bold text-stone-700">+{group.members.length}</div>
                      {isMember && <span className="ml-2 text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Dabei</span>}
                      {hasRequested && <span className="ml-2 text-xs text-orange-500 font-bold flex items-center gap-1">Angefragt</span>}
                    </div>
                    {group.isConvertGroup && <Badge color="bg-purple-100 text-purple-800">Mentoring</Badge>}
                  </div>
                </Card>
              );
            }))}
          </div>
        </div>
      );
  };

  return (
      <>
        {/* Report Modal */}
        {showReportModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-md p-6">
                    <h3 className="font-bold text-lg mb-2 text-red-600 flex items-center gap-2"><AlertTriangle size={20}/> Inhalt melden</h3>
                    <p className="text-sm text-stone-500 mb-4">Bitte gib einen Grund an, warum dieser Inhalt gegen die Regeln verstößt.</p>
                    <form onSubmit={submitReport}>
                        <textarea 
                            className="w-full border border-stone-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={3}
                            placeholder="Begründung..."
                            value={reportReason}
                            onChange={e => setReportReason(e.target.value)}
                            required
                        />
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="ghost" onClick={() => setShowReportModal(false)}>Abbrechen</Button>
                            <Button type="submit" variant="danger">Melden</Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Create Group Modal - ONLY FOR ADMINS */}
        {showCreateGroup && currentUser?.role === 'admin' && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-primary-900">Neue Gruppe erstellen</h3>
                        <button onClick={() => setShowCreateGroup(false)} className="text-stone-400 hover:text-stone-600"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                        <Input 
                            label="Gruppenname" 
                            value={newGroup.name} 
                            onChange={e => setNewGroup({...newGroup, name: e.target.value})} 
                            required 
                        />
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-700 mb-1">Beschreibung</label>
                            <textarea 
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                                rows={3}
                                value={newGroup.description}
                                onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-700 mb-1">Sichtbarkeit</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="groupType" 
                                        checked={newGroup.type === 'public'} 
                                        onChange={() => setNewGroup({...newGroup, type: 'public'})}
                                    />
                                    <span>Öffentlich</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="groupType" 
                                        checked={newGroup.type === 'private'} 
                                        onChange={() => setNewGroup({...newGroup, type: 'private'})}
                                    />
                                    <span>Privat (Genehmigung erforderlich)</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                             <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCreateGroup(false)}>Abbrechen</Button>
                             <Button type="submit" className="flex-1">Gründen</Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {selectedGroup ? renderDetailView() : renderListView()}
      </>
  );
};

export default Groups;--- START OF FILE pages/Profile.tsx ---

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

export default Profile;--- START OF FILE pages/Admin.tsx ---

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
