// src/pages/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Loader2 } from "lucide-react";
import AuthService from '../services/authService.js';
import { useToast } from "../context/ToastContext";
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { addToast } = useToast();
  const { refreshUser } = useAuth(); 
  
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', birth_date: '', cpf: '',
    address_street: '', address_number: '', address_complement: '',
    address_neighborhood: '', address_city: '', address_state: '',
    address_zipcode: '', avatar_url: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await AuthService.getProfile();
        // ✅ CORREÇÃO: Os dados do perfil vêm diretamente de 'response.data'.
        if (response && response.data) {
          const profile = response.data;
          if (profile.birth_date) {
            profile.birth_date = profile.birth_date.split('T')[0];
          }
          setFormData(prev => ({ ...prev, ...profile }));
          setPreview(profile.avatar_url);
        }
      } catch (error) {
        addToast('error', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [addToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let dataToUpdate = { ...formData };

      if (selectedFile) {
        // A função de upload já retorna o objeto completo da resposta.
        const uploadResponse = await AuthService.uploadAvatar(selectedFile);
        dataToUpdate.avatar_url = uploadResponse.avatar_url;
      }
      
      await AuthService.updateProfile(dataToUpdate);
      
      // Chama a função para notificar toda a aplicação da mudança
      refreshUser(); 
      
      addToast('success', 'Perfil atualizado com sucesso!');

    } catch (error) {
      addToast('error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Meu Perfil</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-8">
        {/* --- SECÇÃO DE FOTO E DADOS PESSOAIS --- */}
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex flex-col items-center flex-shrink-0">
            <label htmlFor="avatar-upload" className="cursor-pointer group relative">
              <Avatar className="h-40 w-40 border-4 border-white shadow-lg">
                <AvatarImage src={preview} alt="User Avatar" />
                <AvatarFallback className="bg-gray-200"><User className="h-20 w-20 text-gray-400" /></AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-all">
                <Camera className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </label>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="w-full space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="first_name">Nome</Label>
                <Input id="first_name" name="first_name" value={formData.first_name || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="last_name">Apelido</Label>
                <Input id="last_name" name="last_name" value={formData.last_name || ''} onChange={handleInputChange} />
              </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" name="cpf" value={formData.cpf || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        {/* --- SECÇÃO DE ENDEREÇO --- */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">Meu Endereço Principal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-1">
              <Label htmlFor="address_zipcode">CEP</Label>
              <Input id="address_zipcode" name="address_zipcode" value={formData.address_zipcode || ''} onChange={handleInputChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
            <div className="sm:col-span-2">
              <Label htmlFor="address_street">Rua</Label>
              <Input id="address_street" name="address_street" value={formData.address_street || ''} onChange={handleInputChange} />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="address_number">Número</Label>
              <Input id="address_number" name="address_number" value={formData.address_number || ''} onChange={handleInputChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
            <div className="sm:col-span-1">
              <Label htmlFor="address_complement">Complemento</Label>
              <Input id="address_complement" name="address_complement" value={formData.address_complement || ''} onChange={handleInputChange} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address_neighborhood">Bairro</Label>
              <Input id="address_neighborhood" name="address_neighborhood" value={formData.address_neighborhood || ''} onChange={handleInputChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div>
              <Label htmlFor="address_city">Cidade</Label>
              <Input id="address_city" name="address_city" value={formData.address_city || ''} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="address_state">Estado</Label>
              <Input id="address_state" name="address_state" value={formData.address_state || ''} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...</> ) : 'Guardar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}