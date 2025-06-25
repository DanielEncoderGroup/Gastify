import React from 'react';
import { motion } from 'framer-motion';
import Icon from './ui/Icon';

interface MethodologyCardProps {
  title: string;
  description: string;
  iconName: string;
  bulletPoints: string[];
  index: number;
}

const MethodologyCard: React.FC<MethodologyCardProps> = ({ 
  title, 
  description, 
  iconName, 
  bulletPoints,
  index 
}) => {
  // Calcular retraso basado en el índice para escalonar las animaciones
  const delay = 0.2 + index * 0.15;
  
  // Determinar color basado en el índice
  const getCardStyle = () => {
    switch(index % 3) {
      case 0: return {
        bgGradient: 'from-[#0f172a] to-[#1e293b]', 
        accentColor: 'text-blue-400',
        iconBg: 'bg-blue-500/20',
        iconBorder: 'border-blue-500/40',
        bulletColor: 'text-blue-400'
      };
      case 1: return {
        bgGradient: 'from-[#0f172a] to-[#1e2a47]', 
        accentColor: 'text-indigo-400',
        iconBg: 'bg-indigo-500/20',
        iconBorder: 'border-indigo-500/40',
        bulletColor: 'text-indigo-400'
      };
      case 2: return {
        bgGradient: 'from-[#0f172a] to-[#1c2536]', 
        accentColor: 'text-purple-400',
        iconBg: 'bg-purple-500/20',
        iconBorder: 'border-purple-500/40',
        bulletColor: 'text-purple-400'
      };
      default: return {
        bgGradient: 'from-[#0f172a] to-[#1e293b]',
        accentColor: 'text-blue-400',
        iconBg: 'bg-blue-500/20',
        iconBorder: 'border-blue-500/40',
        bulletColor: 'text-blue-400'
      };
    }
  };
  
  const style = getCardStyle();
  
  return (
    <motion.div 
      className={`p-6 rounded-lg border border-slate-700 bg-gradient-to-br ${style.bgGradient} overflow-hidden shadow-lg`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { duration: 0.7, delay, type: "spring", stiffness: 100 }
      }}
      viewport={{ once: true, margin: "-100px" }}
      whileHover={{ 
        y: -5,
        boxShadow: "0 20px 30px -5px rgba(0, 0, 0, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.2)"
      }}
    >
      {/* Card Header with Icon */}
      <div className="flex items-center mb-5">
        <motion.div 
          className={`h-12 w-12 rounded-lg ${style.iconBg} border ${style.iconBorder} flex items-center justify-center`}
          whileHover={{ 
            scale: 1.1, 
            rotate: [0, 5, -5, 0],
            transition: { 
              rotate: { repeat: 0, duration: 0.5 },
              scale: { duration: 0.2 }
            }
          }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              transition: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
          >
            <Icon name={iconName} className={`h-6 w-6 ${style.accentColor}`} />
          </motion.div>
        </motion.div>
        
        {/* Title */}
        <motion.h3 
          className={`text-xl font-bold text-white ml-3 ${style.accentColor}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2, duration: 0.5 }}
        >
          {title}
        </motion.h3>
      </div>
      
      {/* Description */}
      <motion.p 
        className="text-gray-300 mb-4 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.5 }}
      >
        {description}
      </motion.p>
      
      {/* Feature bullets */}
      <div className="border-t border-slate-700/50 pt-4">
        <motion.ul 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.4, duration: 0.5 }}
        >
          {bulletPoints.map((point, i) => (
            <motion.li 
              key={i}
              className="flex items-start"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.4 + (i * 0.1), duration: 0.3 }}
            >
              <span className={`mr-2 mt-0.5 ${style.bulletColor}`}>•</span>
              <span className="text-gray-300 text-sm">{point}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
};

export default MethodologyCard;
