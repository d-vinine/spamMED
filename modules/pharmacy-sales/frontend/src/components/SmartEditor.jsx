import React, { useState, useRef, useEffect } from 'react';

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
                const response = await fetch('http://localhost:8080/process-sale', {
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
            // ArrowDown doesn't need to do anything in main input
        }

        // DEFAULT INPUT BEHAVIOR (Add New)
        if (e.key === 'Backspace' && inputValue === '') {
            if (items.length > 0) {
                // Originally selected last item, now maybe just start editing it?
                // User said "arrows do what clicking does". 
                // Let's keep Backspace as "Delete Last" or "Edit Last"? 
                // Standard behavior is Delete Last. Let's keep Delete Last for Backspace.
                deleteItem(items.length - 1);
            }
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const text = inputValue.trim();
            if (!text) return;

            try {
                const response = await fetch('http://localhost:8080/process-sale', {
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
        <div id="wrapper" ref={wrapperRef} onClick={handleWrapperClick}>
            <div id="chip-list" ref={chipListRef}>
                {items.map((item, index) => {
                    if (index === editingIndex) {
                        return (
                            <input
                                key={index}
                                autoFocus
                                type="text"
                                className="inline-editor"
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
            />
        </div>
    );
};

const Chip = ({ item, isSelected, onClick }) => {
    let statusClass = item.confidence > 0.8 ? 'status-high' : 'status-med';
    let itemTotal = item.quantity * item.matched_item.price;
    let priceDisplay = `₹${itemTotal.toFixed(2)}`;
    let chipClass = `app-chip ${isSelected ? 'selected' : ''}`;

    let isOOS = item.status === 'OutOfStock';
    let isUnknown = item.status === 'Unknown';

    if (isOOS) {
        statusClass = 'status-oos';
        priceDisplay = 'OOS';
        chipClass += ' chip-oos';
    } else if (isUnknown) {
        statusClass = 'status-unknown';
        priceDisplay = 'Unknown';
        chipClass += ' chip-unknown';
    }

    return (
        <div className={chipClass} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <span className="chip-name">{item.matched_item.name}</span>
            {(!isOOS && !isUnknown) && <span className="chip-qty">{item.quantity}</span>}
            <span className="chip-price">{priceDisplay}</span>
            <div className={`chip-status ${statusClass}`} title={`Confidence: ${(item.confidence * 100).toFixed(0)}%`}></div>
        </div>
    );
};

export default SmartEditor;
