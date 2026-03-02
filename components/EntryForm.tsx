
import React, { useState, useEffect, useRef } from 'react';
import { PenLine, Plus, Trash2, Search, Loader2, Check, Calendar, CreditCard, Dumbbell, AlertTriangle, Clock, Repeat, Heart, MinusCircle } from 'lucide-react';
import { Package, KidEntry, ChildRegistration, HistoryRecord, PaymentMethod } from '../types';
import { addEntry, subscribeToRegistrations, updateRegistrationMonthlyPayment, getApiConfigOnce } from '../firebase';
import { sendWhatsappDirect, getWelcomeMessageTemplate, getRenewalThanksMessageTemplate } from '../whatsappService';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import PaymentMethodModal from './PaymentMethodModal';

interface ChildEntryRow {
  name: string;
  isPcd: boolean;
}

const PACKAGES: Package[] = [
  { id: 'A', name: 'Pacote A', durationMinutes: 30, price: 20 },
  { id: 'B', name: 'Pacote B', durationMinutes: 60, price: 30 },
  { id: 'GYM', name: 'Plano Academia', durationMinutes: 90, price: 0 },
];

const EntryForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [allRegistrations, setAllRegistrations] = useState<ChildRegistration[]>([]);
  const [suggestions, setSuggestions] = useState<ChildRegistration[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [parentName, setParentName] = useState('');
  const [children, setChildren] = useState<ChildEntryRow[]>([{ name: '', isPcd: false }]);
  const [phone, setPhone] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package['id']>('A');
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const [selectedGymChild, setSelectedGymChild] = useState<ChildRegistration | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPlanDuration, setEditingPlanDuration] = useState<'monthly' | 'quarterly'>('monthly');

  useEffect(() => {
    const unsubscribe = subscribeToRegistrations(
      (data) => setAllRegistrations(data),
      (err) => console.error("Erro:", err)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lógica de Cálculo Individualizada: Cada criança PCD ganha 20% de desconto no valor do pacote
  useEffect(() => {
    if (selectedGymChild) {
      setCalculatedPrice(0);
      setSelectedPackage('GYM');
    } else {
      const pkg = PACKAGES.find(p => p.id === selectedPackage)!;
      
      const totalPrice = children.reduce((sum, child) => {
        if (!child.name.trim() && children.length > 1) return sum;
        const basePrice = pkg.price;
        const finalPrice = child.isPcd ? basePrice * 0.8 : basePrice;
        return sum + finalPrice;
      }, 0);
      
      setCalculatedPrice(totalPrice);
    }
  }, [selectedPackage, children, selectedGymChild]);

  const handleSearch = (val: string) => {
    setParentName(val);
    if (val.length > 1) {
      const term = val.toLowerCase();
      const filtered = allRegistrations.filter(reg => 
        (reg.responsibleName?.toLowerCase() || "").includes(term) ||
        (reg.childName?.toLowerCase() || "").includes(term) ||
        (reg.contactNumber1?.includes(val)) ||
        (reg.enrollmentId?.includes(val))
      );
      setSuggestions(filtered.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      if (val === '') {
        setSelectedGymChild(null);
      }
    }
  };

  const selectSuggestion = (reg: ChildRegistration) => {
    setParentName(reg.responsibleName || '');
    setChildren([{ name: reg.childName, isPcd: !!reg.isPcd }]);
    setPhone(reg.contactNumber1);
    
    if (reg.isGymPlan) {
      setSelectedGymChild(reg);
      setSelectedPackage('GYM');
      setEditingPlanDuration(reg.planDuration || 'monthly');
    } else {
      setSelectedGymChild(null);
      setSelectedPackage('A');
    }
    setShowSuggestions(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = value;
    if (value.length > 10) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    else if (value.length > 6) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    else if (value.length > 2) formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    setPhone(formatted);
  };

  const addChildRow = () => setChildren([...children, { name: '', isPcd: false }]);
  
  const removeChildRow = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index: number, field: keyof ChildEntryRow, value: any) => {
    const newChildren = [...children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setChildren(newChildren);
  };

  const isMonthlyOverdue = () => {
    if (!selectedGymChild) return false;
    const now = new Date();
    const [lastYear, lastMonth] = (selectedGymChild.lastPaymentMonth || '0000-00').split('-').map(Number);
    const lastDate = new Date(lastYear, lastMonth - 1, 1);
    const currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const diffMonths = (currentDate.getFullYear() - lastDate.getFullYear()) * 12 + (currentDate.getMonth() - lastDate.getMonth());
    const gracePeriod = selectedGymChild.planDuration === 'quarterly' ? 3 : 1;
    if (diffMonths < gracePeriod) return false;
    return now.getDate() >= (selectedGymChild.registrationDay || 1);
  };

  const toggleMonthlyPaid = async (method: PaymentMethod) => {
    if (!selectedGymChild) return;
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    try {
      setLoading(true);
      const config = await getApiConfigOnce();
      let basePrice = editingPlanDuration === 'quarterly' 
        ? (config?.gymQuarterlyPrice || 400) 
        : (config?.gymMonthlyPrice || 150);
      
      if (selectedGymChild.isPcd) basePrice = basePrice * 0.8;

      await updateRegistrationMonthlyPayment(selectedGymChild.id, currentMonthYear, method, editingPlanDuration);
      const db = getFirestore();
      await addDoc(collection(db, 'history'), {
        childName: selectedGymChild.childName,
        parentName: selectedGymChild.responsibleName,
        contactNumber: selectedGymChild.contactNumber1,
        entryTime: Date.now(),
        actualExitTime: Date.now(),
        packageId: 'GYM_PAY',
        packageDuration: 0,
        timeSpent: 0,
        overstayDuration: 0,
        price: basePrice,
        isPaid: true,
        paymentMethod: method,
        isGymPlan: true,
        isPcd: selectedGymChild.isPcd,
        formattedEntryTime: now.toLocaleString('pt-BR'),
        formattedExitTime: now.toLocaleString('pt-BR'),
        formattedTimeSpent: "Mensalidade",
        finalStatus: `Mensalidade ${editingPlanDuration === 'quarterly' ? 'Trim' : 'Mens'}`,
      });
      const planLabel = editingPlanDuration === 'quarterly' ? 'Trimestral' : 'Mensal';
      const thanksMsg = await getRenewalThanksMessageTemplate(selectedGymChild.childName, planLabel);
      await sendWhatsappDirect(selectedGymChild.contactNumber1, thanksMsg, false);
      setSelectedGymChild({ ...selectedGymChild, lastPaymentMonth: currentMonthYear, planDuration: editingPlanDuration });
      setShowPaymentModal(false);
      alert(`Baixa confirmada!`);
    } catch (e) { alert("Erro no pagamento."); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGymChild && isMonthlyOverdue()) {
      alert("Pagamento pendente!");
      return;
    }
    setLoading(true);
    try {
      let newEntry: Omit<KidEntry, 'id'>;
      if (selectedGymChild) {
        newEntry = {
          parentName: selectedGymChild.responsibleName,
          childName: selectedGymChild.childName,
          contactNumber: selectedGymChild.contactNumber1,
          packageId: 'GYM',
          packageDuration: 90, 
          entryTime: Date.now(),
          price: 0,
          isPaid: true, 
          paymentMethod: 'não informado',
          isGymPlan: true,
          isPcd: selectedGymChild.isPcd,
          planDuration: selectedGymChild.planDuration,
          enrollmentId: selectedGymChild.enrollmentId,
          hasMedicalCondition: selectedGymChild.hasMedicalCondition,
          hasAllergies: selectedGymChild.hasAllergies,
          observations: selectedGymChild.observations
        };
      } else {
        const pkg = PACKAGES.find(p => p.id === selectedPackage)!;
        newEntry = {
          parentName: parentName.trim(),
          childName: children.map(c => c.name).filter(n => n.trim()).join(', '),
          contactNumber: phone,
          packageId: pkg.id,
          packageDuration: pkg.durationMinutes,
          entryTime: Date.now(),
          price: calculatedPrice,
          isPaid: false,
          isGymPlan: false,
          isPcd: children.some(c => c.isPcd)
        };
      }
      await addEntry(newEntry);
      sendWhatsappDirect(newEntry.contactNumber, await getWelcomeMessageTemplate(newEntry.childName), false);
      setParentName(''); setChildren([{ name: '', isPcd: false }]); setPhone(''); setSelectedGymChild(null); setSelectedPackage('A');
      alert("Entrada registrada!");
    } catch (err: any) { alert(`Erro: ${err.message}`); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 h-fit">
      {showPaymentModal && <PaymentMethodModal onSelect={toggleMonthlyPaid} onClose={() => setShowPaymentModal(false)} title="Baixa de Mensalidade" />}
      <div className="flex items-center space-x-2 text-gray-800 mb-6">
        <PenLine className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">Nova Entrada</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative" ref={suggestionRef}>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-tight">Responsável / Busca</label>
          <div className="relative">
            <input type="text" className="w-full border border-gray-300 rounded-md p-3 bg-gray-50 text-black font-bold focus:ring-2 focus:ring-blue-300 outline-none" value={parentName} onChange={e => handleSearch(e.target.value)} placeholder="Digite para buscar..." />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
              <div className="bg-blue-600 px-4 py-1 text-[9px] font-black text-white uppercase tracking-widest">Cadastros Encontrados</div>
              {suggestions.map((reg) => (
                <div key={reg.id} onClick={() => selectSuggestion(reg)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center group">
                  <div>
                    <div className="font-black text-black group-hover:text-blue-700 flex items-center gap-2">
                      {reg.responsibleName} {reg.isGymPlan && <span className="text-blue-500 text-[10px]">[Academia]</span>}
                      {reg.isPcd && <span className="text-pink-500"><Heart size={12} fill="currentColor" /></span>}
                    </div>
                    <div className="text-xs text-gray-500">{reg.childName} | {reg.contactNumber1}</div>
                  </div>
                  <Check className="text-blue-500 opacity-0 group-hover:opacity-100" size={18} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-tight">Criança(s)</label>
          {children.map((child, index) => (
            <div key={index} className="flex gap-2 items-center animate-in slide-in-from-left-2">
              <input 
                type="text" 
                className="flex-1 border border-gray-300 rounded-md p-2.5 bg-gray-50 text-black font-bold disabled:opacity-75" 
                value={child.name} 
                onChange={e => updateChild(index, 'name', e.target.value)} 
                required 
                placeholder={`Criança ${index + 1}`}
                disabled={!!selectedGymChild} 
              />
              
              {!selectedGymChild && (
                <button
                  type="button"
                  onClick={() => updateChild(index, 'isPcd', !child.isPcd)}
                  className={`p-2.5 rounded-md border-2 transition-all active:scale-90 ${child.isPcd ? 'bg-pink-100 border-pink-300 text-pink-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-300'}`}
                  title="PCD / TEA ❤️"
                >
                  <Heart size={18} fill={child.isPcd ? 'currentColor' : 'none'} />
                </button>
              )}

              {!selectedGymChild && children.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeChildRow(index)} 
                  className="text-red-400 hover:text-red-600 p-1 active:scale-90"
                  title="Remover Criança"
                >
                  <MinusCircle size={22} />
                </button>
              )}

              {!selectedGymChild && index === children.length - 1 && (
                <button type="button" onClick={addChildRow} className="bg-blue-600 text-white p-2.5 rounded-md hover:bg-blue-700 shadow-sm active:scale-90">
                  <Plus size={18} strokeWidth={3} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase">Telefone</label>
          <input type="text" className="w-full border border-gray-300 rounded-md p-2.5 bg-gray-50 text-black font-bold disabled:opacity-75" value={phone} onChange={handlePhoneChange} required disabled={!!selectedGymChild} />
        </div>

        {selectedGymChild && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center border-b border-blue-100 pb-2">
               <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Plano Academia Ativo</span>
                  {selectedGymChild.isPcd && (
                    <span className="text-[10px] font-black text-pink-500 uppercase flex items-center gap-1 mt-1">
                      <Heart size={10} fill="currentColor" /> Benefício PCD/TEA Ativo
                    </span>
                  )}
               </div>
               <Dumbbell className="text-blue-500" size={18} />
            </div>
            {isMonthlyOverdue() && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertTriangle size={18} />
                  <span className="text-xs font-black uppercase">Mensalidade Vencida!</span>
                </div>
                <button type="button" onClick={() => setShowPaymentModal(true)} className="w-full bg-white border-2 border-blue-600 text-blue-600 font-black py-2 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2">
                   <Repeat size={14} /> Dar Baixa agora
                </button>
              </div>
            )}
          </div>
        )}

        {children.some(c => c.isPcd) && !selectedGymChild && (
          <div className="bg-pink-50 border border-pink-100 rounded-lg p-3 flex items-center justify-between animate-in zoom-in-95">
             <div className="flex items-center gap-2 text-pink-700">
                <Heart size={16} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-widest">Benefício PCD/TEA Individual</span>
             </div>
             <span className="text-[10px] font-black text-pink-600">- 20% OFF Aplicado</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-2 uppercase tracking-tight">Escolher Pacote</label>
          <div className="grid grid-cols-2 gap-2">
            {PACKAGES.filter(p => p.id !== 'GYM').map((pkg) => (
              <div key={pkg.id} onClick={() => setSelectedPackage(pkg.id)} className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${selectedPackage === pkg.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'}`}>
                <div className="font-bold text-black text-sm">{pkg.name}</div>
                <div className="text-[10px] text-gray-500 uppercase">{pkg.durationMinutes} min - R$ {pkg.price}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 flex justify-between items-center shadow-inner">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Subtotal:</span>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-green-700">R$ {calculatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>

        <button type="submit" disabled={loading} className={`w-full text-white font-black text-lg py-4 rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${selectedGymChild ? 'bg-blue-600' : 'bg-green-600'} ${selectedGymChild && isMonthlyOverdue() ? 'opacity-50' : ''}`}>
          {loading ? <Loader2 className="animate-spin" size={24} /> : 'Registrar Entrada'}
        </button>
      </form>
    </div>
  );
};

export default EntryForm;
