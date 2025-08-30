import { useEffect, useState } from "react";

// Adapte para buscar dados reais conforme o perfil (cliente, entregador, restaurante)
export default function useDeliveredOrders(profileId, role) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);

    // MOCK: personalize conforme o papel
    if (role === "client") {
      setTimeout(() => {
        setOrders([
          {
            id: 201,
            restaurant_id: 11,
            restaurant_name: "Pizzaria Exemplo",
            deliveryman_id: 99,
            deliveryman_name: "Entregador Zé",
            completed_at: Date.now() - 86400000,
          },
        ]);
        setLoading(false);
      }, 600);
    } else if (role === "deliveryman") {
      setTimeout(() => {
        setOrders([
          {
            id: 301,
            restaurant_id: 21,
            restaurant_name: "Lanchonete Central",
            client_id: 888,
            client_name: "Cliente Diego",
            completed_at: Date.now() - 43200000,
          },
        ]);
        setLoading(false);
      }, 600);
    } else {
      // restaurante: exemplo já passado antes
      setTimeout(() => {
        setOrders([
          {
            id: 101,
            client_id: 1,
            client_name: "João Cliente",
            deliveryman_id: 20,
            deliveryman_name: "Carlos Entregador",
            completed_at: Date.now() - 86400000,
          },
        ]);
        setLoading(false);
      }, 600);
    }
  }, [profileId, role]);

  return { orders, loading };
}
