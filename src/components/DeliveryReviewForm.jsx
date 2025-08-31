import React, { useState } from "react";
import { Star, Send, CheckCircle, MessageSquare, Truck, Clock, Phone, MapPin } from "lucide-react";

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

// Tags específicas para clientes avaliarem entregadores
const ClientDeliveryTags = ({ selectedTags, onTagToggle }) => {
  const tags = [
    { id: "pontual", label: "Chegou no prazo", emoji: "⏰", color: "bg-green-100 text-green-700 border-green-300" },
    { id: "educado", label: "Muito educado", emoji: "😊", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { id: "cuidadoso", label: "Cuidadoso", emoji: "👍", color: "bg-purple-100 text-purple-700 border-purple-300" },
    { id: "encontrou-facil", label: "Encontrou fácil", emoji: "📍", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    { id: "comunicativo", label: "Comunicativo", emoji: "📱", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    { id: "uniforme-limpo", label: "Uniforme limpo", emoji: "👔", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
    { id: "atrasado", label: "Chegou atrasado", emoji: "⏳", color: "bg-red-100 text-red-700 border-red-300" },
    { id: "nao-achou", label: "Não achou endereço", emoji: "🗺️", color: "bg-orange-100 text-orange-700 border-orange-300" },
    { id: "mal-educado", label: "Mal educado", emoji: "😤", color: "bg-red-100 text-red-700 border-red-300" },
    { id: "pedido-bagunçado", label: "Pedido bagunçado", emoji: "📦", color: "bg-gray-100 text-gray-700 border-gray-300" },
  ];

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">
        Como foi o entregador? (toque para marcar):
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

// Avaliação por categoria para clientes sobre entregadores
const ClientDeliveryCategoryRating = ({ categories, onCategoryChange }) => {
  const categoryList = [
    { id: "pontualidade", label: "Pontualidade", icon: <Clock className="h-4 w-4" /> },
    { id: "cuidado", label: "Cuidado com pedido", icon: <Truck className="h-4 w-4" /> },
    { id: "educacao", label: "Educação", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "localizacao", label: "Facilidade p/ achar", icon: <MapPin className="h-4 w-4" /> },
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

export default function DeliveryReviewForm({ deliverymanId, orderId, onSuccess }) {
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
        deliverymanId,
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
            <p className="text-green-700 text-xs">Obrigado pelo feedback sobre o entregador.</p>
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
          onClick={() => handleQuickRating(5, ["pontual", "educado", "cuidadoso"])}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          👍 Excelente (5⭐)
        </button>
        <button
          type="button"
          onClick={() => handleQuickRating(2, ["atrasado", "nao-achou"])}
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
              <Truck className="inline h-3 w-3 mr-1" />
              Nota geral para o entregador:
            </label>
            <QuickStarRating 
              rating={rating} 
              onRatingChange={setRating}
            />
          </div>

          {/* Category Ratings */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <ClientDeliveryCategoryRating 
              categories={categories}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Quick Tags */}
          <ClientDeliveryTags 
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
          />

          {/* Comment - Optional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MessageSquare className="inline h-3 w-3 mr-1" />
              Conte mais sobre a entrega:
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: O entregador foi muito educado e chegou rapidinho! Cuidou bem do meu pedido..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none text-sm"
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
                : "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
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

      {/* Quick Delivery Time Feedback */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-800 font-medium text-xs mb-1">⏰ Como foi o tempo de entrega?</p>
            <div className="grid grid-cols-3 gap-1">
              <button 
                type="button"
                onClick={() => {
                  setSelectedTags(prev => [...prev.filter(t => !['pontual', 'atrasado'].includes(t)), 'pontual']);
                  setRating(5);
                }}
                className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs transition-colors"
              >
                ⚡ Rápido
              </button>
              <button 
                type="button"
                onClick={() => setRating(4)}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded text-xs transition-colors"
              >
                ⏰ No prazo
              </button>
              <button 
                type="button"
                onClick={() => {
                  setSelectedTags(prev => [...prev.filter(t => !['pontual', 'atrasado'].includes(t)), 'atrasado']);
                  setRating(2);
                }}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs transition-colors"
              >
                😓 Atrasado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Service Quality */}
      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
        <div className="flex items-start gap-2">
          <Truck className="h-4 w-4 text-purple-600 mt-0.5" />
          <div>
            <p className="text-purple-800 font-medium text-xs mb-1">📦 Como chegou seu pedido?</p>
            <div className="grid grid-cols-2 gap-1">
              <button 
                type="button"
                onClick={() => {
                  setSelectedTags(prev => [...prev.filter(t => !['cuidadoso', 'pedido-bagunçado'].includes(t)), 'cuidadoso']);
                  setRating(5);
                }}
                className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs transition-colors"
              >
                👍 Perfeito
              </button>
              <button 
                type="button"
                onClick={() => {
                  setSelectedTags(prev => [...prev.filter(t => !['cuidadoso', 'pedido-bagunçado'].includes(t)), 'pedido-bagunçado']);
                  setRating(2);
                }}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs transition-colors"
              >
                📦 Bagunçado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tips for clients */}
      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
        <p className="text-indigo-800 font-medium text-xs mb-1">💡 Lembre-se:</p>
        <p className="text-indigo-700 text-xs">
          Entregadores trabalham em diferentes condições. Uma avaliação justa ajuda a reconhecer o bom trabalho e melhorar o serviço!
        </p>
      </div>
    </div>
  );
}
