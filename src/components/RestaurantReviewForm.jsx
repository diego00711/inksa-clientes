import React, { useState } from "react";
import { Star, Send, CheckCircle, MessageSquare, Utensils, Clock, Package, Thermometer } from "lucide-react";

// Componente para rating com estrelas interativas
const QuickStarRating = ({ rating, onRatingChange, size = "w-6 h-6" }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className={`${size} transition-all duration-200 hover:scale-110 ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 hover:text-yellow-300"
          }`}
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

// Tags específicas para clientes avaliarem restaurantes
const ClientRestaurantTags = ({ selectedTags, onTagToggle }) => {
  const tags = [
    { id: "delicioso", label: "Comida deliciosa", emoji: "😋", color: "bg-green-100 text-green-700 border-green-300" },
    { id: "bem-embalado", label: "Bem embalado", emoji: "📦", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { id: "temperatura-perfeita", label: "Temperatura perfeita", emoji: "🔥", color: "bg-red-100 text-red-700 border-red-300" },
    { id: "porcao-generosa", label: "Porção generosa", emoji: "🍽️", color: "bg-purple-100 text-purple-700 border-purple-300" },
    { id: "rapido", label: "Saiu rápido", emoji: "⚡", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    { id: "apresentacao-bonita", label: "Apresentação bonita", emoji: "✨", color: "bg-pink-100 text-pink-700 border-pink-300" },
    { id: "comida-fria", label: "Comida fria", emoji: "❄️", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
    { id: "mal-embalado", label: "Mal embalado", emoji: "📋", color: "bg-orange-100 text-orange-700 border-orange-300" },
    { id: "porcao-pequena", label: "Porção pequena", emoji: "🥄", color: "bg-gray-100 text-gray-700 border-gray-300" },
    { id: "demorou-muito", label: "Demorou muito", emoji: "⏰", color: "bg-red-100 text-red-700 border-red-300" },
  ];

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">
        Como foi o pedido? (toque para marcar):
      </p>
      <div className="grid grid-cols-2 gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onTagToggle(tag.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
              selectedTags.includes(tag.id)
                ? tag.color
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span className="mr-1">{tag.emoji}</span>
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Avaliação por categoria para clientes
const ClientCategoryRating = ({ categories, onCategoryChange }) => {
  const categoryList = [
    { id: "sabor", label: "Sabor da comida", icon: <Utensils className="h-4 w-4" /> },
    { id: "temperatura", label: "Temperatura", icon: <Thermometer className="h-4 w-4" /> },
    { id: "embalagem", label: "Embalagem", icon: <Package className="h-4 w-4" /> },
    { id: "tempo_preparo", label: "Tempo de preparo", icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Avalie por categoria:</p>
      {categoryList.map((category) => (
        <div key={category.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{category.icon}</span>
            <span className="text-sm text-gray-700">{category.label}</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onCategoryChange(category.id, star)}
                className={`w-4 h-4 transition-all duration-200 ${
                  star <= (categories[category.id] || 0)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300 hover:text-yellow-300"
                }`}
              >
                <Star className="w-full h-full" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function RestaurantReviewForm({ restaurantId, orderId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [categories, setCategories] = useState({});
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCategoryChange = (categoryId, rating) => {
    setCategories(prev => ({
      ...prev,
      [categoryId]: rating
    }));
  };

  const handleQuickRating = (quickRating, tags) => {
    setRating(quickRating);
    setSelectedTags(tags);
    handleSubmit(null, quickRating, tags);
  };

  const handleSubmit = async (e, quickRating = null, quickTags = null) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log({
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
      
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="text-green-800 font-semibold text-sm">Avaliação enviada!</h4>
            <p className="text-green-700 text-xs">Obrigado pelo feedback sobre o restaurante.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons - Mobile First */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleQuickRating(5, ["delicioso", "bem-embalado", "temperatura-perfeita"])}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          😋 Tudo Perfeito (5⭐)
        </button>
        <button
          type="button"
          onClick={() => handleQuickRating(2, ["comida-fria", "demorou-muito"])}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          😞 Problemas (2⭐)
        </button>
      </div>

      {/* Detailed Form */}
      <details className="bg-gray-50 rounded-lg border border-gray-200">
        <summary className="cursor-pointer p-3 font-medium text-gray-700 text-sm hover:bg-gray-100 transition-colors">
          ⚙️ Avaliação detalhada (opcional)
        </summary>
        
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Utensils className="inline h-3 w-3 mr-1" />
              Nota geral para o restaurante:
            </label>
            <QuickStarRating 
              rating={rating} 
              onRatingChange={setRating}
            />
          </div>

          {/* Category Ratings */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <ClientCategoryRating 
              categories={categories}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Quick Tags */}
          <ClientRestaurantTags 
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
          />

          {/* Comment - Optional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MessageSquare className="inline h-3 w-3 mr-1" />
              Conte mais sobre sua experiência:
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: A pizza estava deliciosa e chegou quentinha! Embalagem caprichada..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm"
              maxLength={300}
            />
            <div className="text-right">
              <span className="text-xs text-gray-500">
                {comment.length}/300
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Publicar Avaliação
              </>
            )}
          </button>
        </form>
      </details>

      {/* Quick Quality Feedback */}
      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
        <div className="flex items-start gap-2">
          <Utensils className="h-4 w-4 text-orange-600 mt-0.5" />
          <div>
            <p className="text-orange-800 font-medium text-xs mb-1">🍽️ Como estava a comida?</p>
            <div className="grid grid-cols-3 gap-1">
              <button 
                type="button"
                onClick={() => {
                  setSelectedTags(prev => [...prev.filter(t => !['delicioso', 'temperatura-perfeita', 'comida-fria'].includes(t)), 'delicioso', 'temperatura-perfeita']);
                  setRating(5);
                }}
                className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs transition-colors"
              >
                😋 Deliciosa
              </button>
              <button 
                type="button"
                onClick={() => setRating(3)}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded text-xs transition-colors"
              >
                😐 Ok
              </button>
              <button 
                type="button"
                onClick={() => {
                  setSelectedTags(prev => [...prev.filter(t => !['delicioso', 'temperatura-perfeita', 'comida-fria'].includes(t)), 'comida-fria']);
                  setRating(2);
                }}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs transition-colors"
              >
                😞 Ruim
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tips for clients */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-blue-800 font-medium text-xs mb-1">💡 Dica:</p>
        <p className="text-blue-700 text-xs">
          Sua avaliação honesta ajuda outros clientes a escolher e incentiva o restaurante a manter a qualidade alta!
        </p>
      </div>
    </div>
  );
}
