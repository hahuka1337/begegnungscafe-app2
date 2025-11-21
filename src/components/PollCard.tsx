
import React from 'react';
import { Poll, PollVote } from '../types';
import { Card, Button } from './Shared';
import { useApp } from '../services/store';
import { BarChart2 } from 'lucide-react';

interface PollCardProps {
  poll: Poll;
}

export const PollCard: React.FC<PollCardProps> = ({ poll }) => {
  const { currentUser, pollVotes, votePoll } = useApp();

  const myVote = currentUser ? pollVotes.find(v => v.pollId === poll.id && v.userId === currentUser.id) : null;
  const hasVoted = !!myVote;

  // Calculate results
  const votesForPoll = pollVotes.filter(v => v.pollId === poll.id);
  const totalVotes = votesForPoll.length;

  const getPercentage = (index: number) => {
    if (totalVotes === 0) return 0;
    const count = votesForPoll.filter(v => v.optionIndex === index).length;
    return Math.round((count / totalVotes) * 100);
  };

  return (
    <Card className="p-4 mb-4 border border-stone-200">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 size={18} className="text-primary-600" />
        <h3 className="font-bold text-stone-900">{poll.question}</h3>
      </div>

      <div className="space-y-2">
        {poll.options.map((option, idx) => {
          const isSelected = myVote?.optionIndex === idx;
          const percentage = getPercentage(idx);

          if (hasVoted) {
            return (
              <button
                key={idx}
                onClick={() => votePoll(poll.id, idx)}
                disabled={isSelected}
                className={`relative w-full h-10 bg-stone-100 rounded-lg overflow-hidden border transition-all duration-200 ${isSelected ? 'border-primary-500 ring-1 ring-primary-500 cursor-default' : 'border-stone-200 hover:border-primary-300 hover:bg-stone-50 cursor-pointer'}`}
              >
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${isSelected ? 'bg-primary-200' : 'bg-stone-200'}`} 
                  style={{ width: `${percentage}%` }} 
                />
                <div className="absolute inset-0 flex justify-between items-center px-3 z-10">
                  <span className={`text-sm font-medium truncate mr-2 ${isSelected ? 'text-primary-900' : 'text-stone-700'}`}>
                    {option} {isSelected && '(Deine Wahl)'}
                  </span>
                  <span className="text-xs font-bold text-stone-600">{percentage}%</span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => votePoll(poll.id, idx)}
              className="w-full text-left px-4 py-2 rounded-lg border border-stone-300 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-800 transition-colors text-sm font-medium"
            >
              {option}
            </button>
          );
        })}
      </div>
      
      <div className="mt-3 flex justify-between items-center text-xs text-stone-400">
        <span>{hasVoted && "Tippe auf eine Option, um die Wahl zu ändern"}</span>
        <span>{totalVotes} {totalVotes === 1 ? 'Stimme' : 'Stimmen'}</span>
      </div>
    </Card>
  );
};
