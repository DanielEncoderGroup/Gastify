import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

interface FooterCTASectionProps {
  setShowLoginModal?: (show: boolean) => void;
}

const FooterCTASection: React.FC<FooterCTASectionProps> = ({ setShowLoginModal }) => {
  return (
    <div className="relative bg-primary-700">
      {/* Decorative pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <svg className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2" aria-hidden="true">
          <defs>
            <pattern id="footer-pattern" width="48" height="48" patternUnits="userSpaceOnUse" x="50%" y="0">
              <path d="M0 0h32v32H0z" fill="url(#pattern-squares)" />
            </pattern>
            <pattern id="pattern-squares" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M6 0h6v6H6V0Zm0 6h6v6H6V6Z" className="fill-primary-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-pattern)" />
        </svg>
      </div>

      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl lg:max-w-4xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Transforma tu gestión de gastos con IA
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Automatiza por completo tus procesos de gastos y recibos con tecnología avanzada de inteligencia artificial que aprende y se adapta a tu negocio.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative rounded-lg"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-300 to-secondary-300 rounded-lg blur-lg opacity-50"></div>
                <Link
                  to="/register"
                  className="relative flex items-center justify-center px-8 py-4 bg-white rounded-lg text-base font-medium text-primary-900 shadow-lg hover:bg-gray-50"
                >
                  Comenzar prueba gratuita
                </Link>
              </motion.div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLoginModal && setShowLoginModal(true)}
                className="flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-primary-800 hover:bg-primary-900 shadow-md"
              >
                <Icon name="ArrowRightOnRectangleIcon" className="mr-2 h-5 w-5" />
                Acceder ahora
              </motion.button>
            </div>
            
            <p className="mt-6 text-base text-primary-200">
              Configuración en menos de 5 minutos. Sin compromisos.
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Footer divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-300/20 to-transparent" />
    </div>
  );
};

export default FooterCTASection;
