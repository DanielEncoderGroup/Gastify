import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      title: 'Automatización del 95%',
      description: 'Reduce la intervención manual drásticamente mediante nuestros algoritmos avanzados',
      icon: 'CpuChipIcon',
      color: 'primary'
    },
    {
      title: 'Precisión garantizada',
      description: 'La IA elimina los errores humanos comunes en la gestión de gastos',
      icon: 'CheckBadgeIcon',
      color: 'emerald'
    },
    {
      title: 'Ahorro de tiempo real',
      description: 'Reduce el procesamiento de horas a minutos con la automatización inteligente',
      icon: 'ClockIcon',
      color: 'blue'
    },
    {
      title: 'Compliance sin esfuerzo',
      description: 'Cumplimiento automático de regulaciones fiscales locales e internacionales',
      icon: 'DocumentCheckIcon',
      color: 'indigo'
    },
    {
      title: 'Detección de fraude',
      description: 'Algoritmos avanzados que protegen tu empresa contra gastos fraudulentos',
      icon: 'ShieldCheckIcon',
      color: 'amber'
    }
  ];

  // Función para obtener clases de color según el beneficio
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string, icon: string, gradient: string }> = {
      primary: { 
        bg: 'bg-primary-50', 
        icon: 'text-primary-600',
        gradient: 'from-primary-400 to-primary-600'
      },
      emerald: { 
        bg: 'bg-emerald-50', 
        icon: 'text-emerald-600',
        gradient: 'from-emerald-400 to-emerald-600'
      },
      blue: { 
        bg: 'bg-blue-50', 
        icon: 'text-blue-600',
        gradient: 'from-blue-400 to-blue-600'
      },
      indigo: { 
        bg: 'bg-indigo-50', 
        icon: 'text-indigo-600',
        gradient: 'from-indigo-400 to-indigo-600'
      },
      amber: { 
        bg: 'bg-amber-50', 
        icon: 'text-amber-600',
        gradient: 'from-amber-400 to-amber-600'
      }
    };

    return colorMap[color] || colorMap.primary;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div id="beneficios" className="relative py-16 bg-white sm:py-24">
      <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Beneficios medibles y cuantificables
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
            Resultados tangibles que transformarán la gestión de gastos de tu empresa
          </p>
        </motion.div>

        <motion.div 
          className="mt-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {benefits.map((benefit, index) => {
              const colorClasses = getColorClasses(benefit.color);
              
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="pt-6 relative"
                >
                  <div className="relative rounded-xl overflow-hidden shadow-lg h-full">
                    {/* Gradient background */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${colorClasses.gradient}`}></div>
                    
                    <div className={`flow-root ${colorClasses.bg} px-6 pb-8 h-full border-t border-gray-200`}>
                      <div className="-mt-6">
                        <div>
                          <span className={`inline-flex items-center justify-center rounded-md ${colorClasses.bg} p-3 shadow-lg border border-gray-200`}>
                            <Icon name={benefit.icon} className={`h-6 w-6 ${colorClasses.icon}`} aria-hidden="true" />
                          </span>
                        </div>
                        <h3 className="mt-8 text-lg font-bold text-gray-900 tracking-tight">{benefit.title}</h3>
                        <p className="mt-3 text-base text-gray-500">{benefit.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        
        {/* Stats section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 bg-primary-700 rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="relative px-6 py-10 sm:px-12 sm:py-16">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="h-full w-full" fill="none">
                <defs>
                  <pattern id="pattern" width="32" height="32" patternUnits="userSpaceOnUse" x="50%" y="0">
                    <path d="M0 0h32v32H0z" fill="url(#squares)" />
                  </pattern>
                  <pattern id="squares" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M4 0h4v4H4V0Zm0 4h4v4H4V4Z" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pattern)" />
              </svg>
            </div>
            
            <div className="relative text-center">
              <h3 className="text-2xl font-bold text-white">
                Resultados probados por nuestros clientes
              </h3>
              
              <dl className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div>
                  <dt className="order-2 mt-2 text-base font-medium text-primary-200">
                    Reducción en tiempo de procesamiento
                  </dt>
                  <dd className="order-1 text-4xl font-extrabold text-white">95%</dd>
                </div>
                <div>
                  <dt className="order-2 mt-2 text-base font-medium text-primary-200">
                    Aumento en precisión
                  </dt>
                  <dd className="order-1 text-4xl font-extrabold text-white">99.8%</dd>
                </div>
                <div>
                  <dt className="order-2 mt-2 text-base font-medium text-primary-200">
                    ROI promedio
                  </dt>
                  <dd className="order-1 text-4xl font-extrabold text-white">345%</dd>
                </div>
              </dl>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BenefitsSection;
