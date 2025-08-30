import React, { useState } from "react";
// Importe seus componentes reais conforme sua estrutura
// import ClientReviewsList from "../components/ClientReviewsList";
import RestaurantReviewForm from "../components/RestaurantReviewForm";
import DeliveryReviewForm from "../components/DeliveryReviewForm";
import useDeliveredOrders from "../hooks/useDeliveredOrders";
import { useProfile } from "../context/ProfileContext";

export default function ClientEvaluationsCenter() {
  const { profile, loading } = useProfile();
  const { orders, loading: loadingOrders } = useDeliveredOrders(profile?.id, "client");
  const [highlightOrderId, setHighlightOrderId] = useState(null);

  return (
    <div style={{padding: 24, background: "#f0f8ff"}}>
      <h1 className="text-2xl font-bold mb-4">Minhas Avaliações & Feedback</h1>
      <section style={{background:"#e1f4ff",padding:16,borderRadius:8,marginBottom:32}}>
        <h2 className="text-xl font-bold mb-2">Como você está sendo avaliado?</h2>
        {/* <ClientReviewsList clientId={profile.id} /> */}
        <div style={{color: "#888"}}>Em breve: avaliações recebidas como cliente!</div>
      </section>
      <section style={{background:"#e1ffe6",padding:16,borderRadius:8}}>
        <h2 className="text-xl font-bold mb-2">Avalie restaurantes e entregadores</h2>
        {loadingOrders ? (
          <div>Carregando pedidos entregues...</div>
        ) : (
          <ul style={{listStyle:"none",padding:0}}>
            {orders.map(order => (
              <li key={order.id} style={{
                border:"1px solid #eee", margin:"1em 0", padding:16, borderRadius:8, background: highlightOrderId===order.id ? '#e6f7ff' : '#fff'
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <strong>Pedido #{order.id}</strong> <br />
                    <small>Data: {new Date(order.completed_at).toLocaleDateString()}</small>
                  </div>
                  <button
                    style={{background:"#0099ff",color:"#fff",padding:"6px 12px",border:"none",borderRadius:4,cursor:"pointer"}}
                    onClick={()=>setHighlightOrderId(order.id)}
                  >
                    Avaliar agora
                  </button>
                </div>
                {highlightOrderId===order.id && (
                  <div style={{marginTop:16,display:"flex",gap:32}}>
                    <div>
                      <div><b>Restaurante:</b> {order.restaurant_name}</div>
                      <RestaurantReviewForm
                        restaurantId={order.restaurant_id}
                        orderId={order.id}
                        onSuccess={() => {
                          alert("Avaliação do restaurante enviada!");
                          setHighlightOrderId(null);
                        }}
                      />
                    </div>
                    <div>
                      <div><b>Entregador:</b> {order.deliveryman_name}</div>
                      <DeliveryReviewForm
                        deliverymanId={order.deliveryman_id}
                        orderId={order.id}
                        onSuccess={() => {
                          alert("Avaliação do entregador enviada!");
                          setHighlightOrderId(null);
                        }}
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
