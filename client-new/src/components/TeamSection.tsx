import React from 'react';
import { motion } from 'framer-motion';
import TeamMemberCard from './TeamMemberCard';

const TeamSection: React.FC = () => {
  const teamMembers = [
    {
      name: "Daniel Iturra",
      initials: "DI",
      role: "Ingeniero Informático",
      description: "Especialista en arquitectura de software y desarrollo backend. Con amplia experiencia en el diseño de sistemas escalables y la implementación de soluciones tecnológicas robustas que impulsan el crecimiento empresarial.",
      skills: ["Backend", "Arquitectura", "DevOps"],
      colorFrom: "blue-500",
      colorTo: "indigo-700",
      textColor: "blue-300", // Ajustado para mejor contraste en fondo oscuro
      badgeColor: "blue-900", // Ajustado para fondo oscuro
      badgeTextColor: "blue-300" // Ajustado para fondo oscuro
    },
    {
      name: "Mario Bronchuer",
      initials: "MB",
      role: "Ingeniero Informático",
      description: "Experto en desarrollo frontend y experiencia de usuario. Se enfoca en crear interfaces intuitivas y funcionales que conectan de manera efectiva la tecnología con las necesidades del usuario final.",
      skills: ["Frontend", "UX/UI", "React"],
      colorFrom: "indigo-500",
      colorTo: "purple-700",
      textColor: "indigo-300", // Ajustado para mejor contraste en fondo oscuro
      badgeColor: "indigo-900", // Ajustado para fondo oscuro
      badgeTextColor: "indigo-300" // Ajustado para fondo oscuro
    }
  ];

  return (
    <div id="fundadores" className="py-16 bg-[#161e36] overflow-hidden lg:py-24 relative">
      {/* Section Separator - Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#192042] to-[#141b32] mix-blend-normal" />
        
        {/* Enhanced gradient circles */}
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/8 blur-3xl" />
        
        {/* Grid overlay with slightly higher opacity */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0.5' y='0.5' width='19' height='19' stroke='white' stroke-opacity='0.15'/%3E%3C/svg%3E")`
          }}
        />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.span 
            className="block mb-2 text-blue-400 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Quiénes somos
          </motion.span>
          
          <motion.h2 
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Nuestro Equipo</span> Fundador
          </motion.h2>
          
          <motion.div 
            className="mt-2 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className="text-xl text-gray-300">
              Ingenieros informáticos con la experiencia y pasión necesarias para transformar ideas en soluciones digitales exitosas
            </p>
          </motion.div>
          
          {/* Línea decorativa */}
          <motion.div 
            className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mt-8 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: 80, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          />
        </motion.div>

        <div className="mt-16 grid gap-10 lg:gap-16 md:grid-cols-2 max-w-4xl mx-auto">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-[#111827] border border-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-indigo-500/10 hover:border-indigo-500/20"
            >
              <div className="p-6">
                <div className="flex items-center space-x-5 mb-4">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold bg-gradient-to-r from-${member.colorFrom} to-${member.colorTo}`}>
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{member.name}</h3>
                    <p className={`text-${member.textColor}`}>{member.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-5 text-sm">{member.description}</p>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map(skill => (
                    <span 
                      key={skill} 
                      className={`text-xs py-1 px-2 rounded-full bg-${member.badgeColor} text-${member.badgeTextColor}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Elemento decorativo inferior */}
        <motion.div 
          className="flex justify-center mt-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-30" />
        </motion.div>
      </div>
    </div>
  );
};

export default TeamSection;
