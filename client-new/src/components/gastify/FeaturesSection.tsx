import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

const FeaturesSection: React.FC = () => {
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
      transition: { duration: 0.6 }
    }
  };

  const features = [
    {
      name: 'IA para categorización automática',
      description: [
        'Sistema de inteligencia artificial que aprende patrones de gastos',
        'Categorización instantánea con 95% de precisión',
        'Sugerencias proactivas para optimizar categorías'
      ],
      icon: 'CpuChipIcon',
      color: 'emerald'
    },
    {
      name: 'OCR avanzado para facturas',
      description: [
        'Extrae automáticamente todos los datos de recibos y facturas',
        'Reconoce múltiples formatos y idiomas',
        'Validación automática de información'
      ],
      icon: 'DocumentTextIcon',
      color: 'blue'
    },
    {
      name: 'Geolocalización para gastos de viaje',
      description: [
        'Registra automáticamente la ubicación de cada gasto',
        'Validación geográfica de gastos de viaje',
        'Alertas de gastos fuera de zona autorizada'
      ],
      icon: 'MapPinIcon',
      color: 'amber'
    },
    {
      name: 'Workflows de aprobación inteligentes',
      description: [
        'Automatiza el proceso de aprobación según reglas personalizadas',
        'Escalamiento automático por montos y tipos',
        'Notificaciones inteligentes a aprobadores'
      ],
      icon: 'ArrowsRightLeftIcon',
      color: 'indigo'
    },
    {
      name: 'Analytics predictivos',
      description: [
        'Anticipa tendencias de gastos y detecta anomalías',
        'Reportes predictivos para planificación presupuestaria',
        'Alertas tempranas de posibles sobrecostos'
      ],
      icon: 'ChartBarIcon',
      color: 'purple'
    },
    {
      name: 'Compliance automático por región',
      description: [
        'Mantiene cumplimiento con regulaciones locales automáticamente',
        'Adaptación a políticas fiscales por país/región',
        'Documentación automática para auditorías'
      ],
      icon: 'GlobeAmericasIcon',
      color: 'cyan'
    }
  ];

  // Función para obtener clases de color según la característica
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string, icon: string, border: string }> = {
      emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
      amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200' },
      indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
      cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-200' }
    };

    return colorMap[color] || { bg: 'bg-primary-50', icon: 'text-primary-600', border: 'border-primary-200' };
  };

  return (
    <div id="caracteristicas" className="relative py-16 bg-white sm:py-24">
      <div className="mx-auto max-w-md px-6 text-center sm:max-w-3xl lg:max-w-7xl lg:px-8">
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10 opacity-10 overflow-hidden">
          <svg className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2" aria-hidden="true">
            <defs>
              <pattern id="e4ae0cbf-3ded-4924-8892-d15aa7661a03" width="32" height="32" patternUnits="userSpaceOnUse" x="50%" y="0">
                <path d="M0 0h32v32H0z" fill="url(#a)" />
              </pattern>
              <pattern id="a" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M4 0h4v4H4V0Zm0 4h4v4H4V4Z" className="fill-primary-200" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#e4ae0cbf-3ded-4924-8892-d15aa7661a03)" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Características únicas de <span className="text-primary-600">Gastify</span>
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
            Funcionalidades innovadoras que transforman la gestión de gastos
          </p>
        </motion.div>

        <motion.div 
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const colorClasses = getColorClasses(feature.color);
            
            return (
              <motion.div
                key={feature.name}
                variants={itemVariants}
                className={`relative rounded-2xl p-8 shadow-sm border ${colorClasses.border} overflow-hidden`}
              >
                <div className={`absolute right-4 bottom-4 opacity-10`}>
                  <Icon name={feature.icon} className="h-32 w-32" />
                </div>
                
                <div>
                  <div className={`inline-flex items-center justify-center p-3 rounded-md ${colorClasses.bg}`}>
                    <Icon name={feature.icon} className={`h-6 w-6 ${colorClasses.icon}`} />
                  </div>
                </div>
                
                <h3 className="mt-6 text-xl font-bold text-gray-900 tracking-tight">
                  {feature.name}
                </h3>
                
                <ul className="mt-4 space-y-3 text-base text-gray-500 text-left">
                  {feature.description.map((point, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Icon name="CheckCircleIcon" className={`h-5 w-5 ${colorClasses.icon}`} />
                      </div>
                      <p className="ml-3">{point}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturesSection;
