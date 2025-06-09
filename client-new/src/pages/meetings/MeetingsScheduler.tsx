import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  SparklesIcon,
  RocketLaunchIcon,
  PlusIcon,
  CalendarIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import HeaderActions from '../../components/layout/HeaderActions';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  organizer: string;
  attendees: string[];
  status: string;
  projectId?: string;
  projectName?: string;
}

const MeetingsScheduler: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setMeetings([
        {
          id: '1',
          title: 'Reunión de inicio de proyecto ERP',
          date: '2023-05-25',
          time: '10:00',
          duration: 60,
          location: 'Sala de conferencias A',
          organizer: 'Carlos Rodríguez',
          attendees: ['Ana Gómez', 'Miguel Sánchez', 'Laura Torres'],
          status: 'scheduled',
          projectId: '1',
          projectName: 'Implementación ERP'
        },
        {
          id: '2',
          title: 'Revisión de avance mensual',
          date: '2023-05-30',
          time: '14:30',
          duration: 90,
          location: 'Sala de conferencias B',
          organizer: 'Carlos Rodríguez',
          attendees: ['Ana Gómez', 'Miguel Sánchez', 'Laura Torres', 'Roberto Díaz'],
          status: 'scheduled',
          projectId: '1',
          projectName: 'Implementación ERP'
        },
        {
          id: '3',
          title: 'Planificación de migración a la nube',
          date: '2023-06-05',
          time: '11:00',
          duration: 120,
          location: 'Sala de conferencias A',
          organizer: 'Roberto Díaz',
          attendees: ['Ana Gómez', 'Miguel Sánchez', 'Laura Torres'],
          status: 'scheduled',
          projectId: '2',
          projectName: 'Migración a la nube'
        }
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Función para crear nueva reunión (placeholder)
  const handleNewMeeting = () => {
    console.log('Crear nueva reunión');
    // Aquí iría la lógica para crear una nueva reunión
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mb-6 shadow-lg animate-pulse">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reuniones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Superior */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Title and icon */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                <CalendarDaysIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
                  Gestión de Reuniones
                </h1>
                <p className="text-gray-600 mt-1">
                  Programa y coordina reuniones con tu equipo
                </p>
              </div>
            </div>

            {/* Right side - Actions and Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Nuevo Meeting Button */}
              <button
                onClick={handleNewMeeting}
                className="inline-flex items-center px-6 py-3 text-white font-medium bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nueva Reunión
              </button>
              
              {/* Header Actions */}
              <HeaderActions />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Vista conmutador */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 mb-8">
          <div className="border-b border-gray-200/50">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                className={`${
                  view === 'list'
                    ? 'border-green-500 text-green-600 bg-green-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
                onClick={() => setView('list')}
              >
                <ListBulletIcon className="w-5 h-5" />
                <span>Lista</span>
              </button>
              <button
                className={`${
                  view === 'calendar'
                    ? 'border-green-500 text-green-600 bg-green-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
                onClick={() => setView('calendar')}
              >
                <CalendarIcon className="w-5 h-5" />
                <span>Calendario</span>
              </button>
            </nav>
          </div>
        </div>

        {view === 'list' ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 overflow-hidden">
            <div className="divide-y divide-gray-200/50">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="group p-6 hover:bg-white/80 transition-all duration-200 cursor-pointer"
                  onClick={() => console.log(`Ver reunión ${meeting.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icono */}
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                        <CalendarDaysIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Contenido principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-200 truncate">
                            {meeting.title}
                          </h3>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 flex-shrink-0 ml-4">
                            <RocketLaunchIcon className="w-3 h-3 mr-1" />
                            {meeting.status === 'scheduled'
                              ? 'Programada'
                              : meeting.status === 'completed'
                              ? 'Completada'
                              : 'Cancelada'}
                          </span>
                        </div>
                        
                        {/* Detalles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>
                              {new Date(meeting.date).toLocaleDateString()} a las {meeting.time}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>{meeting.duration} minutos</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{meeting.location}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <UserGroupIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>
                              {meeting.organizer} ({meeting.attendees.length} participantes)
                            </span>
                          </div>
                          
                          {meeting.projectName && (
                            <div className="flex items-center space-x-2 sm:col-span-2">
                              <RocketLaunchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate font-medium text-blue-600">{meeting.projectName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-8">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl mb-6">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Vista de calendario en desarrollo
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Próximamente podrás ver tus reuniones en formato de calendario interactivo.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer Informativo */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 mt-8 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-gray-800">¿Necesitas ayuda con las reuniones?</span>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto mb-4">
              Organiza y coordina eficientemente todas tus reuniones de proyecto desde un solo lugar.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
              <div>📧 Soporte: meetings@encodergroup.cl</div>
              <div className="hidden sm:block">|</div>
              <div>📞 Teléfono: +1 (555) 123-4567</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MeetingsScheduler;