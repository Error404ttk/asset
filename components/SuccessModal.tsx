import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    title: string;
    message?: string;
    onClose?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in transition-all">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center animate-scale-in max-w-sm w-full border-4 border-green-50">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-25"></div>
                    <BadgeCheck size={48} className="text-green-600 animate-bounce-short" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
                {message && (
                    <p className="text-slate-500 text-center mb-6">
                        {message}
                    </p>
                )}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full animate-progress-bar"></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">กำลังดำเนินการ...</p>
            </div>
        </div>
    );
};

export default SuccessModal;
