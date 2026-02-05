import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';
import { Event } from '../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  eventToEdit?: Event | null;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ 
  isOpen, 
  onClose, 
  onEventCreated,
  eventToEdit = null
}) => {
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (eventToEdit && isOpen) {
      setTheme(eventToEdit.theme);
      setDescription(eventToEdit.description);
      setStartDate(eventToEdit.start_date);
      setEndDate(eventToEdit.end_date);
    } else if (!eventToEdit && isOpen) {
      setTheme('');
      setDescription('');
      setStartDate('');
      setEndDate('');
    }
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme || !description || !startDate || !endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const hasOverlap = await databaseService.checkEventOverlap(startDate, endDate);
      
      if (!eventToEdit && hasOverlap) {
        toast.error('Já existe um evento programado para este período ou parte dele.');
        setIsSubmitting(false);
        return;
      }

      if (eventToEdit) {
        const success = await databaseService.updateEvent(eventToEdit.id, {
          theme,
          description,
          start_date: startDate,
          end_date: endDate,
        });
        if (success) {
          toast.success('Evento atualizado com sucesso!');
        } else {
          throw new Error('Erro ao atualizar');
        }
      } else {
        await databaseService.createEvent({
          theme,
          description,
          start_date: startDate,
          end_date: endDate,
        });
        toast.success('Evento criado com sucesso!');
      }
      
      onEventCreated();
      onClose();
    } catch (error) {
      console.error('Erro ao processar evento:', error);
      toast.error(eventToEdit ? 'Erro ao atualizar evento.' : 'Erro ao criar evento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-slate-800">
              {eventToEdit ? 'Editar Evento' : 'Criar Evento'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-slate-500 text-[13px] mb-6">
            {eventToEdit 
              ? 'Altere as informações do evento abaixo.' 
              : 'Crie um novo evento para influenciar a palavra do dia.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Tema do Evento *
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: Revificação"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Descrição *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Um breve resumo do que se trata e o foco do evento..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium resize-none min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Data de Fim *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all text-sm shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{eventToEdit ? 'Salvando...' : 'Criando...'}</span>
                  </>
                ) : (
                  <span>{eventToEdit ? 'Salvar Alterações' : 'Criar Evento'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreateEventModal;
