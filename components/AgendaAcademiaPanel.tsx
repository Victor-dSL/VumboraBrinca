
import React, { useState, useEffect } from 'react';
import { GripVertical, User, Calendar, Clock, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { subscribeToRegistrations, subscribeToAssignments, saveAssignment, deleteAssignment } from '../firebase';
import { ChildRegistration } from '../types';

const TIME_SLOTS = [
    '16:00', '16:30', '17:30', '18:30', '19:30', '20:30'
];

const MAX_STUDENTS_PER_SLOT = 10;

interface Assignment {
    id: string; // registrationId
    startSlotIndex: number;
}

const AgendaAcademiaPanel: React.FC = () => {
    const [gymRegistrations, setGymRegistrations] = useState<ChildRegistration[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = subscribeToAssignments((data) => {
            setAssignments(data as Assignment[]);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToRegistrations(
            (data) => {
                setGymRegistrations(data.filter(r => r.isGymPlan));
            },
            (err) => console.error(err)
        );
        return () => unsubscribe();
    }, []);



    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('registrationId', id);
    };

    const handleDrop = (e: React.DragEvent, slotIndex: number) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('registrationId');
        if (!id) return;

        // Verificar limite de 10 alunos no slot específico
        const currentOccupants = getOccupantsForSlot(slotIndex);
        // Se o aluno já estiver no slot (movendo), não contamos ele no limite
        const otherOccupants = currentOccupants.filter(oc => oc.id !== id);
        if (otherOccupants.length >= MAX_STUDENTS_PER_SLOT) {
            alert(`Limite de ${MAX_STUDENTS_PER_SLOT} alunos atingido no horário das ${TIME_SLOTS[slotIndex]}!`);
            return;
        }

        saveAssignment({ id, startSlotIndex: slotIndex });
    };

    const handleRemove = (id: string) => {
        if (window.confirm("Remover da agenda?")) {
            deleteAssignment(id);
        }
    };

    const isOccupied = (slotIndex: number, assignment: Assignment) => {
        // Cada agendamento agora ocupa apenas 1 slot (30 min conforme lista)
        return slotIndex === assignment.startSlotIndex;
    };

    const getOccupantsForSlot = (slotIndex: number) => {
        return assignments.filter(a => isOccupied(slotIndex, a));
    };

    const filteredRegistrations = gymRegistrations.filter(r =>
        r.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.responsibleName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <Calendar size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Agenda Plano Academia</h2>
                            <p className="text-blue-100 text-xs opacity-80">Organize os horários dos alunos matriculados</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}${window.location.pathname}?page=agendar`;
                                navigator.clipboard.writeText(url);
                                alert("Link de agendamento copiado!");
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all backdrop-blur-sm border border-white/20"
                        >
                            Copiar Link Público
                        </button>
                        <Clock className="text-white/20" size={48} />
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* LISTA DE PAIS/ALUNOS (DRAGGABLE) */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Buscar Aluno</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Nome do pai ou criança..."
                                    className="w-full border-2 border-gray-100 rounded-xl p-3 pl-10 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredRegistrations.length === 0 ? (
                                <p className="text-[10px] text-gray-400 font-bold italic text-center py-4">Nenhum aluno encontrado</p>
                            ) : (
                                filteredRegistrations.map(reg => {
                                    const isAssigned = assignments.some(a => a.id === reg.id);
                                    return (
                                        <div
                                            key={reg.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, reg.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-grab active:cursor-grabbing group shadow-sm ${isAssigned
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="text-gray-300 group-hover:text-blue-400" size={18} />
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-[11px] font-black text-blue-900 uppercase truncate">
                                                        {reg.responsibleName}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 truncate">
                                                        Filho(a): {reg.childName}
                                                    </p>
                                                </div>
                                                {isAssigned && <CheckCircle2 className="text-blue-500" size={16} />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase text-center p-2 border-t border-dashed">
                            💡 Arraste o aluno para um horário na agenda
                        </p>
                    </div>

                    {/* TIMELINE / AGENDA */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 gap-3">
                            {TIME_SLOTS.map((time, index) => {
                                const occupants = getOccupantsForSlot(index);
                                return (
                                    <div
                                        key={time}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleDrop(e, index)}
                                        className="flex items-center gap-4 group"
                                    >
                                        {/* HORA */}
                                        <div className="w-20 flex flex-col items-end">
                                            <span className="text-xs font-black text-gray-800">{time}</span>
                                            {occupants.length > 0 && (
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md mt-1 ${occupants.length >= MAX_STUDENTS_PER_SLOT
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {occupants.length} Aluno{occupants.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <div className="w-px h-8 bg-gray-200 group-last:hidden mr-4 mt-1"></div>
                                        </div>

                                        {/* SLOT DE DROP */}
                                        <div className={`flex-1 min-h-[60px] p-3 rounded-2xl border-2 border-dashed transition-all flex flex-wrap gap-2 items-center ${occupants.length === 0
                                            ? 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                                            : occupants.length >= MAX_STUDENTS_PER_SLOT
                                                ? 'bg-green-50/50 border-green-200 ring-2 ring-green-50 shadow-sm'
                                                : 'bg-white border-blue-100 ring-2 ring-blue-50 shadow-sm'
                                            }`}>
                                            {occupants.length === 0 ? (
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest pl-4">Livre</span>
                                            ) : (
                                                occupants.map(occ => {
                                                    const reg = gymRegistrations.find(r => r.id === occ.id);
                                                    if (!reg) return null;
                                                    const isStart = occ.startSlotIndex === index;
                                                    return (
                                                        <div
                                                            key={occ.id}
                                                            className={`px-3 py-2 rounded-xl flex items-center gap-2 animate-in zoom-in-95 duration-200 ${occupants.length >= MAX_STUDENTS_PER_SLOT ? 'bg-green-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md'
                                                                }`}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black uppercase leading-none text-white">{reg.responsibleName}</span>
                                                                <span className="text-[8px] font-bold opacity-70 leading-none text-blue-50">{reg.childName}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemove(occ.id)}
                                                                className="ml-1 hover:text-red-200 transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgendaAcademiaPanel;
