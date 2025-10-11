import { motion } from 'motion/react';
import { ChevronRight, Sparkles } from 'lucide-react';

interface ToolCardProps {
  icon: string;
  title: string;
  purpose: string;
  flow: string;
  route: string;
  onClick?: () => void;
}

export function ToolCard({ icon, title, purpose, flow, onClick }: ToolCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4 text-left">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0 mt-1">
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Title */}
          <h3 className="text-gray-900 font-medium">
            {title}
          </h3>
          
          {/* Purpose line */}
          <p className="text-gray-600 text-sm leading-relaxed">
            {purpose}
          </p>
          
          {/* Flow hint */}
          <div className="flex items-start gap-2 pt-1">
            <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-500 text-xs leading-relaxed">
              {flow}
            </p>
          </div>
        </div>
        
        {/* Arrow indicator */}
        <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
      </div>
    </motion.button>
  );
}