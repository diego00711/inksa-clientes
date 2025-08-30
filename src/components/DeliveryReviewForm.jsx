export default function DeliveryReviewForm({ deliverymanId, orderId, onSuccess }) {
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        alert(`Avaliação do entregador ${deliverymanId} enviada!`);
        onSuccess?.();
      }}
    >
      <label>
        Nota:
        <input type="number" min="1" max="5" defaultValue={5} />
      </label>
      <button type="submit">Enviar avaliação entregador</button>
    </form>
  );
}
