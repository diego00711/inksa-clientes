// src/components/AddressBook.jsx
// Gerenciamento de múltiplos endereços do cliente: listar, adicionar,
// editar, remover e definir o padrão. Inclui marcação do ponto no mapa.

import { useState, useEffect, useCallback } from "react";
import { MapPin, Plus, Star, Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import AddressService, { formatAddress } from "../services/addressService";
import AddressMapPicker from "./AddressMapPicker";
import { useToast } from "../context/ToastContext";

const EMPTY = {
  label: "Casa", street: "", number: "", complement: "",
  neighborhood: "", city: "", state: "", zipcode: "", reference: "",
  latitude: null, longitude: null,
};

function AddressForm({ initial, onCancel, onSaved }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const coord = form.latitude != null && form.longitude != null
    ? { lat: Number(form.latitude), lng: Number(form.longitude) }
    : null;

  const lookupCep = async () => {
    const cep = String(form.zipcode || "").replace(/\D/g, "");
    if (cep.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        addToast("error", "CEP não encontrado. Confira o número.");
        return;
      }
      setForm((p) => ({
        ...p,
        street: data.logradouro || p.street,
        neighborhood: data.bairro || p.neighborhood,
        city: data.localidade || p.city,
        state: data.uf || p.state,
      }));
      addToast("success", "Endereço preenchido pelo CEP. Confirme o número.");
    } catch {
      addToast("error", "Não foi possível buscar o CEP agora.");
    } finally {
      setLoadingCep(false);
    }
  };

  const submit = async () => {
    if (!form.street || !form.number) {
      addToast("warning", "Informe ao menos rua e número.");
      return;
    }
    setSaving(true);
    try {
      if (initial?.id) {
        await AddressService.update(initial.id, form);
      } else {
        await AddressService.create(form);
      }
      addToast("success", "Endereço salvo!");
      onSaved();
    } catch (e) {
      addToast("error", e.message || "Erro ao salvar endereço.");
    } finally {
      setSaving(false);
    }
  };

  const field = (k, label, cls = "") => (
    <div className={cls}>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        value={form[k] || ""}
        onChange={(e) => set(k, e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5"
      />
    </div>
  );

  return (
    <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/40 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {field("label", "Identificação (ex: Casa, Trabalho)", "col-span-2")}
        <div>
          <label className="text-xs font-medium text-gray-600">CEP</label>
          <div className="relative">
            <input
              value={form.zipcode || ""}
              onChange={(e) => set("zipcode", e.target.value)}
              onBlur={lookupCep}
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5 pr-8"
            />
            {loadingCep && (
              <Loader2 className="animate-spin h-4 w-4 text-orange-500 absolute right-2 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>
        {field("number", "Número")}
        {field("street", "Rua", "col-span-2")}
        {field("complement", "Complemento")}
        {field("neighborhood", "Bairro")}
        {field("city", "Cidade")}
        {field("state", "Estado")}
        {field("reference", "Ponto de referência", "col-span-2")}
      </div>
      <p className="text-xs text-gray-500 -mt-1">
        💡 Digite o CEP que preenchemos rua, bairro, cidade e estado pra você.
      </p>

      <AddressMapPicker
        value={coord}
        onChange={(c) => setForm((p) => ({ ...p, latitude: c.lat, longitude: c.lng }))}
      />

      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1">
          <X className="w-4 h-4" /> Cancelar
        </button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#FF6F00] text-white flex items-center gap-1 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
        </button>
      </div>
    </div>
  );
}

export default function AddressBook() {
  const { addToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // 'new' | address object | null

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAddresses(await AddressService.list());
    } catch (e) {
      addToast("error", e.message || "Erro ao carregar endereços.");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const onSaved = () => { setEditing(null); load(); };

  const remove = async (id) => {
    if (!window.confirm("Remover este endereço?")) return;
    try {
      await AddressService.remove(id);
      load();
    } catch (e) {
      addToast("error", e.message || "Erro ao remover.");
    }
  };

  const makeDefault = async (id) => {
    try {
      await AddressService.setDefault(id);
      load();
    } catch (e) {
      addToast("error", e.message || "Erro ao definir padrão.");
    }
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md mt-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" /> Meus Endereços
        </h2>
        {editing === null && (
          <button onClick={() => setEditing("new")} className="px-3 py-2 rounded-lg text-sm font-bold bg-[#FF6F00] text-white flex items-center gap-1">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        )}
      </div>

      {editing === "new" && <AddressForm onCancel={() => setEditing(null)} onSaved={onSaved} />}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : addresses.length === 0 && editing === null ? (
        <p className="text-sm text-gray-500 text-center py-6">Você ainda não cadastrou endereços. Adicione um para agilizar seus pedidos.</p>
      ) : (
        <div className="space-y-3 mt-3">
          {addresses.map((a) => (
            editing?.id === a.id ? (
              <AddressForm key={a.id} initial={a} onCancel={() => setEditing(null)} onSaved={onSaved} />
            ) : (
              <div key={a.id} className="border rounded-xl p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">{a.label}</span>
                    {a.is_default && (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 truncate">{formatAddress(a)}</p>
                  {a.latitude != null && <p className="text-xs text-green-600 mt-0.5">📍 Localização marcada no mapa</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!a.is_default && (
                    <button onClick={() => makeDefault(a.id)} title="Definir como padrão" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setEditing(a)} title="Editar" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(a.id)} title="Remover" className="p-2 rounded-lg hover:bg-red-50 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
