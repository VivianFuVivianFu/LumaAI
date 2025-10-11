import { motion } from 'motion/react';
import { JournalMode } from './JournalScreen';

interface JournalCardProps {
  emoji: string;
  title: string;
  description: string;
  timeEstimate: string;
  buttonText: string;
  mode: JournalMode;
  onStart: (mode: JournalMode) => void;
}

export function JournalCard({ 
  emoji, 
  title, 
  description, 
  timeEstimate, 
  buttonText, 
  mode, 
  onStart 
}: JournalCardProps) {
  return (
    <motion.div
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{emoji}</span>
            <h3 className="text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {description} <span className="text-gray-500">⏱ {timeEstimate}</span>
          </p>
        </div>
        <button
          onClick={() => onStart(mode)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity flex-shrink-0 ml-4"
        >
          {buttonText}
        </button>
      </div>
    </motion.div>
  );
}