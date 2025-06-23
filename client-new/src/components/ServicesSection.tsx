import React from 'react';
import { motion, Variants } from 'framer-motion';
import Icon from './ui/Icon';

const ServicesSection: React.FC = () => {
  // Definición de los servicios con sus detalles
  const services = [
    {
      title: "Páginas Web",
      description: "Diseño y desarrollo de sitios web modernos, responsivos y optimizados para SEO que transforman visitantes en clientes.",
      icon: "ComputerDesktopIcon",
      color: "blue",
      delay: 0
    },
    {
      title: "Aplicaciones Móviles",
      description: "Desarrollo de aplicaciones nativas y cross-platform para iOS y Android que ofrecen experiencias excepcionales a tus usuarios.",
      icon: "DevicePhoneMobileIcon",
      color: "green",
      delay: 1
    },
    {
      title: "Análisis de Datos",
      description: "Transformación de datos en insights accionables mediante herramientas avanzadas de visualización y modelos predictivos.",
      icon: "ChartBarIcon",
      color: "purple",
      delay: 2
    }
  ];

  // Variantes para animaciones del título y descripción
  const titleVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const descriptionVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6, delay: 0.2 }
    }
  };

  // Elemento decorativo de fondo
  const backgroundElementVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 0.05, 
      scale: 1,
      transition: { duration: 1.2 }
    }
  };

  return (
    <div id="servicios" className="relative bg-[#0e1220] py-16 lg:py-24 overflow-hidden">
      {/* Section Separator - Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Fondo diferente con tonos similares */}
        <div className="absolute inset-0 bg-gradient-to-tl from-[#0c101e] via-[#121c35] to-[#0e152a] mix-blend-normal" />
        
        {/* Enhanced gradient circles con posiciones diferentes */}
        <div className="absolute -bottom-60 right-1/3 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute top-1/4 -left-40 w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-purple-600/5 blur-3xl" />
        
        {/* Patron de fondo diferente - hexágonos en lugar de cuadrícula */}
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 20V40L30 55L5 40V20L30 5Z' stroke='white' stroke-opacity='0.2' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Encabezado de la sección */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.h2 
            className="text-4xl font-extrabold text-white sm:text-5xl"
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Servicios</span> destacados
          </motion.h2>
          <motion.p 
            className="mt-4 text-xl text-gray-300 leading-relaxed"
            variants={descriptionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            Soluciones especializadas que impulsan la transformación digital de tu empresa
          </motion.p>
        </div>

        {/* Grid de tarjetas de servicios */}
        <div className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-3">
          {services.map((service, index) => (
            <motion.div 
              key={index}
              className="group bg-[#0a0f1d] rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-${service.color}-500/20 hover:translate-y-[-4px]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              {/* Icono animado dentro de un círculo */}
              <motion.div 
                className={`relative w-32 h-32 mb-6 rounded-full flex items-center justify-center bg-${service.color}-900/30 group-hover:bg-${service.color}-800/40 transition-all duration-500`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {/* Círculo brillante decorativo */}
                <div className={`absolute inset-0 rounded-full bg-${service.color}-500/20 blur-md group-hover:bg-${service.color}-500/30 transition-all duration-500`}></div>
                
                {/* Anillo exterior */}
                <div className={`absolute inset-0 rounded-full border-2 border-${service.color}-500/40 group-hover:border-${service.color}-400/60 transition-all duration-500`}></div>
                
                {/* Icono central con animación */}
                <motion.div
                  className="relative z-10"
                  animate={{ 
                    rotate: [0, 5, 0, -5, 0],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 6,
                    ease: "easeInOut" 
                  }}
                >
                  <Icon 
                    name={service.icon} 
                    className={`h-16 w-16 text-${service.color}-400 group-hover:text-${service.color}-300 drop-shadow-lg transition-all duration-300`} 
                  />
                </motion.div>
                
                {/* Partículas decorativas */}
                <motion.div 
                  className={`absolute w-2 h-2 rounded-full bg-${service.color}-400/80`} 
                  style={{ top: '20%', right: '15%' }}
                  animate={{ 
                    opacity: [0.5, 1, 0.5], 
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "easeInOut" 
                  }}
                />
                <motion.div 
                  className={`absolute w-1.5 h-1.5 rounded-full bg-${service.color}-300/80`}
                  style={{ bottom: '25%', left: '20%' }}
                  animate={{ 
                    opacity: [0.5, 1, 0.5], 
                    scale: [1, 1.3, 1] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2.5,
                    delay: 0.5,
                    ease: "easeInOut" 
                  }}
                />
              </motion.div>
              
              <h3 className={`text-2xl font-bold text-white mb-2 group-hover:text-${service.color}-400 transition-colors duration-300`}>
                {service.title}
              </h3>
              
              {/* Subtítulos / tecnologías */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {service.title === "Páginas Web" && (
                  <>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${service.color}-900/50 text-${service.color}-400 border border-${service.color}-700/30`}>Responsive</span>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${service.color}-900/50 text-${service.color}-400 border border-${service.color}-700/30`}>SEO</span>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${service.color}-900/50 text-${service.color}-400 border border-${service.color}-700/30`}>UI/UX</span>
                  </>
                )}
                {service.title === "Aplicaciones Móviles" && (
                  <>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${service.color}-900/50 text-${service.color}-400 border border-${service.color}-700/30`}>iOS</span>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${service.color}-900/50 text-${service.color}-400 border border-${service.color}-700/30`}>Android</span>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${service.color}-900/50 text-${service.color}-400 border border-${service.color}-700/30`}>Cross-platform</span>
                  </>
                )}
                {service.title === "Análisis de Datos" && (
                  <>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${service.color}-900/50 text-${service.color}-400 border border-${service.color}-700/30`}>Visualización</span>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${service.color}-900/50 text-${service.color}-400 border border-${service.color}-700/30`}>BI</span>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${service.color}-900/50 text-${service.color}-400 border border-${service.color}-700/30`}>Insights</span>
                  </>
                )}
              </div>
              
              <p className="text-gray-400 mb-6 leading-relaxed">
                {service.description}
              </p>
              
              <div className="mt-auto">
                <motion.button 
                  className={`flex items-center px-4 py-2 rounded-full bg-${service.color}-900/30 text-${service.color}-400 border border-${service.color}-800/40 hover:bg-${service.color}-800/40 transition-all duration-300`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <span className="mr-2">Conocer más</span>
                  <Icon name="ArrowRightIcon" className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Botón de llamado a la acción */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <a 
            href="#contacto" 
            className="inline-flex items-center justify-center px-8 py-3 border border-blue-500/30 text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1"
          >
            Comienza tu proyecto
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default ServicesSection;
