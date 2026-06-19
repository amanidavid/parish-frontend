'use client';
import { useMemo } from 'react';
import { SERVICE_REGISTRY } from '@/modules/services/serviceRegistry';

const DEMO_OUTLETS = [
  { id: 1, name: 'Main Restaurant', tables: 24, orders: 45, revenue: '1,250,000', status: 'open' },
  { id: 2, name: 'Rooftop Bar', tables: 12, orders: 28, revenue: '680,000', status: 'open' },
  { id: 3, name: 'Poolside Grill', tables: 8, orders: 15, revenue: '420,000', status: 'closed' },
];

const DEMO_ORDERS = [
  { id: 'ORD-001', table: 'T-04', items: 3, total: '45,000', time: '10:23 AM', status: 'served' },
  { id: 'ORD-002', table: 'T-12', items: 5, total: '82,000', time: '10:45 AM', status: 'preparing' },
  { id: 'ORD-003', table: 'T-07', items: 2, total: '28,000', time: '11:02 AM', status: 'pending' },
  { id: 'ORD-004', table: 'T-15', items: 4, total: '65,000', time: '11:18 AM', status: 'served' },
  { id: 'ORD-005', table: 'T-03', items: 1, total: '18,000', time: '11:30 AM', status: 'preparing' },
];

const DEMO_MENU = [
  { id: 1, name: 'Grilled Tilapia', category: 'Main Course', price: '35,000', available: true },
  { id: 2, name: 'Beef Burger', category: 'Main Course', price: '28,000', available: true },
  { id: 3, name: 'Caesar Salad', category: 'Starter', price: '18,000', available: true },
  { id: 4, name: 'Chicken Wings', category: 'Starter', price: '22,000', available: false },
  { id: 5, name: 'Tropical Smoothie', category: 'Beverage', price: '12,000', available: true },
];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    open: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-gray-50 text-gray-600 border-gray-200',
    served: 'bg-green-50 text-green-700 border-green-200',
    preparing: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

export default function RestaurantDemo() {
  const config = SERVICE_REGISTRY.restaurant;

  const stats = useMemo(() => ({
    outlets: DEMO_OUTLETS.filter((o) => o.status === 'open').length,
    tables: DEMO_OUTLETS.reduce((sum, o) => sum + o.tables, 0),
    orders: DEMO_ORDERS.length,
    revenue: DEMO_OUTLETS.reduce((sum, o) => sum + parseInt(o.revenue.replace(/,/g, '')), 0),
  }), []);

  const revenueFormatted = `TSh ${(stats.revenue / 1000000).toFixed(2)}M`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Restaurant POS</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage outlets, menu, orders and payments</p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)` }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Outlets" value={stats.outlets} color={config.color} />
        <StatCard label="Total Tables" value={stats.tables} color={config.color} />
        <StatCard label="Today\'s Orders" value={stats.orders} color={config.color} sub="Active" />
        <StatCard label="Today\'s Revenue" value={revenueFormatted} color={config.color} sub="All outlets" />
      </div>

      {/* Outlets */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Outlets</h2>
          <span className="text-xs text-gray-400">{DEMO_OUTLETS.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Outlet</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Tables</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_OUTLETS.map((outlet) => (
                <tr key={outlet.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{outlet.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{outlet.tables}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{outlet.orders}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">TSh {outlet.revenue}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={outlet.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Orders + Menu side by side on large screens */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Orders */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Active Orders</h2>
            <span className="text-xs text-gray-400">{DEMO_ORDERS.length} orders</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ORDERS.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{order.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{order.table}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{order.items}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">TSh {order.total}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Menu Items</h2>
            <span className="text-xs text-gray-400">{DEMO_MENU.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Available</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_MENU.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">TSh {item.price}</td>
                    <td className="px-4 py-3">
                      {item.available ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Out
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
