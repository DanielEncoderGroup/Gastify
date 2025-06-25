import React from 'react';
import { motion } from 'framer-motion';

interface TeamMemberProps {
  name: string;
  initials: string;
  role: string;
  description: string;
  skills: string[];
  colorFrom: string;
  colorTo: string;
  textColor: string;
  badgeColor: string;
  badgeTextColor: string;
  index: number;
}

const TeamMemberCard: React.FC<TeamMemberProps> = ({
  name,
  initials,
  role,
  description,
  skills,
  colorFrom,
  colorTo,
  textColor,
  badgeColor,
  badgeTextColor,
  index
}) => {
  // Retraso basado en índice para efectos escalonados
  const delay = 0.2 + index * 0.2;
  
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        transition: { 
          duration: 0.7, 
          delay, 
          type: "spring", 
          stiffness: 100 
        } 
      }}
      viewport={{ once: true, margin: "-100px" }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3 },
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
    >
      {/* Gradiente de fondo con efecto de animación */}
      <motion.div 
        className={`h-64 relative overflow-hidden bg-gradient-to-br from-${colorFrom} to-${colorTo}`}
        initial={{ backgroundPosition: "0% 0%" }}
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Formas decorativas animadas */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className={`absolute top-10 left-10 h-24 w-24 rounded-full bg-white opacity-10`}
            animate={{ 
              scale: [1, 1.5, 1],
              x: [0, 10, 0],
              y: [0, 10, 0],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className={`absolute bottom-10 right-10 h-32 w-32 rounded-full bg-white opacity-10`}
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, -20, 0],
              y: [0, -10, 0],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        {/* Foto/iniciales con efectos */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 30px 5px rgba(255, 255, 255, 0.4)",
              transition: { duration: 0.3 }
            }}
          >
            <motion.span 
              className={`text-4xl font-bold text-${textColor}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.3, duration: 0.5 }}
            >
              {initials}
            </motion.span>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Contenido con información */}
      <div className="p-6">
        <motion.h3 
          className="text-xl font-bold text-gray-900 mb-1 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.4, duration: 0.5 }}
        >
          {name}
        </motion.h3>
        
        <motion.p 
          className={`text-${textColor} font-medium mb-4 text-center`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.5, duration: 0.5 }}
        >
          {role}
        </motion.p>
        
        <motion.p 
          className="text-gray-600 text-sm leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.6, duration: 0.5 }}
        >
          {description}
        </motion.p>
        
        <motion.div 
          className="mt-4 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.7, duration: 0.5 }}
        >
          {skills.map((skill, i) => (
            <motion.span 
              key={skill}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${badgeColor} text-${badgeTextColor}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.7 + (i * 0.1), duration: 0.4 }}
              whileHover={{ 
                scale: 1.1,
                transition: { duration: 0.2 }
              }}
            >
              {skill}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TeamMemberCard;
