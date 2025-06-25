import React from 'react';
import { motion, Variants } from 'framer-motion';
import Icon from './ui/Icon';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  delay: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon, color, delay }) => {
  // Objeto de colores para los diferentes servicios
  const colors = {
    blue: {
      bg: 'from-blue-400 to-blue-600',
      hover: 'hover:to-blue-500',
      accent: 'border-blue-300',
      text: 'text-blue-600',
      shadow: 'shadow-blue-200'
    },
    purple: {
      bg: 'from-purple-400 to-purple-600',
      hover: 'hover:to-purple-500',
      accent: 'border-purple-300',
      text: 'text-purple-600',
      shadow: 'shadow-purple-200'
    },
    green: {
      bg: 'from-green-400 to-green-600',
      hover: 'hover:to-green-500',
      accent: 'border-green-300',
      text: 'text-green-600',
      shadow: 'shadow-green-200'
    },
    amber: {
      bg: 'from-amber-400 to-amber-600',
      hover: 'hover:to-amber-500',
      accent: 'border-amber-300',
      text: 'text-amber-600',
      shadow: 'shadow-amber-200'
    },
    teal: {
      bg: 'from-teal-400 to-teal-600',
      hover: 'hover:to-teal-500',
      accent: 'border-teal-300',
      text: 'text-teal-600',
      shadow: 'shadow-teal-200'
    },
    indigo: {
      bg: 'from-indigo-400 to-indigo-600',
      hover: 'hover:to-indigo-500',
      accent: 'border-indigo-300',
      text: 'text-indigo-600',
      shadow: 'shadow-indigo-200'
    }
  };

  const currentColor = colors[color as keyof typeof colors];

  // Variantes para animaciones
  const cardVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: "easeOut", 
        delay: delay * 0.1
      }
    }
  };

  const iconContainerVariants: Variants = {
    hidden: { 
      scale: 0.8,
      rotate: -10,
      opacity: 0.5
    },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: { 
        duration: 0.4,
        delay: delay * 0.1 + 0.3
      }
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: { duration: 0.3 }
    }
  };

  const shapeVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 0.2,
      transition: { 
        delay: delay * 0.1 + 0.2,
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border ${currentColor.accent} relative group`}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
    >
      {/* Formas decorativas en el fondo */}
      <motion.div 
        className="absolute top-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br opacity-20"
        style={{ background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)` }}
        variants={shapeVariants}
        initial="hidden"
        whileInView="visible"
      />
      <motion.div 
        className="absolute bottom-12 left-6 w-20 h-20 rounded-full bg-gradient-to-br opacity-10"
        style={{ background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)` }}
        variants={shapeVariants}
        initial="hidden"
        whileInView="visible"
      />
      
      {/* Área de icono con gradiente */}
      <div className={`h-48 bg-gradient-to-br ${currentColor.bg} ${currentColor.hover} relative overflow-hidden transform transition-all duration-500 group-hover:scale-105`}>
        {/* Formas flotantes en el fondo */}
        <motion.div 
          className="absolute top-5 left-5 w-12 h-12 rounded-full bg-white opacity-10"
          animate={{ 
            x: [0, 10, 0], 
            y: [0, -10, 0], 
            scale: [1, 1.1, 1] 
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            repeatType: "reverse" 
          }}
        />
        <motion.div 
          className="absolute bottom-5 right-5 w-16 h-16 rounded-full bg-white opacity-10"
          animate={{ 
            x: [0, -15, 0], 
            y: [0, 10, 0], 
            scale: [1, 1.2, 1] 
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            repeatType: "reverse" 
          }}
        />
        
        {/* Icono central */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          variants={iconContainerVariants}
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
        >
          <Icon name={icon} className="h-24 w-24 text-white drop-shadow-lg" />
        </motion.div>
      </div>
      
      {/* Contenido */}
      <div className="p-6">
        <motion.h3 
          className="text-xl font-bold text-gray-900 mb-3"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: delay * 0.1 + 0.4, duration: 0.3 }}
        >
          {title}
        </motion.h3>
        
        <motion.p 
          className="text-gray-600 mb-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: delay * 0.1 + 0.5, duration: 0.4 }}
        >
          {description}
        </motion.p>
        
        <motion.div 
          className={`flex items-center ${currentColor.text} font-medium group cursor-pointer`}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.6, duration: 0.3 }}
          whileHover={{ x: 5 }}
        >
          <span className="mr-2 transition-all duration-300 group-hover:mr-3">Conocer más</span>
          <Icon name="ArrowRightIcon" className="h-4 w-4 transition-all duration-300" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
