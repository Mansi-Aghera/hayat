import React from 'react';
import { formatCurrency } from './serviceUtils';

const ServiceList = ({ 
  services = [], 
  onDeleteService,
  loading = false
}) => {
  const handleDelete = (index, serviceName) => {
    if (window.confirm(`Are you sure you want to delete "${serviceName}" service?`)) {
      onDeleteService(index);
    }
  };

  if (services.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-300 m-6 rounded-lg">
        <div className="text-6xl mb-4 opacity-50">🏥</div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Services Added</h3>
        <p className="text-slate-600">Add hospital services using the "Add Service" button</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-800">
          Service List ({services.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Service Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Fees (₹)
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Quantity
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Total (₹)
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase tracking-wide text-xs w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {services.map((service, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 text-slate-800 font-medium">
                  {service.hospital_service_data?.name || 'Unknown Service'}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {formatCurrency(service.fees)}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {service.quantity}
                </td>
                <td className="px-4 py-4 text-slate-800 font-medium">
                  {formatCurrency(service.total)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleDelete(index, service.hospital_service_data?.name)}
                      disabled={loading}
                      title="Delete service"
                      className="px-3 py-1 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceList;