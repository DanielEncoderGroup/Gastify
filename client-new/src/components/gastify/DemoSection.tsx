import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

const DemoSection: React.FC = () => {
  const [demoState, setDemoState] = useState<'initial' | 'uploading' | 'processing' | 'complete'>('initial');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Simulación del proceso de IA para categorización de recibos
  const handleDemoStart = () => {
    setDemoState('uploading');
    setTimeout(() => {
      setDemoState('processing');
      setReceiptImage('/assets/images/sample-receipt.jpg');
      
      setTimeout(() => {
        setDemoState('complete');
      }, 2500);
    }, 1500);
  };

  // Reiniciar la demo
  const handleReset = () => {
    setDemoState('initial');
    setReceiptImage(null);
  };

  // Categorías detectadas (demo)
  const detectedCategories = [
    { name: 'Restaurante', confidence: 97, iconName: 'BuildingStorefrontIcon' },
    { name: 'Comida', confidence: 92, iconName: 'CakeIcon' },
    { name: 'Viaje de negocios', confidence: 84, iconName: 'BriefcaseIcon' }
  ];

  // Información extraída del recibo (demo)
  const extractedInfo = {
    date: '15/07/2025',
    amount: '$235.50',
    vendor: 'Restaurante El Gourmet',
    tax: '$37.68',
    location: 'Madrid, España'
  };

  return (
    <div id="demo" className="relative py-16 bg-gray-50 sm:py-24">
      <div className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Prueba la IA de categorización
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
            Experimenta cómo nuestra IA identifica automáticamente la información y categoriza tus gastos
          </p>
        </motion.div>

        <div className="mt-12 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Lado izquierdo: Upload y visualización de recibos */}
            <div className="p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-gray-200">
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Icon name="DocumentTextIcon" className="mr-2 h-5 w-5 text-primary-600" />
                  Recibo
                </h3>

                {demoState === 'initial' && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex justify-center">
                        <div className="mx-auto rounded-full p-3 bg-primary-100">
                          <Icon name="ArrowUpTrayIcon" className="h-10 w-10 text-primary-600" />
                        </div>
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Sube un recibo para analizar</h3>
                      <p className="mt-2 text-gray-500 text-sm">Sube una imagen o usa nuestro ejemplo para probar la IA</p>
                      <div className="mt-6">
                        <button
                          onClick={handleDemoStart}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Usar recibo de ejemplo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {demoState === 'uploading' && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-lg text-gray-600">Subiendo recibo...</p>
                  </div>
                )}

                {(demoState === 'processing' || demoState === 'complete') && receiptImage && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 relative overflow-hidden rounded-lg">
                      <img 
                        src={receiptImage} 
                        alt="Recibo de ejemplo" 
                        className="w-full h-auto object-contain shadow-lg rounded-lg" 
                      />
                      
                      {demoState === 'processing' && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                          <div className="text-center p-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="mt-4 text-lg text-gray-900 font-medium">Procesando con IA...</p>
                            <p className="text-sm text-gray-500 mt-2">Extrayendo información y categorizando</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {demoState === 'complete' && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={handleReset}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <Icon name="ArrowPathIcon" className="h-4 w-4 mr-2" />
                          Probar con otro recibo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lado derecho: Resultados de la IA */}
            <div className="p-6 sm:p-10 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Icon name="CpuChipIcon" className="mr-2 h-5 w-5 text-primary-600" />
                Resultados de la IA
              </h3>

              {demoState === 'initial' && (
                <div className="py-20 text-center text-gray-500">
                  <Icon name="DocumentMagnifyingGlassIcon" className="h-16 w-16 mx-auto text-gray-300" />
                  <p className="mt-4">Los resultados del análisis aparecerán aquí</p>
                </div>
              )}

              {demoState === 'uploading' && (
                <div className="py-20 text-center text-gray-500">
                  <p>Preparando el análisis...</p>
                </div>
              )}

              {demoState === 'processing' && (
                <div className="space-y-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div className="h-8 bg-gray-200 rounded"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              )}

              {demoState === 'complete' && (
                <div>
                  <div className="mb-8">
                    <h4 className="font-medium text-gray-700 mb-2">Información extraída</h4>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                        <div className="col-span-1">
                          <dt className="font-medium text-gray-500">Fecha</dt>
                          <dd className="mt-1 text-gray-900">{extractedInfo.date}</dd>
                        </div>
                        <div className="col-span-1">
                          <dt className="font-medium text-gray-500">Total</dt>
                          <dd className="mt-1 text-gray-900">{extractedInfo.amount}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="font-medium text-gray-500">Proveedor</dt>
                          <dd className="mt-1 text-gray-900">{extractedInfo.vendor}</dd>
                        </div>
                        <div className="col-span-1">
                          <dt className="font-medium text-gray-500">Impuesto</dt>
                          <dd className="mt-1 text-gray-900">{extractedInfo.tax}</dd>
                        </div>
                        <div className="col-span-1">
                          <dt className="font-medium text-gray-500">Ubicación</dt>
                          <dd className="mt-1 text-gray-900">{extractedInfo.location}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Categorización IA</h4>
                    <div className="space-y-3">
                      {detectedCategories.map((category, index) => (
                        <div 
                          key={index} 
                          className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center"
                        >
                          <div className="flex-shrink-0 mr-3">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <Icon name={category.iconName} className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{category.name}</p>
                            <div className="mt-1 flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full" 
                                  style={{ width: `${category.confidence}%` }}
                                ></div>
                              </div>
                              <span className="ml-3 text-xs text-gray-500">{category.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoSection;
