import React from 'react';
import { motion } from 'framer-motion';
import MethodologyCard from './MethodologyCard';

const MethodologiesSection: React.FC = () => {
  const methodologies = [
    {
      title: "Scrum",
      description: "Iteraciones cortas (sprints) que permiten entregar valor de forma incremental y obtener retroalimentación constante.",
      iconName: "ArrowPathIcon",
      bulletPoints: [
        "Sprints de 1-2 semanas",
        "Ceremonias ágiles",
        "Mejora continua"
      ]
    },
    {
      title: "Kanban",
      description: "Visualización del flujo de trabajo que permite identificar cuellos de botella y optimizar procesos.",
      iconName: "Squares2X2Icon",
      bulletPoints: [
        "Flujo continuo",
        "Limitación de trabajo en progreso",
        "Optimización de ciclos"
      ]
    },
    {
      title: "DevOps",
      description: "Integración entre desarrollo y operaciones para automatizar procesos y acelerar entregas.",
      iconName: "CpuChipIcon",
      bulletPoints: [
        "CI/CD automatizado",
        "Infraestructura como código",
        "Monitoreo continuo"
      ]
    }
  ];

  return (
    <div id="metodologias" className="py-16 bg-[#161e36] overflow-hidden lg:py-24 relative">
      {/* Section Separator - Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#192042] to-[#141b32] mix-blend-normal" />
        
        {/* Enhanced gradient circles */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/8 blur-3xl" />
        
        {/* Grid overlay with slightly higher opacity */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0.5' y='0.5' width='19' height='19' stroke='white' stroke-opacity='0.15'/%3E%3C/svg%3E")`
          }}
        />
      </div>
      
      <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl z-10">
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.8, delay: 0.1 }
          }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2 
            className="text-center text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl"
            initial={{ scale: 0.9 }}
            whileInView={{ 
              scale: 1,
              transition: { 
                type: "spring", 
                stiffness: 100, 
                duration: 0.8, 
                delay: 0.2
              }
            }}
            viewport={{ once: true }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Metodologías</span> de Trabajo
          </motion.h2>
          <motion.p 
            className="mt-4 max-w-3xl mx-auto text-center text-lg text-gray-300"
            initial={{ opacity: 0 }}
            whileInView={{ 
              opacity: 1,
              transition: { duration: 0.8, delay: 0.3 }
            }}
            viewport={{ once: true }}
          >
            Implementamos metodologías ágiles que garantizan la entrega de valor constante y la adaptación a los cambios.
          </motion.p>
        </motion.div>

        <div className="mt-14 lg:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {methodologies.map((methodology, index) => (
            <MethodologyCard
              key={methodology.title}
              title={methodology.title}
              description={methodology.description}
              iconName={methodology.iconName}
              bulletPoints={methodology.bulletPoints}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MethodologiesSection;
