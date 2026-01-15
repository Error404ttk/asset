import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: (SelectOption | string)[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

const Select: React.FC<SelectProps> = ({
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Select option...',
    required = false,
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Normalize options to object format
    const normalizedOptions: SelectOption[] = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        if (disabled) return;
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                className={`w-full border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition-colors bg-white ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : 'border-slate-200 hover:border-slate-300'
                    } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={`block truncate ${!selectedOption?.label ? 'text-slate-400' : 'text-slate-800'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in">
                    <ul className="py-1">
                        {normalizedOptions.map((option, idx) => (
                            <li
                                key={idx}
                                className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between group hover:bg-primary-50 hover:text-primary-700 ${value === option.value ? 'bg-primary-50 text-priority-700 font-medium' : 'text-slate-700'
                                    }`}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check size={16} className="text-primary-600" />}
                            </li>
                        ))}
                        {normalizedOptions.length === 0 && (
                            <li className="px-4 py-2 text-sm text-slate-400 italic">No options</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Select;
