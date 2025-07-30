import React from 'react';
import { motion, Variants, easeOut } from 'framer-motion';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import GastifyIADemo from './GastifyIADemo';

interface HeroSectionProps {
  setShowLoginModal: (show: boolean) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ setShowLoginModal }) => {
  // Variantes para animaciones
  const titleVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: easeOut }
    }
  };

  const subtitleVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 0.3, ease: easeOut }
    }
  };

  const buttonVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.6, ease: easeOut }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.3 }
    }
  };

  const imageVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, delay: 0.4 }
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24">
      {/* Elementos decorativos */}
      <div className="hidden sm:block sm:absolute sm:inset-y-0 sm:h-full sm:w-full">
        <div className="relative h-full max-w-7xl mx-auto">
          <svg
            className="absolute right-full transform translate-y-1/4 translate-x-1/4 lg:translate-x-1/2"
            width="404"
            height="784"
            fill="none"
            viewBox="0 0 404 784"
          >
            <defs>
              <pattern
                id="f210dbf6-a58d-4871-961e-36d5016a0f49"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="4" height="4" className="text-primary-200" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="784" fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)" />
          </svg>
          <svg
            className="absolute left-full transform -translate-y-3/4 -translate-x-1/4 md:-translate-y-1/2 lg:-translate-x-1/2"
            width="404"
            height="784"
            fill="none"
            viewBox="0 0 404 784"
          >
            <defs>
              <pattern
                id="5d0dd344-b041-4d26-bec4-8d33ea57ec9b"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="4" height="4" className="text-secondary-200" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="784" fill="url(#5d0dd344-b041-4d26-bec4-8d33ea57ec9b)" />
          </svg>
        </div>
      </div>

      <div className="relative pt-6 pb-12 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <div className="text-center lg:text-left md:max-w-2xl md:mx-auto lg:mx-0">
                <motion.h1
                  initial="hidden"
                  animate="visible"
                  variants={titleVariants}
                  className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
                >
                  <span className="block">Gestión inteligente de gastos empresariales con</span>{' '}
                  <span className="block text-primary-600">IA</span>
                </motion.h1>
                <motion.p
                  initial="hidden"
                  animate="visible"
                  variants={subtitleVariants}
                  className="mt-3 max-w-md mx-auto lg:mx-0 text-lg text-gray-500 sm:text-xl md:mt-5"
                >
                  Automatiza completamente tus procesos de gastos con tecnología avanzada
                </motion.p>
                <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={buttonVariants}
                    whileHover="hover"
                    className="rounded-md shadow"
                  >
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                    >
                      Comienza a gestionar tus gastos
                    </Link>
                  </motion.div>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={buttonVariants}
                    whileHover="hover"
                    className="mt-3 sm:mt-0 sm:ml-3"
                  >
                    <button
                      onClick={() => {
                        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white border-primary-200 hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                    >
                      Ver demo de IA
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={imageVariants}
                className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md"
              >
                <div className="relative block w-full rounded-lg overflow-hidden">
                  {/* Componente GastifyIADemo integrado */}
                  <div className="w-full">
                    <GastifyIADemo />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
