
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, FileText, Dumbbell, User, Activity, AlertCircle, Info, Loader2, CalendarDays, Repeat, Trash2, Phone, Edit, XCircle, Save, Heart, Plus, CheckCircle } from 'lucide-react';
import { registerChild, subscribeToRegistrations, getNextEnrollmentId, deleteRegistration } from '../firebase';
import { ChildRegistration } from '../types';
import { sendWhatsappDirect, getAcademyMessageTemplate } from '../whatsappService';
import ConfirmationModal from './ConfirmationModal';

interface ChildForm {
  id: string;
  childName: string;
  birthDate: string;
  isPcd: boolean;
  isGymPlan: boolean;
  planDuration: 'monthly' | 'quarterly';
  enrollmentId: string;
  planStartDate: string;
  hasMedicalCondition: boolean;
  medicalConditions: string;
  hasAllergies: boolean;
  allergies: string;
  observations: string;
}

const RegistrationPanel: React.FC = () => {
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const createInitialChild = (): ChildForm => ({
    id: Math.random().toString(36).substr(2, 9),
    childName: '',
    birthDate: '',
    isPcd: false,
    isGymPlan: false,
    planDuration: 'monthly',
    enrollmentId: '',
    planStartDate: getTodayDate(),
    hasMedicalCondition: false,
    medicalConditions: '',
    hasAllergies: false,
    allergies: '',
    observations: ''
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [responsibleName, setResponsibleName] = useState('');
  const [contact1, setContact1] = useState('');
  const [contact2, setContact2] = useState('');
  const [address, setAddress] = useState('');
  const [children, setChildren] = useState<ChildForm[]>([createInitialChild()]);
  const [loading, setLoading] = useState(false);
  
  const [registrations, setRegistrations] = useState<ChildRegistration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ChildRegistration | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToRegistrations(
      (data) => setRegistrations(data),
      (err) => console.error("Erro ao carregar lista:", err)
    );
    return () => unsubscribe();
  }, []);

  const handlePhoneChange = (value: string, setter: (v: string) => void) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = numbers;
    if (numbers.length > 2) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length > 7) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    setter(formatted);
  };

  const updateChildField = async (index: number, field: keyof ChildForm, value: any) => {
    const newChildren = [...children];
    let updatedChild = { ...newChildren[index], [field]: value };
    
    if (field === 'isGymPlan' && value === true && !updatedChild.enrollmentId && !editId) {
      try {
        const nextId = await getNextEnrollmentId();
        let finalId = nextId;
        let offset = 0;
        const currentIdsInForm = newChildren.map(c => c.enrollmentId).filter(id => !!id);
        while (currentIdsInForm.includes(finalId)) {
          offset++;
          const nextVal = parseInt(nextId, 10) + offset;
          finalId = nextVal.toString().padStart(4, '0');
        }
        updatedChild.enrollmentId = finalId;
      } catch (e) {
        console.error("Erro ao buscar próxima matrícula automática");
      }
    }
    newChildren[index] = updatedChild;
    setChildren(newChildren);
  };

  const addChild = () => setChildren([...children, createInitialChild()]);
  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setEditId(null);
    setResponsibleName(''); setContact1(''); setContact2(''); setAddress('');
    setChildren([createInitialChild()]);
  };

  const handleEdit = (reg: ChildRegistration) => {
    setEditId(reg.id);
    setResponsibleName(reg.responsibleName);
    setContact1(reg.contactNumber1);
    setContact2(reg.contactNumber2 || '');
    setAddress(reg.address);
    setChildren([{
      id: reg.id,
      childName: reg.childName,
      birthDate: reg.birthDate,
      isPcd: reg.isPcd || false,
      isGymPlan: reg.isGymPlan,
      planDuration: reg.planDuration || 'monthly',
      enrollmentId: reg.enrollmentId || '',
      planStartDate: reg.planStartDate || getTodayDate(),
      hasMedicalCondition: reg.hasMedicalCondition,
      medicalConditions: reg.medicalConditions || '',
      hasAllergies: reg.hasAllergies,
      allergies: reg.allergies || '',
      observations: reg.observations || ''
    }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRegistration(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      alert("Erro ao excluir.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsibleName.trim() || !contact1 || children.some(c => !c.childName.trim() || !c.birthDate)) {
      alert("Preencha todos os campos obrigatórios (*) para o responsável e todas as crianças.");
      return;
    }

    setLoading(true);
    try {
      for (const child of children) {
        const now = new Date();
        let registrationDay = now.getDate();
        let paymentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        if (child.isGymPlan && child.planStartDate) {
          const sd = new Date(child.planStartDate + 'T12:00:00');
          registrationDay = sd.getDate();
          paymentMonth = `${sd.getFullYear()}-${(sd.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        const originalReg = registrations.find(r => r.id === (editId || child.id));
        const data: ChildRegistration = {
          id: editId || `${child.birthDate.replace(/\D/g, '')}_${contact1.replace(/\D/g, '')}_${child.id}`,
          childName: child.childName.trim(),
          responsibleName: responsibleName.trim(),
          birthDate: child.birthDate,
          isPcd: child.isPcd,
          contactNumber1: contact1,
          contactNumber2: contact2.trim() || "",
          address: address.trim(),
          hasMedicalCondition: child.hasMedicalCondition,
          medicalConditions: child.hasMedicalCondition ? child.medicalConditions.trim() : "",
          hasAllergies: child.hasAllergies,
          allergies: child.hasAllergies ? child.allergies.trim() : "",
          observations: child.observations.trim() || "",
          createdAt: originalReg?.createdAt || Date.now(),
          isGymPlan: child.isGymPlan,
          planDuration: child.isGymPlan ? child.planDuration : 'monthly',
          enrollmentId: child.enrollmentId || "",
          planStartDate: child.isGymPlan ? child.planStartDate : "",
          registrationDay: registrationDay,
          lastPaymentMonth: originalReg?.lastPaymentMonth || paymentMonth
        };
        await registerChild(data);
        if (child.isGymPlan && !editId) {
          const msg = await getAcademyMessageTemplate(data.childName, data.enrollmentId || '');
          sendWhatsappDirect(data.contactNumber1, msg, false);
        }
      }
      resetForm();
      alert(editId ? `Cadastro atualizado!` : `Cadastros realizados com sucesso!`);
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const displayList = (searchTerm: string, registrations: ChildRegistration[]) => {
    const term = searchTerm.toLowerCase();
    const filtered = registrations.filter(reg => {
      return (
        (reg.childName?.toLowerCase() || "").includes(term) ||
        (reg.responsibleName?.toLowerCase() || "").includes(term) ||
        (reg.enrollmentId?.toLowerCase() || "").includes(term)
      );
    });
    return searchTerm ? filtered : filtered.slice(0, 20);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-20">
      <ConfirmationModal 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Excluir Cadastro"
        confirmLabel="Sim, Excluir"
        message={`Deseja excluir permanentemente ${deleteTarget?.childName}?`}
      />

      <div className={`bg-white rounded-2xl shadow-sm border p-8 transition-all ${editId ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-100'}`}>
        <div className="flex justify-between items-center mb-8 border-b pb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              {editId ? <Edit size={24} /> : <UserPlus size={24} />}
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              {editId ? 'Editar Cadastro' : 'Novo Cadastro'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Nome do Responsável *</label>
              <input 
                type="text" 
                className="w-full border-2 border-gray-100 rounded-xl p-4 bg-gray-50 text-black font-bold focus:border-blue-500 outline-none"
                placeholder="Pai, Mãe ou Tutor"
                value={responsibleName}
                onChange={e => setResponsibleName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Telefone Principal *</label>
              <input 
                type="text" 
                className="w-full border-2 border-gray-100 rounded-xl p-4 bg-gray-50 text-black font-bold focus:border-blue-500 outline-none"
                placeholder="(00) 00000-0000"
                value={contact1}
                onChange={e => handlePhoneChange(e.target.value, setContact1)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Telefone Secundário</label>
              <input 
                type="text" 
                className="w-full border-2 border-gray-100 rounded-xl p-4 bg-gray-50 text-black font-bold focus:border-blue-500 outline-none"
                placeholder="(00) 00000-0000"
                value={contact2}
                onChange={e => handlePhoneChange(e.target.value, setContact2)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Endereço Residencial</label>
              <input 
                type="text" 
                className="w-full border-2 border-gray-100 rounded-xl p-4 bg-gray-50 text-black font-bold focus:border-blue-500 outline-none"
                placeholder="Rua, Número, Bairro"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-12">
            {children.map((child, index) => (
              <div key={child.id} className="p-8 rounded-3xl border-2 border-gray-100 bg-white shadow-sm relative animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black">
                        {index + 1}
                      </div>
                      <h3 className="font-black uppercase text-lg text-blue-900 tracking-tighter">CRIANÇA {index + 1}</h3>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateChildField(index, 'isPcd', !child.isPcd)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-sm border-2 ${
                          child.isPcd ? 'bg-pink-100 border-pink-300 text-pink-600' : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        <Heart size={16} fill={child.isPcd ? 'currentColor' : 'none'} />
                        PCD / TEA ❤️
                      </button>

                      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <button
                          type="button"
                          onClick={() => updateChildField(index, 'isGymPlan', false)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!child.isGymPlan ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                        >Convencional</button>
                        <button
                          type="button"
                          onClick={() => updateChildField(index, 'isGymPlan', true)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${child.isGymPlan ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400'}`}
                        >Academia</button>
                      </div>

                      {children.length > 1 && !editId && (
                        <button type="button" onClick={() => removeChild(index)} className="text-red-300 hover:text-red-500 transition-colors p-2">
                          <Trash2 size={20} />
                        </button>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Nome da Criança *</label>
                    <input 
                      type="text" 
                      className="w-full border-2 border-gray-100 rounded-xl p-3 bg-gray-50 text-black font-bold focus:border-blue-500 outline-none"
                      value={child.childName}
                      onChange={e => updateChildField(index, 'childName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Data de Nascimento *</label>
                    <input 
                      type="date" 
                      className="w-full border-2 border-gray-100 rounded-xl p-3 bg-gray-50 text-black font-bold focus:border-blue-500 outline-none"
                      value={child.birthDate}
                      onChange={e => updateChildField(index, 'birthDate', e.target.value)}
                      required
                    />
                  </div>

                  {child.isGymPlan && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 animate-in zoom-in-95">
                       <div>
                         <label className="block text-[10px] font-black text-blue-700 mb-2 uppercase tracking-tight">Matrícula (Sugerida)</label>
                         <input 
                           type="text" 
                           className="w-full border-2 border-blue-100 rounded-lg p-3 font-black text-blue-900 bg-white" 
                           value={child.enrollmentId} 
                           onChange={e => updateChildField(index, 'enrollmentId', e.target.value)} 
                           placeholder="Ex: 0045" 
                         />
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-blue-700 mb-2 uppercase tracking-tight">Duração</label>
                         <select className="w-full border-2 border-blue-100 rounded-lg p-3 font-black text-blue-900 bg-white appearance-none cursor-pointer" value={child.planDuration} onChange={e => updateChildField(index, 'planDuration', e.target.value)}>
                            <option value="monthly">Mensal</option>
                            <option value="quarterly">Trimestral</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-blue-700 mb-2 uppercase tracking-tight">Início do Ciclo</label>
                         <input type="date" className="w-full border-2 border-blue-100 rounded-lg p-3 font-black text-blue-900 bg-white" value={child.planStartDate} onChange={e => updateChildField(index, 'planStartDate', e.target.value)} />
                       </div>
                    </div>
                  )}

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                           <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Condição Médica?</span>
                           <input type="checkbox" checked={child.hasMedicalCondition} onChange={e => updateChildField(index, 'hasMedicalCondition', e.checked)} className="w-5 h-5 rounded text-blue-600" />
                        </div>
                        {child.hasMedicalCondition && (
                          <textarea className="w-full border-2 border-gray-100 rounded-xl p-3 bg-white text-sm font-medium" rows={2} placeholder="Descreva..." value={child.medicalConditions} onChange={e => updateChildField(index, 'medicalConditions', e.target.value)} />
                        )}
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
                           <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Alergias?</span>
                           <input type="checkbox" checked={child.hasAllergies} onChange={e => updateChildField(index, 'hasAllergies', e.checked)} className="w-5 h-5 rounded text-red-600" />
                        </div>
                        {child.hasAllergies && (
                          <textarea className="w-full border-2 border-gray-100 rounded-xl p-3 bg-white text-sm font-medium" rows={2} placeholder="Descreva..." value={child.allergies} onChange={e => updateChildField(index, 'allergies', e.target.value)} />
                        )}
                     </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                      <Info size={14} /> Observações Gerais (Criança {index + 1})
                    </label>
                    <textarea 
                      className="w-full border-2 border-gray-100 rounded-xl p-4 bg-gray-50 text-black font-medium focus:border-blue-500 outline-none transition-all"
                      rows={2}
                      value={child.observations}
                      onChange={e => updateChildField(index, 'observations', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {!editId && (
              <button
                type="button"
                onClick={addChild}
                className="w-full py-6 border-4 border-dashed border-gray-100 rounded-3xl text-gray-300 hover:text-blue-500 hover:border-blue-100 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-3 bg-gray-50 text-gray-400 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Plus size={32} strokeWidth={3} />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">Incluir outra criança para este responsável</span>
              </button>
            )}
          </div>

          <div className="flex gap-4 pt-8">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 text-white font-black text-xl py-6 rounded-3xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${editId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : (editId ? <Save size={24} /> : <CheckCircle size={24} />)}
              {editId ? 'ATUALIZAR CADASTRO' : 'FINALIZAR TODOS OS CADASTROS'}
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-black px-10 rounded-3xl"><XCircle size={24} /></button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={28} />
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Crianças Cadastradas</h2>
          </div>
          <div className="relative w-full md:w-96">
            <input 
              type="text"
              placeholder="Buscar por nome ou matrícula..."
              className="w-full pl-12 pr-6 py-4 border-2 border-gray-100 rounded-2xl bg-gray-50 text-black font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-50">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-400 uppercase font-black text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Matrícula</th>
                <th className="px-6 py-4">Criança</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayList(searchTerm, registrations).map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-black text-blue-600">{reg.enrollmentId || '-'}</td>
                  <td className="px-6 py-4 font-black text-gray-900">
                    <div className="flex items-center gap-2">
                      {reg.childName}
                      {reg.isPcd && <span className="text-pink-500"><Heart size={14} fill="currentColor" /></span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-bold">{reg.responsibleName}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${reg.isGymPlan ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {reg.isGymPlan ? 'Academia' : 'Avulso'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => handleEdit(reg)} className="p-2 text-blue-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                      <button type="button" onClick={() => setDeleteTarget(reg)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPanel;
