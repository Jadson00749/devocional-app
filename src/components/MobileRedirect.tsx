import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Copy, Check } from 'lucide-react';

const MobileRedirect: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center space-y-8">
        {/* Ícone e Título */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Acesse pelo celular
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            O <span className="text-orange-500 font-bold">Geração Life</span> foi feito especialmente para ser usado no seu smartphone.
          </p>
          <p className="text-sm text-slate-500">
            Abra este link no seu celular para continuar sua jornada de fé! 🔥
          </p>
        </div>

        {/* QR Code */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            Ou escaneie o QR code com seu celular:
          </h2>
          <div className="flex justify-center p-4 bg-slate-50 rounded-2xl">
            <QRCodeSVG 
              value={currentUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        {/* Link para copiar */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            Ou copie o endereço:
          </h2>
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
            <input
              type="text"
              value={currentUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-slate-700 font-medium outline-none"
            />
            <button
              onClick={handleCopy}
              className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors active:scale-95"
              title="Copiar link"
            >
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Instruções */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            Como acessar:
          </h3>
          <ol className="text-left space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-black">1.</span>
              <span>Copie o link desta página</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-black">2.</span>
              <span>Abra no navegador do seu celular</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-black">3.</span>
              <span>Comece sua jornada de devocionais diários!</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MobileRedirect;


