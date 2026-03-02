
import React, { useEffect, useState } from 'react';
import { Calendar, RefreshCw, FileText } from 'lucide-react';
import { fetchHistory } from '../firebase';
import { HistoryRecord } from '../types';

const HistoryPanel: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (error) {
      console.error("Error loading history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helpers para cor do status
  const getStatusColor = (status?: string) => {
    if (!status) return 'text-gray-600';
    if (status.includes('Excedeu')) return 'text-red-600 font-bold';
    if (status.includes('Restou')) return 'text-green-600 font-bold';
    return 'text-gray-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileText className="text-blue-600 w-6 h-6" />
          <h2 className="text-xl font-bold text-gray-800">Histórico de Visitas (Últimos 30+)</h2>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
        >
          <RefreshCw size={16} /> Atualizar Lista
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Carregando histórico...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Nenhum registro de saída encontrado.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase font-bold border-b">
                <tr>
                  <th className="px-4 py-3">Criança / Resp.</th>
                  <th className="px-4 py-3">Entrada (Real)</th>
                  <th className="px-4 py-3">Saída (Real)</th>
                  <th className="px-4 py-3 text-center">Pacote</th>
                  <th className="px-4 py-3 text-center">Método</th>
                  <th className="px-4 py-3">Status Tempo</th>
                  <th className="px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800">{record.childName}</div>
                      <div className="text-xs text-gray-500">{record.parentName}</div>
                    </td>
                    
                    <td className="px-4 py-3 text-gray-600">
                      {record.formattedEntryTime || new Date(record.entryTime).toLocaleString()}
                    </td>
                    
                    <td className="px-4 py-3 text-gray-600">
                      {record.formattedExitTime || new Date(record.actualExitTime).toLocaleString()}
                    </td>
                    
                    <td className="px-4 py-3 text-center">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-100 uppercase">
                         {record.packageId}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {record.paymentMethod || 'não inf.'}
                      </span>
                    </td>

                    <td className={`px-4 py-3 ${getStatusColor(record.finalStatus)}`}>
                      {record.finalStatus || (record.overstayDuration > 0 ? `Excedeu ${record.overstayDuration}m` : 'Ok')}
                    </td>

                    <td className="px-4 py-3 font-bold text-gray-700">
                      R$ {record.price},00
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;