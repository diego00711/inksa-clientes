import { Link } from 'react-router-dom';

export default function PaymentPendingPage() {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center shadow-lg animate-pulse">
            <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">Pagamento em processamento</h1>
        <p className="text-gray-500 text-base mb-3">
          Seu pagamento está sendo processado. Você receberá uma confirmação em breve.
        </p>
        <p className="text-sm text-amber-600 font-medium mb-8">Isso pode levar alguns minutos</p>

        <div className="flex flex-col gap-3">
          <Link
            to="/pedidos"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
          >
            Ver meus pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
