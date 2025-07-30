import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

const ComparisonTable: React.FC = () => {
  const features = [
    { name: 'OCR multiidioma avanzado', gastify: true },
    { name: 'Categorización automática por IA', gastify: true },
    { name: 'Geolocalización de gastos', gastify: true },
    { name: 'Workflows de aprobación adaptativos', gastify: true },
    { name: 'Analytics predictivos de gastos', gastify: true },
    { name: 'Compliance automático por región', gastify: true },
    { name: 'Detección avanzada de fraudes', gastify: true },
    { name: 'Reconciliación automática con tarjetas', gastify: true },
    { name: 'Aplicación móvil offline', gastify: true },
    { name: 'Extracción de líneas de detalle', gastify: true },
    { name: 'Integración con ERP', gastify: true },
  ];

  const competitors = [
    { name: 'Soluciones tradicionales', features: [false, false, false, false, false, false, false, false, false, false, true] },
    { name: 'Competidor A', features: [true, false, false, true, false, false, false, true, true, false, true] },
    { name: 'Competidor B', features: [true, true, false, false, false, false, true, true, false, false, true] },
  ];

  return (
    <div id="comparativa" className="relative py-16 bg-gray-50 overflow-hidden sm:py-24">
      <div className="relative">
        <div className="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:gap-24 lg:items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto max-w-md px-6 sm:max-w-3xl lg:px-0"
          >
            <div className="pt-6">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                Gastify vs. Competencia
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Descubre por qué Gastify supera a los métodos tradicionales y otras soluciones del mercado
              </p>
              
              <div className="mt-6 bg-gradient-to-r from-primary-600 to-secondary-600 p-px rounded-2xl shadow-xl">
                <div className="rounded-2xl bg-white p-6">
                  <div className="flex items-center">
                    <Icon name="TrophyIcon" className="h-12 w-12 text-yellow-500" />
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        Único en el mercado con IA avanzada
                      </h3>
                      <p className="text-base text-gray-500">
                        Gastify es la única solución que combina OCR avanzado, IA y geolocalización para una gestión de gastos totalmente automatizada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          <div className="relative mt-12 sm:mx-auto sm:max-w-lg lg:mt-0 lg:max-w-none lg:mx-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-x-auto rounded-lg shadow-lg border border-gray-200"
            >
              <table className="w-full text-sm text-left text-gray-800">
                <thead className="text-xs bg-primary-50 text-gray-700">
                  <tr className="border-b">
                    <th scope="col" className="px-6 py-4 w-1/3">
                      Características
                    </th>
                    <th scope="col" className="px-3 py-4 text-center bg-primary-100">
                      <div className="flex items-center justify-center flex-col">
                        <Icon name="ReceiptRefundIcon" className="h-6 w-6 text-primary-600 mb-1" />
                        <span className="font-semibold text-primary-900">Gastify</span>
                      </div>
                    </th>
                    {competitors.map((competitor, idx) => (
                      <th key={idx} scope="col" className="px-3 py-4 text-center">
                        <span className="font-medium">{competitor.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 font-medium">{feature.name}</td>
                      <td className="px-3 py-4 text-center bg-primary-50">
                        {feature.gastify ? (
                          <div className="flex justify-center">
                            <Icon name="CheckIcon" className="h-5 w-5 text-primary-600" />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <Icon name="XMarkIcon" className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      {competitors.map((competitor, compIdx) => (
                        <td key={compIdx} className="px-3 py-4 text-center">
                          {competitor.features[idx] ? (
                            <div className="flex justify-center">
                              <Icon name="CheckIcon" className="h-5 w-5 text-gray-600" />
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <Icon name="XMarkIcon" className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
