import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import Card, { StatsCard } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useToast, ToastContainer } from '../../components/ui/Toast';
import { receiptService } from '../../services/receiptService';

interface Receipt {
  id: string;
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  category: string;
  status?: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface ReceiptStats {
  totalReceipts: number;
  totalAmount: number;
  enRevision: number;
  aceptadas: number;
  rechazadas: number;
}

const ReceiptsListPage: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stats, setStats] = useState<ReceiptStats>({
    totalReceipts: 0,
    totalAmount: 0,
    enRevision: 0,
    aceptadas: 0,
    rechazadas: 0
  });
  const toast = useToast();

  const categories = ['Comida', 'Alojamiento', 'Transporte', 'Material Oficina', 'Entretenimiento', 'Salud'];

  useEffect(() => {
    const loadReceipts = async () => {
      setLoading(true);
      try {
        // Cargar recibos reales del backend
        const backendReceipts = await receiptService.getReceipts();
        
        // Convertir los recibos del backend al formato de la interfaz local
        const formattedReceipts: Receipt[] = backendReceipts.map(receipt => ({
          id: receipt.id,
          companyName: receipt.companyName,
          folioNumber: receipt.folioNumber,
          date: receipt.date,
          description: receipt.description,
          totalAmount: receipt.totalAmount,
          category: receipt.category,
          status: 'pending', // Por defecto, ya que el backend no maneja estados de aprobación aún
          createdAt: receipt.createdAt,
          updatedAt: receipt.updatedAt
        }));
        
        setReceipts(formattedReceipts);
        setFilteredReceipts(formattedReceipts);
        
        // Cargar estadísticas reales del backend
        try {
          const backendStats = await receiptService.getReceiptStats();
          setStats({
            totalReceipts: backendStats.totalReceipts,
            totalAmount: backendStats.totalAmount,
            enRevision: backendStats.enRevision,
            aceptadas: backendStats.aceptadas,
            rechazadas: backendStats.rechazadas
          });
        } catch (statsError) {
          console.warn('Error loading stats, using calculated values:', statsError);
          // Fallback: calcular estadísticas localmente
          const total = formattedReceipts.reduce((sum, receipt) => sum + receipt.totalAmount, 0);
          setStats({
            totalReceipts: formattedReceipts.length,
            totalAmount: total,
            enRevision: formattedReceipts.filter(r => r.status === 'pending').length,
            aceptadas: formattedReceipts.filter(r => r.status === 'approved').length,
            rechazadas: formattedReceipts.filter(r => r.status === 'rejected').length
          });
        }
        
      } catch (error) {
        console.error('Error loading receipts:', error);
        toast.error('Error al cargar los recibos. Intenta nuevamente.');
        setReceipts([]);
        setFilteredReceipts([]);
      } finally {
        setLoading(false);
      }
    };

    loadReceipts();
  }, []); // ✅ FIXED: Removed toast from dependencies to prevent infinite loop

  // Filtrar recibos
  useEffect(() => {
    let filtered = receipts;
    
    if (searchTerm) {
      filtered = filtered.filter(receipt => 
        receipt.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(receipt => receipt.category === selectedCategory);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(receipt => receipt.status === selectedStatus);
    }
    
    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, selectedCategory, selectedStatus]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Comida': 'utensils',
      'Alojamiento': 'building-office',
      'Transporte': 'truck',
      'Material Oficina': 'document-text',
      'Entretenimiento': 'film',
      'Salud': 'heart'
    };
    return icons[category] || 'document';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner withLogo size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} />
      
      {/* Header Premium con Estadísticas */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Título y Acción Principal */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Recibos</h1>
              <p className="mt-2 text-lg text-gray-600">
                Gestiona tus gastos con inteligencia artificial
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                variant="primary" 
                size="lg" 
                to="/app/receipts/new"
                leftIcon={<Icon name="PlusIcon" className="h-5 w-5" />}
                className="shadow-lg"
              >
                Nuevo Recibo
              </Button>
            </div>
          </div>

          {/* KPIs Visuales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Recibos"
              value={stats.totalReceipts.toString()}
              change="+12% vs mes anterior"
              changeType="positive"
              icon={<Icon name="DocumentTextIcon" className="h-6 w-6" />}
            />
            <StatsCard
              title="Monto Total"
              value={`$${stats.totalAmount.toLocaleString('es-CL')}`}
              change="+8.2% vs mes anterior"
              changeType="positive"
              icon={<Icon name="CurrencyDollarIcon" className="h-6 w-6" />}
            />
            <StatsCard
              title="En Revisión"
              value={stats.enRevision.toString()}
              change="-2 vs semana anterior"
              changeType="positive"
              icon={<Icon name="ClockIcon" className="h-6 w-6" />}
            />
            <StatsCard
              title="Aprobadas"
              value={stats.aceptadas.toString()}
              change="+15.3% vs promedio"
              changeType="positive"
              icon={<Icon name="ArrowTrendingUpIcon" className="h-6 w-6" />}
            />
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Búsqueda */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="MagnifyingGlassIcon" className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por proveedor o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Filtros Pill */}
            <div className="flex flex-wrap gap-2">
              {/* Filtro de Categoría */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Filtro de Estado */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
              >
                <option value="all">Todos los estados</option>
                <option value="approved">Aprobados</option>
                <option value="pending">Pendientes</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredReceipts.length === 0 ? (
          /* Empty State */
          <Card className="text-center py-16">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Icon name="DocumentTextIcon" className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' 
                ? 'No se encontraron recibos' 
                : 'No tienes recibos aún'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Intenta ajustar tus filtros de búsqueda'
                : 'Comienza subiendo tu primer recibo para que la IA lo procese'
              }
            </p>
            <Button 
              variant="primary" 
              to="/app/receipts/new"
              leftIcon={<Icon name="PlusIcon" className="h-5 w-5" />}
            >
              Subir Primer Recibo
            </Button>
          </Card>
        ) : (
          /* Grid de Recibos */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReceipts.map((receipt, index) => (
              <Card 
                key={receipt.id} 
                hover 
                className={`transform transition-all duration-300 ${
                  index % 3 === 0 ? 'animate-fade-in-up' : 
                  index % 3 === 1 ? 'animate-fade-in-up animation-delay-100' : 
                  'animate-fade-in-up animation-delay-200'
                }`}
                onClick={() => toast.info('Funcionalidad próximamente', 'Detalles del recibo')}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Icon name={getCategoryIcon(receipt.category)} className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {receipt.companyName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {receipt.category}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(receipt.status || 'pending')}
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ${receipt.totalAmount.toLocaleString('es-CL')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(receipt.date).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {receipt.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {receipt.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Button variant="ghost" size="sm">
                    <Icon name="EyeIcon" className="h-4 w-4 mr-1" />
                    Ver detalles
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Icon name="ArrowDownTrayIcon" className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación Moderna */}
        {filteredReceipts.length > 0 && (
          <div className="mt-12 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{filteredReceipts.length}</span> de{' '}
              <span className="font-medium">{receipts.length}</span> recibos
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                <Icon name="ChevronLeftIcon" className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center space-x-1">
                <button className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md">
                  1
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  2
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  3
                </button>
              </div>
              <Button variant="outline" size="sm">
                Siguiente
                <Icon name="ChevronRightIcon" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        to="/app/receipts/new"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        <Icon name="PlusIcon" className="h-6 w-6" />
      </Link>
    </div>
  );
};

export default ReceiptsListPage;
