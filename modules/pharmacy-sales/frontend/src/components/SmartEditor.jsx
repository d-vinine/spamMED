import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const SmartEditor = ({ items, setItems }) => {
    const [inputValue, setInputValue] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1); // -1 means Bottom Input is focused
    const [editingIndex, setEditingIndex] = useState(-1); // -1 means no item is being edited inline
    const [editValue, setEditValue] = useState(''); // Text for the inline editor

    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const chipListRef = useRef(null);

    // Focus main input on load
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleWrapperClick = (e) => {
        // If clicking background and NOT editing inline, focus main input
        if (editingIndex === -1 && (e.target === wrapperRef.current || e.target.id === 'chip-list')) {
            inputRef.current?.focus();
            setFocusedIndex(-1);
        }
    };

    const startEditing = (index) => {
        const item = items[index];
        setEditingIndex(index);
        // Reconstruct input so user can edit quantity
        const name = item.captured_name || item.matched_item.name;
        setEditValue(`${name} ${item.quantity}`);
        setFocusedIndex(-1); // Lose navigational focus
    };

    const deleteItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);

        if (newItems.length === 0) {
            setFocusedIndex(-1);
            inputRef.current?.focus();
        } else if (index >= newItems.length) {
            setFocusedIndex(newItems.length - 1);
        }
    };

    const handleInlineKeyDown = async (e, index) => {
        // Clear Line Shortcut
        if (e.key === 'Backspace' && e.shiftKey) {
            e.preventDefault();
            setEditValue('');
            return;
        }

        // Delete Item Shortcut
        if (e.key === 'Delete') {
            e.preventDefault();
            deleteItem(index);
            setEditingIndex(-1);
            inputRef.current?.focus();
            return;
        }

        // NAVIGATE BETWEEN ITEMS
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (index > 0) {
                startEditing(index - 1);
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (index < items.length - 1) {
                startEditing(index + 1);
            } else {
                setEditingIndex(-1);
                inputRef.current?.focus();
            }
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const text = editValue.trim();

            if (!text) {
                deleteItem(index);
                setEditingIndex(-1);
                return;
            }

            try {
                const response = await fetch('http://localhost:8081/process-sale', {
                    method: 'POST',
                    body: text
                });
                const data = await response.json();

                if (data) {
                    const newItems = [...items];
                    newItems.splice(index, 1, ...data);
                    setItems(newItems);
                    setEditingIndex(-1);
                    // Focus main input after successful edit
                    inputRef.current?.focus();
                }
            } catch (err) {
                console.error("API Error", err);
            }
        }
        if (e.key === 'Escape') {
            setEditingIndex(-1);
            inputRef.current?.focus();
        }
    };

    const handleMainKeyDown = async (e) => {
        // Clear Line Shortcut
        if (e.key === 'Backspace' && e.shiftKey) {
            e.preventDefault();
            setInputValue('');
            return;
        }

        // ARROW NAVIGATION (Directly to Edit Mode)
        if (inputValue === '') {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length > 0) {
                    startEditing(items.length - 1);
                }
                return;
            }
        }

        // DEFAULT INPUT BEHAVIOR (Add New)
        if (e.key === 'Backspace' && inputValue === '') {
            if (items.length > 0) {
                deleteItem(items.length - 1);
            }
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const text = inputValue.trim();
            if (!text) return;

            try {
                const response = await fetch('http://localhost:8081/process-sale', {
                    method: 'POST',
                    body: text
                });
                const data = await response.json();

                if (data && data.length > 0) {
                    setItems(prev => [...prev, ...data]);
                    setInputValue('');
                    setTimeout(() => {
                        wrapperRef.current?.scrollTo({ top: wrapperRef.current.scrollHeight, behavior: 'smooth' });
                    }, 10);
                }
            } catch (err) {
                console.error("API Error", err);
            }
        }
    };

    return (
        <div
            id="wrapper"
            ref={wrapperRef}
            onClick={handleWrapperClick}
            className="flex-1 bg-white border border-slate-200 rounded-xl overflow-y-auto flex flex-col shadow-sm relative"
        >
            <div id="chip-list" ref={chipListRef} className="w-full flex flex-col">
                {items.map((item, index) => {
                    if (index === editingIndex) {
                        return (
                            <input
                                key={index}
                                autoFocus
                                type="text"
                                className="w-full bg-slate-50 border-b border-brand-200 text-slate-900 font-mono text-lg px-6 py-4 outline-none"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleInlineKeyDown(e, index)}
                                onBlur={() => setEditingIndex(-1)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        );
                    }
                    return (
                        <Chip
                            key={index}
                            item={item}
                            isSelected={index === focusedIndex}
                            onClick={() => startEditing(index)}
                        />
                    );
                })}
            </div>

            <div className="p-1 sticky bottom-0 bg-white">
                <input
                    type="text"
                    id="dynamic-input"
                    placeholder={items.length === 0 ? "Scan item or type (e.g. dolo 12)..." : "Add more..."}
                    autoComplete="off"
                    spellCheck="false"
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setFocusedIndex(-1);
                    }}
                    onKeyDown={handleMainKeyDown}
                    className="w-full bg-transparent text-slate-900 font-mono text-lg px-6 py-4 outline-none placeholder:text-slate-400"
                />
            </div>
        </div>
    );
};

const Chip = ({ item, isSelected, onClick }) => {
    let statusColor = "bg-yellow-100 border-yellow-200"; // Medium confidence default

    if (item.confidence > 0.8) statusColor = "bg-green-100 border-green-200";

    let itemTotal = item.quantity * item.matched_item.price;
    let priceDisplay = `₹${itemTotal.toFixed(2)}`;

    let isOOS = item.status === 'OutOfStock';
    let isUnknown = item.status === 'Unknown';

    let chipBg = "bg-white hover:bg-slate-50";
    let textColor = "text-slate-700";
    let priceColor = "text-brand-600 font-bold";

    if (isSelected) {
        chipBg = "bg-brand-50";
    }

    if (isOOS) {
        chipBg = "bg-red-50 hover:bg-red-100 border-red-100";
        priceDisplay = "OOS";
        priceColor = "text-red-500 font-bold";
    } else if (isUnknown) {
        chipBg = "bg-slate-100 opacity-60";
        priceDisplay = "Unknown";
        priceColor = "text-slate-500";
    }

    return (
        <div
            className={cn(
                "flex items-center px-6 py-4 border-b border-slate-100 gap-6 cursor-default transition-colors",
                chipBg
            )}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            <span className={cn("flex-1 font-medium", textColor)}>{item.matched_item.name}</span>

            {(!isOOS && !isUnknown) && (
                <span className="shrink-0 w-16 text-center bg-slate-100 rounded text-sm py-0.5 text-slate-600 font-mono font-medium">
                    {item.quantity}
                </span>
            )}

            <span className={cn("shrink-0 w-24 text-right font-mono", priceColor)}>
                {priceDisplay}
            </span>

            <div
                className={cn("w-2 h-2 rounded-full", statusColor)}
                title={`Confidence: ${(item.confidence * 100).toFixed(0)}%`}
            ></div>
        </div>
    );
};

export default SmartEditor;
