export function WorkOrders() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Create Work Order
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <p className="text-gray-600">Work order list and filters will go here.</p>
      </div>
    </div>
  );
}
