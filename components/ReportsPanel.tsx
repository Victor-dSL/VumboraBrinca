
import React, { useState, useEffect } from 'react';
import { Calendar, Download, Search, FileSpreadsheet, RefreshCw, Trophy, Star, Phone, UserCheck, CheckCircle, Loader2, Users } from 'lucide-react';
import { fetchHistoryByDateRange, fetchHistory, resetFidelityForPhone, fetchFidelityResets, fetchRegistrationsByDateRange } from '../firebase';
import { HistoryRecord, ChildRegistration } from '../types';

interface LoyaltyRecord {
  parentName: string;
  phone: string;
  count: number;
  id?: string;
}

const ReportsPanel: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [loyaltyTop5, setLoyaltyTop5] = useState<LoyaltyRecord[]>([]);
  const [resetting, setResetting] = useState<string | null>(null);

  const calculateLoyalty = async () => {
    try {
      const allHistory = await fetchHistory(5000);
      const resets = await fetchFidelityResets();
      const aggregation: Record<string, LoyaltyRecord> = {};
      
      allHistory.forEach(rec => {
        const phoneKey = rec.contactNumber.replace(/\D/g, '');
        if (!phoneKey) return;

        const resetTimestamp = resets[phoneKey] || 0;
        if (rec.actualExitTime <= resetTimestamp) return;

        if (!aggregation[phoneKey]) {
          aggregation[phoneKey] = {
            parentName: rec.parentName,
            phone: rec.contactNumber,
            count: 0
          };
        }
        aggregation[phoneKey].count += 1;
      });

      const sorted = Object.values(aggregation)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setLoyaltyTop5(sorted);
    } catch (e) {
      console.error("Erro ao calcular fidelidade:", e);
    }
  };

  useEffect(() => {
    calculateLoyalty();
  }, []);

  const handleGrantPlan = async (loy: LoyaltyRecord) => {
    if (!window.confirm(`Confirmar concessão de brinde para ${loy.parentName}? O contador será zerado.`)) return;
    
    setResetting(loy.phone);
    try {
      await resetFidelityForPhone(loy.phone);
      await calculateLoyalty(); 
      alert(`Plano concedido com sucesso para ${loy.parentName}! Contador reiniciado.`);
    } catch (e) {
      console.error(e);
      alert("Erro ao processar reset de fidelidade.");
    } finally {
      setResetting(null);
    }
  };

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      alert("Por favor, selecione as datas inicial e final.");
      return;
    }

    setLoading(true);
    try {
      const startTimestamp = new Date(startDate + 'T00:00:00').getTime();
      const endTimestamp = new Date(endDate + 'T23:59:59').getTime();
      
      const data = await fetchHistoryByDateRange(startTimestamp, endTimestamp);
      setResults(data);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Ocorreu um erro ao buscar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const exportRegisteredChildren = async () => {
    if (!startDate || !endDate) {
      alert("Selecione um período para exportar os cadastros.");
      return;
    }

    setExportLoading(true);
    try {
      const startTimestamp = new Date(startDate + 'T00:00:00').getTime();
      const endTimestamp = new Date(endDate + 'T23:59:59').getTime();
      const data = await fetchRegistrationsByDateRange(startTimestamp, endTimestamp);

      if (data.length === 0) {
        alert("Nenhum cadastro encontrado neste período.");
        return;
      }

      const headers = ['Matrícula', 'Criança', 'Nascimento', 'Responsável', 'Telefone', 'Plano', 'Data Cadastro', 'Vencimento (Dia)', 'Saúde/Obs'];
      const rows = data.map(reg => [
        `"${reg.enrollmentId || '-'}"`,
        `"${reg.childName}"`,
        `"${reg.birthDate}"`,
        `"${reg.responsibleName}"`,
        `"${reg.contactNumber1}"`,
        `"${reg.isGymPlan ? 'Academia' : 'Convencional'}"`,
        `"${new Date(reg.createdAt).toLocaleDateString()}"`,
        reg.registrationDay,
        `"${reg.medicalConditions || ''} ${reg.allergies || ''} ${reg.observations || ''}"`
      ]);

      const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cadastros_Vumbora_${startDate}_a_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Erro ao exportar cadastros.");
    } finally {
      setExportLoading(false);
    }
  };

  const exportToExcel = () => {
    if (results.length === 0) return;
    const headers = ['Criança', 'Responsável', 'Contato', 'Entrada', 'Saída', 'Pacote', 'Método', 'Permanência', 'Status Tempo', 'Valor (R$)', 'Pago'];
    const rows = results.map(rec => [
      `"${rec.childName}"`, `"${rec.parentName}"`, `"${rec.contactNumber}"`, `"${rec.formattedEntryTime}"`,
      `"${rec.formattedExitTime}"`, `"${rec.packageId}"`, `"${rec.paymentMethod || 'não inf.'}"`, `"${rec.formattedTimeSpent}"`, `"${rec.finalStatus}"`,
      rec.price, rec.isPaid ? 'Sim' : 'Não'
    ]);
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Vumbora_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPeriod = results.reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Tabela de Fidelidade */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-blue-600 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-yellow-400" />
            <h2 className="text-lg font-bold">Plano Fidelidade - Top 5</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-blue-50 text-blue-800 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-3 text-center w-20">Rank</th>
                <th className="px-6 py-3">Responsável</th>
                <th className="px-6 py-3">Telefone</th>
                <th className="px-6 py-3 text-center">Progresso (Meta 10)</th>
                <th className="px-6 py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loyaltyTop5.length > 0 ? loyaltyTop5.map((loy, index) => (
                <tr key={`${loy.phone}_${index}`} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {index + 1}º
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800 uppercase">{loy.parentName}</td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{loy.phone}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-black text-lg">{loy.count}/10</span>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${Math.min((loy.count / 10) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {loy.count >= 10 && (
                      <button 
                        onClick={() => handleGrantPlan(loy)}
                        className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-4 py-2 rounded-md transition-all active:scale-95 shadow-md animate-bounce"
                      >
                        PLANO CONCEDIDO ✅
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic font-bold">Carregando fidelidade...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <FileSpreadsheet className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Exportar Relatórios</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-600 mb-1">Data Inicial</label>
            <input 
              type="date" 
              className="w-full border rounded-md p-2.5 bg-gray-50 text-black focus:ring-2 focus:ring-blue-200 outline-none"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-600 mb-1">Data Final</label>
            <input 
              type="date" 
              className="w-full border rounded-md p-2.5 bg-gray-50 text-black focus:ring-2 focus:ring-blue-200 outline-none"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            Buscar Atendimentos
          </button>
          <button
            onClick={exportRegisteredChildren}
            disabled={exportLoading}
            className="bg-gray-800 hover:bg-black text-white font-bold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {exportLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Users className="w-5 h-5" />}
            Exportar Cadastros
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <div className="text-sm text-black">
              <span className="font-bold">{results.length}</span> atendimentos encontrados.
            </div>
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-md flex items-center gap-2 shadow-sm transition-colors"
            >
              <Download size={18} /> Exportar Atendimentos (.csv)
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 text-black uppercase font-bold border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3">Criança</th>
                  <th className="px-4 py-3">Saída</th>
                  <th className="px-4 py-3 text-center">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 text-black">
                    <td className="px-4 py-3 font-bold">{rec.childName}</td>
                    <td className="px-4 py-3">{rec.formattedExitTime}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-700">R$ {rec.price},00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPanel;
