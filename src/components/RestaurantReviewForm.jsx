// src/components/RestaurantReviewForm.jsx

import React, { useState } from "react";
import { Star, Send, CheckCircle, MessageSquare, Utensils, Clock, Package, Thermometer, AlertCircle, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { postRestaurantReview } from "../services/reviewService";

// --- Componentes Internos Melhorados ---

const StarRating = ({ rating, onRatingChange, size = "w-6 h-6", readonly = false }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange(star)}
          disabled={readonly}
          className={`${size} transition-all duration-200 ${!readonly && 'hover:scale-110'} ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 hover:text-yellow-300"
          } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star className="w-full h-full" />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-600">
        ({rating}/5)
      </span>
    </div>
  );
};

const ReviewTags = ({ selectedTags, onTagToggle }) => {
  const tags = [
    { id: "delicioso", label: "Delicioso", emoji: "😋", color: "bg-green-100 text-green-700 border-green-300", type: "positive" },
    { id: "bem-embalado", label: "Bem embalado", emoji: "📦", color: "bg-blue-100 text-blue-700 border-blue-300", type: "positive" },
    { id: "temperatura-perfeita", label: "Temperatura ideal", emoji: "🔥", color: "bg-red-100 text-red-700 border-red-300", type: "positive" },
    { id: "porcao-generosa", label: "Porção generosa", emoji: "🍽️", color: "bg-purple-100 text-purple-700 border-purple-300", type: "positive" },
    { id: "rapido", label: "Entrega rápida", emoji: "⚡", color: "bg-yellow-100 text-yellow-700 border-yellow-300", type: "positive" },
    { id: "apresentacao-bonita", label: "Boa apresentação", emoji: "✨", color: "bg-pink-100 text-pink-700 border-pink-300", type: "positive" },
    { id: "comida-fria", label: "Chegou frio", emoji: "🧊", color: "bg-cyan-100 text-cyan-700 border-cyan-300", type: "negative" },
    { id: "mal-embalado", label: "Mal embalado", emoji: "📋", color: "bg-orange-100 text-orange-700 border-orange-300", type: "negative" },
    { id: "porcao-pequena", label: "Porção pequena", emoji: "🥄", color: "bg-gray-100 text-gray-700 border-gray-300", type: "negative" },
    { id: "demorou-muito", label: "Demorou muito", emoji: "⏰", color: "bg-red-100 text-red-700 border-red-300", type: "negative" },
  ];

  const positivesTags = tags.filter(tag => tag.type === 'positive');
  const negativeTags = tags.filter(tag => tag.type === 'negative');

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ThumbsUp className="w-4 h-4 text-green-600" />
          <p className="text-sm font-medium text-gray-700">Pontos positivos:</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {positivesTags.map((tag) => (
            <button 
              key={tag.id} 
              type="button" 
              onClick={() => onTagToggle(tag.id)} 
              className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 hover:scale-105 ${
                selectedTags.includes(tag.id) ? tag.color : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span className="mr-1">{tag.emoji}</span>
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <ThumbsDown className="w-4 h-4 text-red-600" />
          <p className="text-sm font-medium text-gray-700">Pontos a melhorar:</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {negativeTags.map((tag) => (
            <button 
              key={tag.id} 
              type="button" 
              onClick={() => onTagToggle(tag.id)} 
              className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 hover:scale-105 ${
                selectedTags.includes(tag.id) ? tag.color : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span className="mr-1">{tag.emoji}</span>
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const CategoryRating = ({ categories, onCategoryChange }) => {
  const categoryList = [
    { id: "sabor", label: "Sabor", icon: <Utensils className="h-4 w-4" /> },
    { id: "temperatura", label: "Temperatura", icon: <Thermometer className="h-4 w-4" /> },
    { id: "embalagem", label: "Embalagem", icon: <Package className="h-4 w-4" /> },
    { id: "tempo_preparo", label: "Rapidez", icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <p className="text-sm font-medium text-gray-700">Avalie cada aspecto:</p>
      </div>
      {categoryList.map((category) => (
        <div key={category.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{category.icon}</span>
            <span className="text-sm font-medium text-gray-700">{category.label}</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                type="button" 
                onClick={() => onCategoryChange(category.id, star)} 
                className={`w-5 h-5 transition-all duration-200 hover:scale-110 ${
                  star <= (categories[category.id] || 0) 
                    ? "text-yellow-400 fill-yellow-400" 
                    : "text-gray-300 hover:text-yellow-300"
                }`}
              >
                <Star className="w-full h-full" />
              </button>
            ))}
            <span className="ml-2 text-xs text-gray-500 min-w-[2rem]">
              {categories[category.id] || 0}/5
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Componente Principal ---
export default function RestaurantReviewForm({ restaurantId, orderId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [categories, setCategories] = useState({});
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };

  const handleCategoryChange = (categoryId, rating) => {
    setCategories(prev => ({ ...prev, [categoryId]: rating }));
  };

  const handleQuickRating = async (quickRating, tags, autoSubmit = true) => {
    setRating(quickRating);
    setSelectedTags(tags);
    
    if (autoSubmit) {
      await handleSubmit(null, quickRating, tags);
    }
  };

  const handleSubmit = async (e, quickRating = null, quickTags = null) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
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
      }, 2000);
      
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      setError(err.message || "Falha ao enviar avaliação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h4 className="text-green-800 font-bold text-lg">Avaliação enviada!</h4>
            <p className="text-green-700 text-sm">Obrigado pelo seu feedback. Isso ajuda muito!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Como foi sua experiência?</h3>
        <p className="text-sm text-gray-600">Sua opinião é muito importante para nós</p>
      </div>

      {/* Botões de Avaliação Rápida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button 
          type="button" 
          onClick={() => handleQuickRating(5, ["delicioso", "bem-embalado", "temperatura-perfeita"])} 
          disabled={loading} 
          className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">😋</span>
            <div className="text-left">
              <div>Tudo Perfeito!</div>
              <div className="text-xs opacity-90">5 estrelas</div>
            </div>
          </div>
        </button>
        
        <button 
          type="button" 
          onClick={() => handleQuickRating(3, [], false)} 
          disabled={loading} 
          className="group bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-4 px-6 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🤔</span>
            <div className="text-left">
              <div>Foi OK</div>
              <div className="text-xs opacity-90">Quero detalhar</div>
            </div>
          </div>
        </button>
      </div>

      {/* Botão para abrir avaliação detalhada */}
      {!showDetailedForm && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowDetailedForm(true)}
            className="text-orange-600 hover:text-orange-700 font-medium text-sm underline transition-colors"
          >
            Fazer avaliação detalhada
          </button>
        </div>
      )}

      {/* Formulário Detalhado */}
      {showDetailedForm && (
        <div className="border-t border-gray-200 pt-6 space-y-6">
          {/* Rating Geral */}
          <div className="text-center">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Utensils className="inline h-4 w-4 mr-1" />
              Nota geral:
            </label>
            <div className="flex justify-center">
              <StarRating rating={rating} onRatingChange={setRating} size="w-8 h-8" />
            </div>
          </div>

          {/* Avaliação por Categoria */}
          <div className="bg-gray-50 rounded-xl p-4">
            <CategoryRating categories={categories} onCategoryChange={handleCategoryChange} />
          </div>

          {/* Tags de Feedback */}
          <ReviewTags selectedTags={selectedTags} onTagToggle={handleTagToggle} />

          {/* Comentário */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MessageSquare className="inline h-4 w-4 mr-1" />
              Conte mais sobre sua experiência:
            </label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Ex: A pizza estava deliciosa e chegou quentinha! Embalagem caprichada..." 
              rows={3} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none text-sm" 
              maxLength={300} 
            />
            <div className="text-right mt-1">
              <span className="text-xs text-gray-500">{comment.length}/300</span>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botão de Envio */}
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading} 
            className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl ${
              loading 
                ? "bg-gray-400 cursor-not-allowed text-white" 
                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:scale-105"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Publicar Avaliação
              </>
            )}
          </button>
        </div>
      )}

      {/* Dica */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Sparkles className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-blue-800 font-medium text-sm mb-1">Sua opinião importa!</p>
            <p className="text-blue-700 text-xs">
              Avaliações honestas ajudam outros clientes e incentivam restaurantes a manter a qualidade alta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
