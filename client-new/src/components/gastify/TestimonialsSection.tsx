import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      quote: "Reducimos 80% el tiempo de procesamiento con la IA de Gastify, permitiéndonos centrar a nuestro equipo en tareas de mayor valor.",
      name: "Elena Martínez",
      title: "CFO, Empresa Tecnológica",
      imageSrc: "/assets/images/testimonial-1.jpg",
      logoSrc: "/assets/images/logo-tech.png"
    },
    {
      id: 2,
      quote: "La detección de fraudes nos ahorró $50,000 en el primer trimestre. La inversión se recuperó en menos de dos meses.",
      name: "Carlos Rodríguez",
      title: "Director Financiero, Corporación Industrial",
      imageSrc: "/assets/images/testimonial-2.jpg",
      logoSrc: "/assets/images/logo-industry.png"
    },
    {
      id: 3,
      quote: "El compliance automático por región nos permite operar en 8 países con total tranquilidad. Las auditorías ya no son un problema.",
      name: "Sofía Vega",
      title: "Jefa de Operaciones, Empresa Multinacional",
      imageSrc: "/assets/images/testimonial-3.jpg",
      logoSrc: "/assets/images/logo-global.png"
    }
  ];

  return (
    <div id="testimonios" className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-8 lg:max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Lo que nuestros clientes dicen
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Resultados cuantificables obtenidos con las funciones de IA de Gastify
          </p>
        </motion.div>
        
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative bg-white p-6 shadow-xl rounded-2xl border border-gray-100 flex flex-col h-full"
              >
                <div className="relative z-10">
                  <div className="absolute -top-3 -left-3 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Icon name="ChatBubbleLeftRightIcon" className="h-5 w-5 text-primary-600" />
                  </div>
                  
                  <blockquote className="mt-8">
                    <div className="relative text-lg font-medium text-gray-700">
                      <Icon name="QuoteIcon" className="absolute top-0 left-0 transform -translate-x-3 -translate-y-3 h-8 w-8 text-primary-200" />
                      <p className="relative">{testimonial.quote}</p>
                    </div>
                    
                    <footer className="mt-8">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <img
                            className="h-12 w-12 rounded-full"
                            src={testimonial.imageSrc}
                            alt={`${testimonial.name}'s profile picture`}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-base font-medium text-gray-900">{testimonial.name}</div>
                          <div className="text-sm font-medium text-gray-500">{testimonial.title}</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <img 
                          className="h-8"
                          src={testimonial.logoSrc}
                          alt={`${testimonial.name}'s company logo`}
                        />
                      </div>
                    </footer>
                  </blockquote>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute bottom-0 right-0 opacity-10 overflow-hidden h-32 w-32 rounded-full">
                  <svg className="h-full w-full text-primary-200" fill="currentColor" viewBox="0 0 100 100">
                    <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 80c-16.6 0-30-13.4-30-30s13.4-30 30-30 30 13.4 30 30-13.4 30-30 30z"/>
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Additional results section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16"
        >
          <div className="bg-primary-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
              <div className="lg:self-center">
                <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
                  <span className="block">Resultados medibles</span>
                </h3>
                <p className="mt-4 text-lg leading-6 text-primary-200">
                  Nuestros clientes experimentan mejoras significativas tras implementar Gastify
                </p>
                <div className="mt-8 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-12">
                  <div>
                    <p className="text-4xl font-extrabold text-white">85%</p>
                    <p className="mt-2 text-base font-medium text-primary-100">
                      Reducción de errores en la gestión de gastos
                    </p>
                  </div>
                  <div>
                    <p className="text-4xl font-extrabold text-white">5x</p>
                    <p className="mt-2 text-base font-medium text-primary-100">
                      Aumento en velocidad de procesamiento
                    </p>
                  </div>
                  <div>
                    <p className="text-4xl font-extrabold text-white">62%</p>
                    <p className="mt-2 text-base font-medium text-primary-100">
                      Incremento en detección de fraudes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
