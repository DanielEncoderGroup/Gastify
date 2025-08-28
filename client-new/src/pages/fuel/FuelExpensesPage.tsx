import React, { useState, useEffect, useCallback } from 'react';
import { FuelExpense, FuelExpenseFilters, CreateFuelExpenseData } from '@types/fuel';
import { useFuelExpenses } from '@hooks/useFuelExpenses';
import { vehicleConstants } from '@utils/vehicleConstants';
import { fuelCalculations } from '@utils/fuelCalculations';
import { mapUtils } from '@utils/mapUtils';
import FuelExpenseForm from '@components/fuel/FuelExpenseForm';
import { Toast } from '@components/ui/Toast';

/**
 * Página principal para gestión de gastos de combustible
 * Incluye listado, filtros y formulario de creación
 */
export const FuelExpensesPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedExpense, setSelectedExpense] = useState<FuelExpense | null>(null);
  const [filters, setFilters] = useState<FuelExpenseFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const {
    expenses,
    loading,
    error,
    stats,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchStats,
    filterExpensesLocally,
    getLocalTotals
  } = useFuelExpenses();

  // Cargar estadísticas al montar
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Filtrar gastos localmente
  const filteredExpenses = searchTerm 
    ? filterExpensesLocally(searchTerm) 
    : expenses;

  const localTotals = getLocalTotals();

  // Manejar creación de gasto
  const handleCreateExpense = useCallback(async (data: CreateFuelExpenseData) => {
    try {
      const response = await createExpense(data);
      if (response.success) {
        setCurrentView('list');
        setShowToast({
          type: 'success',
          message: 'Gasto de combustible creado exitosamente'
        });
      }
    } catch (error) {
      setShowToast({
        type: 'error',
        message: 'Error al crear el gasto de combustible'
      });
    }
  }, [createExpense]);

  // Manejar eliminación
  const handleDeleteExpense = useCallback(async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto de combustible?')) {
      return;
    }

    try {
      const success = await deleteExpense(id);
      if (success) {
        setShowToast({
          type: 'success',
          message: 'Gasto eliminado exitosamente'
        });
      }
    } catch (error) {
      setShowToast({
        type: 'error',
        message: 'Error al eliminar el gasto'
      });
    }
  }, [deleteExpense]);

  // Componente de estadísticas rápidas
  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-2xl">🛣️</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Total Gastos</p>
            <p className="text-2xl font-semibold text-gray-900">{localTotals.totalExpenses}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <span className="text-2xl">💰</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Monto Total</p>
            <p className="text-2xl font-semibold text-gray-900">
              {fuelCalculations.formatChileanPrice(localTotals.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <span className="text-2xl">📏</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Distancia Total</p>
            <p className="text-2xl font-semibold text-gray-900">
              {mapUtils.formatDistance(localTotals.totalDistance)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <span className="text-2xl">⛽</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Litros Total</p>
            <p className="text-2xl font-semibold text-gray-900">
              {localTotals.totalFuelLiters.toFixed(1)}L
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente de filtros
  const FiltersSection = () => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Búsqueda */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Buscar por propósito, descripción o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtro por estado */}
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            status: e.target.value as FuelExpense['status'] || undefined 
          }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="submitted">Enviado</option>
          <option value="approved">Aprobado</option>
          <option value="rejected">Rechazado</option>
        </select>

        {/* Filtro por tipo de vehículo */}
        <select
          value={filters.vehicleType || ''}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            vehicleType: e.target.value as any || undefined 
          }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los vehículos</option>
          {vehicleConstants.getAllVehicleTypes().map(type => (
            <option key={type} value={type}>
              {vehicleConstants.formatVehicleShortName(type)}
            </option>
          ))}
        </select>

        {/* Botón limpiar filtros */}
        <button
          onClick={() => {
            setFilters({});
            setSearchTerm('');
          }}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );

  // Componente de lista de gastos
  const ExpensesList = () => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Gastos de Combustible</h3>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando gastos...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-red-600 mb-4">Error cargando gastos: {error}</p>
          <button
            onClick={() => fetchExpenses()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="p-8 text-center">
          <span className="text-gray-400 text-4xl block mb-4">🛣️</span>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.keys(filters).length > 0 
              ? 'No se encontraron gastos que coincidan con los filtros'
              : 'No tienes gastos de combustible registrados'
            }
          </p>
          {!searchTerm && Object.keys(filters).length === 0 && (
            <button
              onClick={() => setCurrentView('create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear primer gasto
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredExpenses.map((expense) => (
            <div key={expense.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">
                      {vehicleConstants.getVehicleIcon(expense.vehicleType)}
                    </span>
                    <h4 className="text-sm font-medium text-gray-900">
                      {expense.businessPurpose}
                    </h4>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                      expense.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {expense.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Ruta:</span> {' '}
                      {expense.routeData.origin.address} → {expense.routeData.destination.address}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <span>{mapUtils.formatDistance(expense.routeData.distance)}</span>
                      <span>{fuelCalculations.formatChileanPrice(expense.calculation.totalCost)}</span>
                      <span>{expense.calculation.fuelNeeded.toFixed(1)}L</span>
                      <span>{vehicleConstants.formatVehicleShortName(expense.vehicleType)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Creado: {new Date(expense.createdAt).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedExpense(expense);
                      setCurrentView('edit');
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id!)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Vista principal
  if (currentView === 'create' || currentView === 'edit') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentView === 'create' ? 'Nuevo Gasto de Combustible' : 'Editar Gasto de Combustible'}
            </h1>
            <button
              onClick={() => setCurrentView('list')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Volver al listado
            </button>
          </div>
        </div>

        <FuelExpenseForm
          onSubmit={handleCreateExpense}
          onCancel={() => setCurrentView('list')}
          initialData={selectedExpense ? {
            originCoordinates: selectedExpense.routeData.origin.coordinates,
            destinationCoordinates: selectedExpense.routeData.destination.coordinates,
            originAddress: selectedExpense.routeData.origin.address,
            destinationAddress: selectedExpense.routeData.destination.address,
            vehicleType: selectedExpense.vehicleType,
            fuelType: selectedExpense.fuelType,
            businessPurpose: selectedExpense.businessPurpose,
            description: selectedExpense.description
          } : undefined}
        />

        {showToast && (
          <Toast
            type={showToast.type}
            message={showToast.message}
            onClose={() => setShowToast(null)}
          />
        )}
      </div>
    );
  }

  // Vista de listado
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gastos de Combustible</h1>
          <button
            onClick={() => setCurrentView('create')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="mr-2">+</span>
            Nuevo Gasto
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Gestiona tus gastos de combustible para viajes de trabajo
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <QuickStats />

      {/* Filtros */}
      <FiltersSection />

      {/* Lista de gastos */}
      <ExpensesList />

      {/* Toast notifications */}
      {showToast && (
        <Toast
          type={showToast.type}
          message={showToast.message}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
};

export default FuelExpensesPage;