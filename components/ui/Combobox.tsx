import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface ComboboxProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    required?: boolean;
}

const Combobox: React.FC<ComboboxProps> = ({
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Select option...',
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search or current value if closed
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (option: string) => {
        onChange(option);
        setSearch('');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder={placeholder}
                    value={isOpen ? search : value}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        if (!isOpen) setIsOpen(true);
                        // Allow custom value (creatable)
                        if (isOpen) {
                            // When typing, we don't immediately change the 'value' prop unless we want it to reflect typing
                            // But for a combobox, usually we want the underlying value to update OR we treat it as a search
                            // Since this is a "Creatable" combobox, typing IS changing the value.
                            onChange(e.target.value);
                        }
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearch(value); // Initialize search with current value
                    }}
                    required={required}
                />
                <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => {
                        if (isOpen) {
                            setIsOpen(false);
                        } else {
                            setIsOpen(true);
                            setSearch(value);
                        }
                    }}
                >
                    <ChevronDown size={18} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in">
                    {filteredOptions.length > 0 ? (
                        <ul className="py-1">
                            {filteredOptions.map((option, idx) => (
                                <li
                                    key={idx}
                                    className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between group hover:bg-primary-50 hover:text-primary-700 ${value === option ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700'}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option}
                                    {value === option && <Check size={16} />}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 italic">
                            "{search}" จะถูกบันทึกเป็นรายการใหม่
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Combobox;
