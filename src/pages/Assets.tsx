import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { Plus, X, History } from 'lucide-react';

const assetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  asset_tag: z.string().min(1, 'Asset tag is required'),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  status: z.enum(['active', 'out_of_service', 'retired']),
});

type AssetForm = z.infer<typeof assetSchema>;

export function Assets() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<number | null>(null);

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await api.get('/assets');
      return res.data.items || [];
    }
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['asset-history', selectedAssetForHistory],
    queryFn: async () => {
      if (!selectedAssetForHistory) return [];
      const res = await api.get(`/assets/${selectedAssetForHistory}/history`);
      return res.data || [];
    },
    enabled: !!selectedAssetForHistory
  });

  const createMutation = useMutation({
    mutationFn: async (data: AssetForm) => {
      const res = await api.post('/assets', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowForm(false);
      reset();
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
    defaultValues: { status: 'active' },
  });

  const onSubmit = (data: AssetForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Equipment Assets</h1>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-1" />
            Add Asset
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Create New Asset</h2>
            <button onClick={() => { setShowForm(false); reset(); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Tag *</label>
                <input {...register('asset_tag')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. EQ-1042" />
                {errors.asset_tag && <p className="text-red-500 text-xs mt-1">{errors.asset_tag.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input {...register('name')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. HVAC Unit A" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                <input {...register('manufacturer')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                <input {...register('model')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                <input {...register('serial_number')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                <input {...register('location')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Roof North" />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select {...register('status')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="active">Active</option>
                  <option value="out_of_service">Out of Service</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
              >
                {createMutation.isPending ? 'Saving...' : 'Save Asset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Tag</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Location</th>
                <th className="px-6 py-3 font-semibold">Model/Serial</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading assets...</td>
                </tr>
              ) : assetsData?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No assets found. Click 'Add Asset' to create one.</td>
                </tr>
              ) : (
                assetsData?.map((asset: any) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{asset.asset_tag}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium">{asset.name}</td>
                    <td className="px-6 py-4 text-slate-600">{asset.location}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="text-xs">{asset.manufacturer} {asset.model}</div>
                      <div className="text-xs text-slate-400">{asset.serial_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        asset.status === 'active' ? 'bg-green-100 text-green-800' :
                        asset.status === 'out_of_service' ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedAssetForHistory(asset.id)}
                        className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition-colors"
                        title="View Maintenance History"
                      >
                        <History className="w-4 h-4 mr-1" />
                        History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {selectedAssetForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Maintenance History</h2>
              <button 
                onClick={() => setSelectedAssetForHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingHistory ? (
                <div className="text-center text-slate-500 py-8">Loading history...</div>
              ) : historyData?.length === 0 ? (
                <div className="text-center text-slate-500 py-8 italic">No maintenance history recorded for this asset.</div>
              ) : (
                <div className="space-y-6">
                  {historyData?.map((item: any) => (
                    <div key={item.id} className="relative pl-6 border-l-2 border-slate-200 last:border-0 pb-6 last:pb-0">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                      <div className="mb-1 flex justify-between items-start">
                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                        <span className="text-xs text-slate-500">{new Date(item.completed_at || item.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                      
                      {item.notes && item.notes.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Notes</h4>
                          {item.notes.map((note: any) => (
                            <div key={note.id} className="text-sm">
                              <p className="text-slate-700">{note.content}</p>
                              <p className="text-xs text-slate-400 mt-1">Tech #{note.author_id} • {new Date(note.created_at).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
