import React, { useState, useEffect } from 'react';

interface Expense {
  id: number;
  image: string;
  amount: string;
  vendor: string;
  date: string;
  category: string;
  confidence: string;
  color: string;
}

const GastifyIADemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const expenses: Expense[] = [
    {
      id: 1,
      image: "🧾",
      amount: "$45.50",
      vendor: "Starbucks Coffee",
      date: "29 Jul 2025",
      category: "Comidas y Bebidas",
      confidence: "95%",
      color: "bg-green-100 text-green-800"
    },
    {
      id: 2,
      image: "⛽",
      amount: "$85.00",
      vendor: "Shell Gas Station",
      date: "28 Jul 2025",
      category: "Combustible",
      confidence: "98%",
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: 3,
      image: "🏨",
      amount: "$120.00",
      vendor: "Holiday Inn",
      date: "27 Jul 2025",
      category: "Alojamiento",
      confidence: "92%",
      color: "bg-purple-100 text-purple-800"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep < expenses.length) {
        setIsProcessing(true);
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
          setIsProcessing(false);
        }, 1500);
      } else {
        // Reset animation
        setTimeout(() => {
          setCurrentStep(0);
        }, 3000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentStep, expenses.length]);

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">Gastify IA</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span className="text-green-100 text-sm">Procesando</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 dark:bg-gray-800">
        <div className="text-center mb-6">
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 mb-3">
            <span className="text-2xl mr-2">🤖</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">IA categorizando gastos...</span>
          </div>
        </div>

        {/* Expense List */}
        <div className="space-y-4">
          {expenses.map((expense, index) => (
            <div
              key={expense.id}
              className={`border rounded-lg p-4 transition-all duration-500 ${
                index < currentStep 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : index === currentStep && isProcessing
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 animate-pulse'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{expense.image}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{expense.vendor}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{expense.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{expense.amount}</div>
                  {index < currentStep && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expense.color}`}>
                        {expense.category}
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">{expense.confidence}</span>
                    </div>
                  )}
                  {index === currentStep && isProcessing && (
                    <div className="mt-1">
                      <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        {currentStep === expenses.length && (
          <div className="mt-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">3</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Procesados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">95%</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Precisión</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">2s</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Tiempo</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GastifyIADemo;
