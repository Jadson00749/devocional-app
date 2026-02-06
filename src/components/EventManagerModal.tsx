import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Plus, Calendar, Trash2, SquarePen, AlertCircle, X } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import { Event } from '../types';
import CreateEventModal from './CreateEventModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { toast } from 'sonner';

interface EventManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EventManagerModal: React.FC<EventManagerModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  
  // Custom Delete Confirmation State
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await databaseService.fetchEvents();
      setEvents(data);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const handleEdit = (event: Event) => {
    setEventToEdit(event);
    setShowCreateModal(true);
  };

  const handleCreateNew = () => {
    setEventToEdit(null);
    setShowCreateModal(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);
    try {
      const success = await databaseService.deleteEvent(eventToDelete.id);
      if (success) {
        toast.success('Evento excluído com sucesso');
        setEventToDelete(null);
        fetchEvents();
      } else {
        toast.error('Erro ao excluir evento');
      }
    } catch (error) {
      toast.error('Erro ao excluir evento');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[150] flex items-center justify-end animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-lg h-full bg-slate-50 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col">
          {/* Header */}
          <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center gap-3 shrink-0 z-10">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2"
            >
              <ArrowLeft size={22} className="text-slate-700" />
            </button>
            <h2 className="text-lg font-bold text-slate-800">Gerenciar Eventos</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 pb-20">
            {/* Action Bar */}
            <button
              onClick={handleCreateNew}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-6"
            >
              <Plus size={20} strokeWidth={3} />
              <span>Criar Evento</span>
            </button>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                EVENTOS CRIADOS ({events.length})
              </h3>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Carregando eventos...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar size={32} className="text-slate-300" />
                </div>
                <h4 className="text-slate-800 font-semibold mb-1">Nenhum evento criado</h4>
                <p className="text-slate-500 text-sm">
                  Crie eventos para influenciar a palavra do dia e engajar os usuários.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-800">{event.theme}</h4>
                        <span className="bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Ativo
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEdit(event)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <SquarePen size={18} />
                        </button>
                        <button 
                          onClick={() => setEventToDelete(event)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 text-base mb-4 leading-relaxed line-clamp-2">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 py-2 px-3 rounded-lg">
                      <span>{formatDate(event.start_date)}</span>
                      <span className="text-slate-300">→</span>
                      <span>{formatDate(event.end_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEventToEdit(null);
        }}
        onEventCreated={fetchEvents}
        eventToEdit={eventToEdit}
      />

      <DeleteConfirmationModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Evento?"
        description={
          <>
            Tem certeza que deseja excluir o evento <span className="font-bold text-slate-700">"{eventToDelete?.theme}"</span>? Esta ação não pode ser desfeita.
          </>
        }
        isDeleting={isDeleting}
      />
    </>
  );

  return createPortal(modalContent, document.body);
};

export default EventManagerModal;
