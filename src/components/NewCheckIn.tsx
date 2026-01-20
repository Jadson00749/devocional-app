import React, { useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';

interface NewCheckInProps {
  onClose: () => void;
}

const NewCheckIn: React.FC<NewCheckInProps> = ({ onClose }) => {
  const [readingCompleted, setReadingCompleted] = useState(false);
  const [verse, setVerse] = useState('');
  const [lesson, setLesson] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const isFormComplete = readingCompleted && verse.trim() !== '' && lesson.trim() !== '';

  const handleSubmit = () => {
    if (!readingCompleted) {
      setShowErrors(true);
      return;
    }
    if (!verse.trim() || !lesson.trim()) {
      setShowErrors(true);
      return;
    }
    // Aqui você pode adicionar a lógica de envio
    console.log('Check-in enviado!');
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-white z-[90] overflow-y-auto pointer-events-none">
      <div className="pointer-events-auto">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-white flex items-center gap-3 border-b border-slate-200 sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={22} className="text-slate-900" />
        </button>
        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">
          Novo Check-in
        </h1>
      </header>

      {/* Content */}
      <div className="px-4 pt-6 pb-36 space-y-5">
        {/* Leitura Concluída Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-slate-900">Leitura Concluída</h2>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-md uppercase">
              Obrigatório
            </span>
          </div>
          <p className="text-[12px] text-slate-600 mb-3 leading-relaxed">
            Marque quando finalizar a leitura do devocional
          </p>
          
          <label className={`flex items-center justify-between gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
            readingCompleted 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 shadow-lg shadow-green-100' 
              : 'bg-white border-2 border-slate-200 hover:border-green-300 hover:shadow-md'
          }`}>
            <div className="flex items-center gap-3">
              {/* Checkbox customizado */}
              <div className="relative">
                <input
                  type="checkbox"
                  checked={readingCompleted}
                  onChange={(e) => setReadingCompleted(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                  readingCompleted 
                    ? 'bg-green-500 border-green-500 scale-110' 
                    : 'bg-white border-slate-300 hover:border-green-400'
                }`}>
                  {readingCompleted && (
                    <svg 
                      className="w-4 h-4 text-white animate-in zoom-in duration-200" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`text-[14px] font-semibold transition-colors ${
                readingCompleted ? 'text-green-600' : 'text-slate-700'
              }`}>
                Leitura concluída
              </span>
            </div>
            {readingCompleted && (
              <svg 
                className="w-6 h-6 text-green-500 animate-in zoom-in duration-300" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </label>
        </div>

        {/* Versículo do Dia */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[14px] font-bold text-slate-900">
              Versículo do Dia <span className="text-orange-500">*</span>
            </label>
            <span className="text-[12px] text-slate-400 font-medium">
              {verse.length}/30
            </span>
          </div>
          <input
            type="text"
            value={verse}
            onChange={(e) => setVerse(e.target.value.slice(0, 30))}
            placeholder="Digite o versículo que mais tocou seu coração h"
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 transition-colors"
          />
          {showErrors && !readingCompleted && (
            <div className="flex items-start gap-1.5 mt-2">
              <span className="text-orange-500 text-[11px] mt-0.5">⚠</span>
              <p className="text-[11px] text-orange-600 font-medium">
                Complete a leitura primeiro para preencher este campo
              </p>
            </div>
          )}
        </div>

        {/* Lição Aprendida */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[14px] font-bold text-slate-900">
              Lição Aprendida <span className="text-orange-500">*</span>
            </label>
            <span className="text-[12px] text-slate-400 font-medium">
              {lesson.length}/600
            </span>
          </div>
          <textarea
            value={lesson}
            onChange={(e) => setLesson(e.target.value.slice(0, 600))}
            placeholder="O que Deus falou com você através dessa leitura?"
            rows={5}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 transition-colors resize-none"
          />
          {showErrors && !readingCompleted && (
            <div className="flex items-start gap-1.5 mt-2">
              <span className="text-orange-500 text-[11px] mt-0.5">⚠</span>
              <p className="text-[11px] text-orange-600 font-medium">
                Complete a leitura primeiro para preencher este campo
              </p>
            </div>
          )}
        </div>

        {/* Pedido de Oração */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[14px] font-bold text-slate-900">
              Pedido de Oração <span className="text-[12px] font-normal text-slate-500">(opcional)</span>
            </label>
            <span className="text-[12px] text-slate-400 font-medium">
              {prayerRequest.length}/100
            </span>
          </div>
          <textarea
            value={prayerRequest}
            onChange={(e) => setPrayerRequest(e.target.value.slice(0, 100))}
            placeholder="Compartilhe um pedido de oração..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 transition-colors resize-none"
          />
          {showErrors && !readingCompleted && (
            <div className="flex items-start gap-1.5 mt-2">
              <span className="text-orange-500 text-[11px] mt-0.5">⚠</span>
              <p className="text-[11px] text-orange-600 font-medium">
                Complete a leitura primeiro para preencher este campo
              </p>
            </div>
          )}
        </div>

        {/* Adicionar Foto */}
        <button className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-orange-300 hover:text-orange-400 transition-colors">
          <Camera size={20} />
          <span className="text-[14px] font-medium">Adicionar foto</span>
        </button>
        {showErrors && !readingCompleted && (
          <div className="flex items-start gap-1.5 -mt-3">
            <span className="text-orange-500 text-[11px] mt-0.5">⚠</span>
            <p className="text-[11px] text-orange-600 font-medium">
              Complete a leitura primeiro para adicionar imagem
            </p>
          </div>
        )}

        {/* Botão de Submissão */}
        <button
          onClick={handleSubmit}
          disabled={!isFormComplete}
          className={`w-full py-5 rounded-3xl text-[16px] font-bold transition-all flex items-center justify-center gap-2 ${
            isFormComplete
              ? 'bg-orange-400 text-white hover:bg-orange-500 active:scale-95'
              : 'bg-orange-300 text-white cursor-not-allowed opacity-60'
          }`}
        >
          {isFormComplete ? (
            <>Compartilhar Devocional 🔥</>
          ) : (
            <>Preencha todos os campos obrigatórios</>
          )}
        </button>
      </div>
      </div>
    </div>
  );
};

export default NewCheckIn;

