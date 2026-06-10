import React from 'react';
import { Compass, GraduationCap, Building2, Ticket, MapPin } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelectPrompt }) => {
  const prompts = [
    {
      icon: <GraduationCap className="text-emerald-400" size={20} />,
      title: "Admission Requirements",
      text: "What documents are required for admission?",
      query: "What documents are required for admission?"
    },
    {
      icon: <Building2 className="text-purple-400" size={20} />,
      title: "Hostel Facilities",
      text: "What items are provided in the hostel room?",
      query: "What items are provided in the hostel room?"
    },
    {
      icon: <Ticket className="text-sky-400" size={20} />,
      title: "Apply for Bus Pass",
      text: "How long does it take to issue a new bus pass?",
      query: "How long does it take to issue a new bus pass?"
    },
    {
      icon: <MapPin className="text-amber-400" size={20} />,
      title: "Bus Pickup & Routes",
      text: "What is Route 1 transport schedule?",
      query: "What is Route 1 transport schedule?"
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-6">
      <div className="flex items-center gap-2 mb-4 text-chatTextMuted text-sm font-semibold uppercase tracking-wider justify-center md:justify-start">
        <Compass size={16} />
        <span>Suggested Queries</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(p.query)}
            className="flex flex-col items-start p-4 bg-chatCard hover:bg-chatBorder/40 border border-chatBorder hover:border-chatPrimary/30 rounded-xl text-left cursor-pointer transition-all duration-200 group active:scale-[0.99]"
          >
            <div className="p-2 bg-chatBg rounded-lg mb-3 group-hover:bg-chatPrimary/10 group-hover:text-chatPrimary transition-colors">
              {p.icon}
            </div>
            <h4 className="text-chatText font-semibold text-sm mb-1">{p.title}</h4>
            <p className="text-chatTextMuted text-xs line-clamp-2">{p.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPrompts;
