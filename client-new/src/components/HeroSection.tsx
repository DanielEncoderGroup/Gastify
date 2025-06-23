import React from 'react';
import { motion, Variants, easeOut, easeInOut } from 'framer-motion';
import { Link } from 'react-router-dom';
import Icon from './ui/Icon';

interface HeroSectionProps {
  setShowLoginModal: (show: boolean) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ setShowLoginModal }) => {
  // Variantes para animaciones
  const titleVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: easeOut }
    }
  };

  const subtitleVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 0.3, ease: easeOut }
    }
  };

  const buttonVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.6, ease: easeOut }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.3 }
    }
  };

  const backgroundVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1.2 }
    }
  };

  const gradientVariants: Variants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 0.2,
      x: 0,
      transition: { duration: 1.5, ease: easeInOut }
    }
  };
  
  const statsVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.8 + i * 0.1, duration: 0.5, ease: easeOut }
    })
  };

  const stats = [
    {
      icon: "GlobeAltIcon",
      text: "Infraestructura Global"
    },
    {
      icon: "ClockIcon",
      text: "Soporte eficiente"
    },
    {
      icon: "ServerIcon",
      text: "Servidores Potentes"
    },
    {
      icon: "UserGroupIcon",
      text: "100+ Clientes felices"
    }
  ];

  return (
    <motion.div 
      className="relative bg-[#0f1628]"
      initial="hidden"
      animate="visible"
      variants={backgroundVariants}
    >
      {/* Header particles background */}
      <motion.div className="absolute inset-0 overflow-hidden" variants={backgroundVariants}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#121a33] to-[#0c1220] mix-blend-multiply" />
        
        {/* Subtle gradient circles */}
        <motion.div 
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        <motion.div 
          className="absolute top-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-purple-500/5 blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1 }}
        />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0.5' y='0.5' width='19' height='19' stroke='white' stroke-opacity='0.1'/%3E%3C/svg%3E")`
          }}
        />
      </motion.div>
      
      {/* Stats bar at top */}
      <div className="border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center md:justify-between py-3">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="flex items-center px-3 py-2 text-sm text-gray-300"
                custom={index}
                variants={statsVariants}
                initial="hidden"
                animate="visible"
              >
                <Icon name={stat.icon} className="h-5 w-5 text-blue-400 mr-2" />
                <span>{stat.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Hero content */}
      <div className="relative z-10 max-w-7xl mx-auto pt-16 pb-24 px-4 sm:pt-20 sm:pb-32 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Company name */}
          <motion.div
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 text-center"
            variants={titleVariants}
          >
            EncoderGroup
          </motion.div>
          
          {/* Main heading */}
          <motion.h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
            variants={titleVariants}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-600">Desarrollo de Software</span>
          </motion.h1>
          
          {/* Description */}
          <motion.p 
            className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto text-center"
            variants={subtitleVariants}
          >
            EncoderGroup transforma el modo en que las empresas gestionan sus recursos, 
            proyectos y equipos mediante soluciones digitales a medida que crecen con tu negocio.
          </motion.p>
          
          {/* Action buttons */}
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            variants={buttonVariants}
          >
            <motion.div variants={buttonVariants} whileHover="hover">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              >
                Comenzar ahora
              </Link>
            </motion.div>
            <motion.button
              onClick={() => setShowLoginModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-400 bg-transparent hover:bg-blue-900/20"
              variants={buttonVariants}
              whileHover={{ scale: 1.05 }}
            >
              Iniciar sesión
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroSection;
