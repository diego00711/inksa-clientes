import { Link } from 'react-router-dom';

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">Pagamento não aprovado</h1>
        <p className="text-gray-500 text-base mb-8">
          Houve um problema com seu pagamento. Tente novamente ou escolha outra forma de pagamento.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/carrinho"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
          >
            Tentar novamente
          </Link>
          <Link
            to="/"
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-xl border border-gray-200 transition-colors text-base"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
