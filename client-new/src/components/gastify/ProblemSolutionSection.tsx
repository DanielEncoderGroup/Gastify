import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

const ProblemSolutionSection: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
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

  const comparisonItems = [
    {
      traditional: { text: "Procesos lentos y manuales", icon: "ClockIcon" },
      gastify: { text: "Automatización completa con IA", icon: "CpuChipIcon" }
    },
    {
      traditional: { text: "Errores humanos frecuentes", icon: "ExclamationCircleIcon" },
      gastify: { text: "Precisión garantizada con OCR avanzado", icon: "CheckCircleIcon" }
    },
    {
      traditional: { text: "Reportes atrasados", icon: "CalendarIcon" },
      gastify: { text: "Reportes en tiempo real", icon: "ChartBarIcon" }
    },
    {
      traditional: { text: "Fraude no detectado", icon: "ShieldExclamationIcon" },
      gastify: { text: "Detección proactiva de fraudes", icon: "ShieldCheckIcon" }
    },
    {
      traditional: { text: "Compliance inconsistente", icon: "DocumentTextIcon" },
      gastify: { text: "Compliance automático por región", icon: "GlobeAmericasIcon" }
    }
  ];

  return (
    <div id="problema-solucion" className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            El problema de los gastos corporativos tradicionales
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-xl text-gray-500 sm:mt-4">
            Los métodos convencionales están obsoletos, consumiendo tiempo valioso
          </p>
        </motion.div>

        <motion.div 
          className="mt-12 grid grid-cols-1 gap-y-8 lg:gap-x-16 lg:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Método tradicional */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="p-3 rounded-full bg-red-100">
                <Icon name="XMarkIcon" className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="ml-3 text-2xl font-bold text-gray-900">El método tradicional</h3>
            </div>
            
            <div className="mt-8 space-y-6">
              {comparisonItems.map((item, index) => (
                <motion.div 
                  key={`traditional-${index}`}
                  className="flex items-start"
                  variants={itemVariants}
                >
                  <div className="mt-1 flex-shrink-0">
                    <Icon name={item.traditional.icon} className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-lg font-medium text-gray-900">{item.traditional.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* La solución Gastify */}
          <div className="bg-primary-50 rounded-2xl p-8 border border-primary-100 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute right-0 bottom-0 opacity-10">
              <Icon name="ReceiptRefundIcon" className="h-48 w-48 text-primary-300" />
            </div>
            
            <div className="flex items-center justify-center">
              <div className="p-3 rounded-full bg-primary-100">
                <Icon name="CheckIcon" className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="ml-3 text-2xl font-bold text-primary-900">La solución Gastify</h3>
            </div>
            
            <div className="mt-8 space-y-6 relative z-10">
              {comparisonItems.map((item, index) => (
                <motion.div 
                  key={`gastify-${index}`}
                  className="flex items-start"
                  variants={itemVariants}
                >
                  <div className="mt-1 flex-shrink-0">
                    <Icon name={item.gastify.icon} className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-lg font-medium text-gray-900">{item.gastify.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProblemSolutionSection;
