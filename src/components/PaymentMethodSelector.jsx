// src/components/PaymentMethodSelector.jsx
import React from 'react';

const PAYMENT_OPTIONS = [
  { id: 'credit', label: 'Crédito',  icon: '💳' },
  { id: 'debit',  label: 'Débito',   icon: '💳' },
  { id: 'pix',    label: 'PIX',      icon: '📱' },
  { id: 'cash',   label: 'Dinheiro', icon: '💵' },
];

export function PaymentMethodSelector({
  selected,
  onChange,
  acceptsCash = true,
  total = 0,
  needsChange,
  onNeedsChangeToggle,
  changeFor,
  onChangeForChange,
}) {
  const options = acceptsCash
    ? PAYMENT_OPTIONS
    : PAYMENT_OPTIONS.filter(o => o.id !== 'cash');

  return (
    <div className="border-t pt-6 mt-4">
      <h3 className="font-semibold text-gray-800 mb-3">Forma de pagamento</h3>
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 p-4 rounded-lg border-2 text-left transition-all
              ${selected === id
                ? 'border-orange-500 bg-orange-50 font-semibold'
                : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>

      {selected === 'cash' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
          <p className="text-sm font-medium text-yellow-800">Precisa de troco?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onNeedsChangeToggle(false)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all
                ${!needsChange
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              Não
            </button>
            <button
              type="button"
              onClick={() => onNeedsChangeToggle(true)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all
                ${needsChange
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              Sim
            </button>
          </div>
          {needsChange && (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Troco para R$</label>
              <input
                type="number"
                min={total + 0.01}
                step="0.01"
                value={changeFor}
                onChange={e => onChangeForChange(e.target.value)}
                placeholder={`Ex: ${(Math.ceil(total / 10) * 10).toFixed(2)}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor maior que R$ {total.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
