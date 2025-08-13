import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import Card, { StatsCard } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useToast, ToastContainer } from '../../components/ui/Toast';
import { receiptService } from '../../services/receiptService';
import { useAuth } from '../../contexts/AuthContext';

interface Receipt {
  id: string;
  companyName: string;
  totalAmount: number;
  date: string;
  category?: string;
  status: 'en_revision' | 'aceptada' | 'rechazada';
  description?: string;
  imageUrl?: string;
  folioNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ReceiptStats {
  totalReceipts: number;
  totalAmount: number;
  enRevision: number;
  aceptadas: number;
  rechazadas: number;
}

const ReceiptsListPageNew: React.FC = () => {
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
  const { user } = useAuth();
  const toast = useToast();

  const categories = ['Supermercado', 'Combustible', 'Farmacia', 'Restaurante', 'Retail', 'Salud', 'Transporte', 'Otros'];

  // Cargar datos reales del backend
  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar recibos del usuario
      const receiptsData = await receiptService.getReceipts();
      console.log('Recibos cargados:', receiptsData);
      
      // Transformar datos del backend al formato del frontend
      const transformedReceipts: Receipt[] = receiptsData.map((receipt: any) => ({
        id: receipt.id || receipt._id,
        companyName: receipt.companyName,
        totalAmount: receipt.totalAmount,
        date: receipt.date,
        category: receipt.category || 'Otros',
        status: receipt.status || 'en_revision',
        description: receipt.description,
        imageUrl: receipt.imageUrl,
        folioNumber: receipt.folioNumber,
        createdAt: receipt.createdAt,
        updatedAt: receipt.updatedAt
      }));
      
      setReceipts(transformedReceipts);
      setFilteredReceipts(transformedReceipts);
      
      // Cargar estadísticas
      try {
        const statsData = await receiptService.getReceiptStats();
        setStats({
          totalReceipts: statsData.totalReceipts || transformedReceipts.length,
          totalAmount: statsData.totalAmount || transformedReceipts.reduce((sum, r) => sum + r.totalAmount, 0),
          enRevision: statsData.enRevision || transformedReceipts.filter(r => r.status === 'en_revision').length,
          aceptadas: statsData.aceptadas || transformedReceipts.filter(r => r.status === 'aceptada').length,
          rechazadas: statsData.rechazadas || transformedReceipts.filter(r => r.status === 'rechazada').length
        });
      } catch (statsError) {
        console.warn('Error cargando estadísticas, usando datos locales:', statsError);
        // Calcular estadísticas localmente si falla el endpoint
        setStats({
          totalReceipts: transformedReceipts.length,
          totalAmount: transformedReceipts.reduce((sum, r) => sum + r.totalAmount, 0),
          enRevision: transformedReceipts.filter(r => r.status === 'en_revision').length,
          aceptadas: transformedReceipts.filter(r => r.status === 'aceptada').length,
          rechazadas: transformedReceipts.filter(r => r.status === 'rechazada').length
        });
      }
      
    } catch (error) {
      console.error('Error cargando recibos:', error);
      toast.error('Error', 'No se pudieron cargar los recibos');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      loadReceipts();
    }
  }, [user, loadReceipts]);

  // Filtrar recibos
  useEffect(() => {
    let filtered = receipts;
    
    if (searchTerm) {
      filtered = filtered.filter(receipt => 
        receipt.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.folioNumber?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatusBadge = (status: 'en_revision' | 'aceptada' | 'rechazada') => {
    const statusConfig = {
      en_revision: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Revisión' },
      aceptada: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aceptada' },
      rechazada: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada' }
    };
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Supermercado': 'shopping-cart',
      'Combustible': 'truck',
      'Farmacia': 'heart',
      'Restaurante': 'utensils',
      'Retail': 'shopping-bag',
      'Salud': 'heart',
      'Transporte': 'truck',
      'Otros': 'document'
    };
    return icons[category] || 'document';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" withLogo />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Recibos</h1>
              <p className="text-gray-600 mt-1">Gestiona tus gastos con inteligencia artificial</p>
            </div>
            <Link to="/app/receipts/upload">
              <Button variant="primary" className="flex items-center gap-2">
                <Icon name="plus" className="w-5 h-5" />
                Nuevo Recibo
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Recibos"
            value={stats.totalReceipts.toString()}
            change="+2.5% vs mes anterior"
            changeType="positive"
            icon={<span>📄</span>}
          />
          <StatsCard
            title="Monto Total"
            value={formatCurrency(stats.totalAmount)}
            change="+4.2% vs mes anterior"
            changeType="positive"
            icon={<span>💰</span>}
          />
          <StatsCard
            title="Pendientes"
            value={stats.enRevision.toString()}
            change="En revisión"
            changeType="neutral"
            icon={<span>⏰</span>}
          />
          <StatsCard
            title="Este Mes"
            value={formatCurrency(stats.totalAmount)}
            change="+12.3% vs promedio"
            changeType="positive"
            icon={<span>📊</span>}
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por proveedor o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todos los estados</option>
                <option value="en_revision">En Revisión</option>
                <option value="aceptada">Aceptada</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Receipts Grid */}
        {filteredReceipts.length === 0 ? (
          <Card className="text-center py-12">
            <Icon name="document-text" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recibos</h3>
            <p className="text-gray-500 mb-6">
              {receipts.length === 0 
                ? 'Comienza subiendo tu primer recibo con IA'
                : 'No se encontraron recibos con los filtros aplicados'
              }
            </p>
            <Link to="/app/receipts/upload">
              <Button variant="primary">
                Subir Primer Recibo
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReceipts.map((receipt) => (
              <Card key={receipt.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Icon name={getCategoryIcon(receipt.category || 'Otros')} className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{receipt.companyName}</h3>
                      <p className="text-sm text-gray-500">{formatDate(receipt.date)}</p>
                    </div>
                  </div>
                  {getStatusBadge(receipt.status)}
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatCurrency(receipt.totalAmount)}
                  </div>
                  {receipt.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{receipt.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Icon name="eye" className="w-4 h-4" />
                      Ver detalles
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="download" className="w-4 h-4" />
                      Descargar
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredReceipts.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Anterior</Button>
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-md">1</span>
              <Button variant="outline" size="sm">Siguiente</Button>
            </div>
          </div>
        )}
      </div>
      <ToastContainer toasts={[]} />
    </div>
  );
};

export default ReceiptsListPageNew;
