// src/components/RestaurantReviewForm.jsx

import React, { useState } from "react";
import { Star, Send, CheckCircle, MessageSquare, Utensils, Clock, Package, Thermometer } from "lucide-react";
// ✅ 1. Importa a função real da API
import { postRestaurantReview } from "../services/reviewService";

// ... (Componentes internos como QuickStarRating, etc. continuam os mesmos) ...

export default function RestaurantReviewForm({ restaurantId, orderId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [categories, setCategories] = useState({});
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ... (Funções handleTagToggle, handleCategoryChange, etc. continuam as mesmas) ...

  const handleSubmit = async (e, quickRating = null, quickTags = null) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      // ✅ 2. Chama a função real da API com os dados do formulário
      await postRestaurantReview({
        restaurantId,
        orderId,
        rating: quickRating || rating,
        tags: quickTags || selectedTags,
        categories,
        comment: comment.trim(),
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
      
    } catch (err) {
      console.error("Erro ao enviar avaliação do restaurante:", err);
      setError(err.message || "Falha ao enviar avaliação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // ... (O resto do JSX do componente continua o mesmo, incluindo a tela de sucesso e o formulário) ...
  // Apenas adicione um local para exibir a mensagem de erro, se desejar.
}
