
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, MapPin, Baby, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { subscribeToRegistrations, saveRegistration, saveAssignment, subscribeToAssignments } from '../firebase';
import { ChildRegistration } from '../types';

const TIME_SLOTS = ['16:00', '16:30', '17:30', '18:30', '19:30', '20:30'];
const MAX_STUDENTS_PER_SLOT = 10;

const PublicBooking: React.FC = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [assignments, setAssignments] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        responsibleName: '',
        phone: '',
        address: '',
        selectedSlot: '',
        children: [{ name: '', birthday: '' }]
    });

    useEffect(() => {
        const unsubscribe = subscribeToAssignments((data) => {
            setAssignments(data);
        });
        return () => unsubscribe();
    }, []);

    const getOccupancy = (slotTime: string) => {
        const slotIndex = TIME_SLOTS.indexOf(slotTime);
        return assignments.filter(a => a.startSlotIndex === slotIndex).length;
    };

    const handleAddChild = () => {
        setFormData(prev => ({
            ...prev,
            children: [...prev.children, { name: '', birthday: '' }]
        }));
    };

    const handleRemoveChild = (index: number) => {
        setFormData(prev => ({
            ...prev,
            children: prev.children.filter((_, i) => i !== index)
        }));
    };

    const handleChildChange = (index: number, field: string, value: string) => {
        const newChildren = [...formData.children];
        newChildren[index] = { ...newChildren[index], [field]: value };
        setFormData(prev => ({ ...prev, children: newChildren }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.selectedSlot) return alert("Selecione um horário");

        setLoading(true);
        try {
            const slotIndex = TIME_SLOTS.indexOf(formData.selectedSlot);

            for (const child of formData.children) {
                // 1. Salvar Cadastro
                const regData: Partial<ChildRegistration> = {
                    childName: child.name,
                    responsibleName: formData.responsibleName,
                    contactNumber1: formData.phone,
                    address: formData.address,
                    isGymPlan: true,
                    registrationDay: new Date().getDate(),
                    createdAt: Date.now()
                };

                const regId = await saveRegistration(regData as ChildRegistration);

                // 2. Salvar na Agenda
                await saveAssignment({
                    id: regId,
                    startSlotIndex: slotIndex
                });
            }

            setSuccess(true);
        } catch (error) {
            console.error(error);
            alert("Erro ao realizar agendamento. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-[40px] shadow-2xl p-12 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={60} />
                    </div>
                    <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">Tudo Pronto!</h2>
                    <p className="text-gray-500 font-bold">Seu agendamento foi realizado com sucesso. Esperamos por vocês!</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg shadow-blue-200 active:scale-95 transition-all"
                    >
                        Novo Agendamento
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Calendar size={32} /> Vumbora Brincá
                        </h1>
                        <p className="text-blue-100 font-bold uppercase text-[10px] tracking-[0.2em] opacity-80 mt-2">
                            Agendamento Plano Academia
                        </p>
                    </div>
                    <div className="absolute top-[-20px] right-[-20px] opacity-10">
                        <Clock size={150} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
                    {/* Sessão 1: Responsável */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b-2 border-blue-50 pb-2">
                            <User className="text-blue-600" size={20} />
                            <h3 className="text-sm font-black text-blue-900 uppercase">Informações do Responsável</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase">Nome Completo</label>
                                <input
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                    placeholder="Seu nome..."
                                    value={formData.responsibleName}
                                    onChange={e => setFormData({ ...formData, responsibleName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase">WhatsApp / Telefone</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                        required
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        placeholder="(00) 00000-0000"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Endereço (Opcional)</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                    placeholder="Rua, número, bairro..."
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sessão 2: Crianças */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b-2 border-blue-50 pb-2">
                            <div className="flex items-center gap-3">
                                <Baby className="text-blue-600" size={20} />
                                <h3 className="text-sm font-black text-blue-900 uppercase">Dados da(s) Criança(s)</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddChild}
                                className="flex items-center gap-1 text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                <Plus size={12} /> ADICIONAR
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.children.map((child, index) => (
                                <div key={index} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 relative animate-in slide-in-from-top-2">
                                    {formData.children.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveChild(index)}
                                            className="absolute top-4 right-4 text-red-300 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase">Nome da Criança</label>
                                            <input
                                                required
                                                className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                                                value={child.name}
                                                onChange={e => handleChildChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase">Aniversário</label>
                                            <input
                                                required
                                                type="date"
                                                className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                                                value={child.birthday}
                                                onChange={e => handleChildChange(index, 'birthday', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sessão 3: Horário */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b-2 border-blue-50 pb-2">
                            <Clock className="text-blue-600" size={20} />
                            <h3 className="text-sm font-black text-blue-900 uppercase">Escolha o Horário</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {TIME_SLOTS.map(time => {
                                const occupancy = getOccupancy(time);
                                const isFull = occupancy >= MAX_STUDENTS_PER_SLOT;
                                const isSelected = formData.selectedSlot === time;

                                return (
                                    <button
                                        key={time}
                                        type="button"
                                        disabled={isFull}
                                        onClick={() => setFormData({ ...formData, selectedSlot: time })}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${isFull
                                                ? 'bg-red-50 border-red-100 opacity-50 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                                                    : 'bg-white border-gray-100 hover:border-blue-300'
                                            }`}
                                    >
                                        <span className="text-lg font-black">{time}</span>
                                        <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-blue-100' : isFull ? 'text-red-500' : 'text-gray-400'}`}>
                                            {isFull ? 'LOTADO' : `${MAX_STUDENTS_PER_SLOT - occupancy} Vagas`}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black text-lg uppercase shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? 'Processando...' : <><CheckCircle2 /> Confirmar Agendamento</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PublicBooking;
