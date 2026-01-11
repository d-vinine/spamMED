import React, { useState, useEffect } from 'react';

const ItemModal = ({ onClose, item, batch, mode, onSave, inventoryItems = [] }) => {
    // Mode: 'CREATE', 'EDIT', 'ADD_BATCH', 'EDIT_BATCH'
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        stock: '',
        mrp: '',
        batch: '',
        location: '',
        expiry: ''
    });
    const [warning, setWarning] = useState(null); // { message: string, suggestion: string }
    const [knowledgeBase, setKnowledgeBase] = useState([]);

    useEffect(() => {
        if (mode === 'CREATE') {
            fetch('/api/items/knowledge-base')
                .then(res => res.json())
                .then(data => setKnowledgeBase(data || []))
                .catch(err => console.error("Failed to load knowledge base for autocomplete", err));
        }
    }, [mode]);

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (mode === 'EDIT' && item) {
            setFormData({
                name: item.name,
                category: item.category || item.description || '',
                stock: item.stock || 0,
                mrp: item.price || '',
                batch: '',
                location: '',
                expiry: ''
            });
        } else if (mode === 'ADD_BATCH') {
            setFormData(prev => ({ ...prev, name: item.name }));
        } else if (mode === 'EDIT_BATCH' && batch) {
            setFormData({
                name: item.name,
                category: item.category || '',
                stock: batch.quantity,
                mrp: batch.mrp,
                batch: batch.batch_number,
                location: batch.location,
                expiry: batch.expiry_date ? batch.expiry_date.split('T')[0] : ''
            });
        }
    }, [mode, item, batch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (name === 'name') {
            setWarning(null); // Clear warning on type
            // Autocomplete Logic
            if (value.length > 0 && mode === 'CREATE') {
                const searchPool = knowledgeBase.length > 0 ? knowledgeBase : inventoryItems || [];
                const matches = searchPool.filter(i =>
                    i.name.toLowerCase().includes(value.toLowerCase())
                ).slice(0, 5);

                setSuggestions(matches);
                setShowSuggestions(matches.length > 0);
            } else {
                setShowSuggestions(false);
            }
        }
    };

    const handleSelectSuggestion = (suggestion) => {
        setFormData(prev => ({
            ...prev,
            name: suggestion.name,
            category: suggestion.category || suggestion.description || prev.category
        }));
        setShowSuggestions(false);
        setWarning(null);
    };

    const checkDuplicate = async (e) => {
        const name = e.target.value;
        if (!name || mode !== 'CREATE') return;

        try {
            const res = await fetch(`/api/items/check?name=${encodeURIComponent(name)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.exists) {
                    if (data.suggestion && data.suggestion !== name) {
                        setWarning({
                            message: `Similar item already exists: "${data.suggestion}"`,
                            suggestion: data.suggestion
                        });
                    } else {
                        setWarning({
                            message: `Item "${name}" already exists.`,
                            suggestion: null
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Check duplicate failed", err);
        }
    };

    const applySuggestion = () => {
        if (warning?.suggestion) {
            setFormData(prev => ({ ...prev, name: warning.suggestion }));
            setWarning(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            mode,
            item_id: item?.id,
            batch_id: batch?.id
        });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
                    {mode === 'CREATE' && 'Create New Item'}
                    {mode === 'EDIT' && 'Edit Item'}
                    {mode === 'ADD_BATCH' && 'Add Batch'}
                    {mode === 'EDIT_BATCH' && 'Edit Batch'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(mode === 'CREATE' || mode === 'EDIT') && (
                        <>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Item Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={checkDuplicate}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                    autoComplete="off"
                                />
                                {showSuggestions && (
                                    <ul style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: 'white', border: '1px solid #e2e8f0', borderTop: 'none',
                                        zIndex: 1000, listStyle: 'none', padding: 0, margin: 0,
                                        maxHeight: '200px', overflowY: 'auto',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', borderRadius: '0 0 8px 8px'
                                    }}>
                                        {suggestions.map(s => (
                                            <li
                                                key={s.id}
                                                // Using onMouseDown to prevent blur from hiding suggestions before click registers
                                                onMouseDown={() => handleSelectSuggestion(s)}
                                                style={{
                                                    padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee',
                                                    fontSize: '0.9rem', color: '#1f2937'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                                                onMouseLeave={(e) => e.target.style.background = 'white'}
                                            >
                                                <strong>{s.name}</strong>
                                                <span style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '8px' }}>
                                                    {s.category || s.description}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {warning && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#b45309', backgroundColor: '#fffbeb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fcd34d' }}>
                                        {warning.message}
                                        {warning.suggestion && (
                                            <button
                                                type="button"
                                                onClick={applySuggestion}
                                                style={{ marginLeft: '0.5rem', textDecoration: 'underline', color: '#b45309', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }}
                                            >
                                                Use "{warning.suggestion}"?
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Category / Description</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                        </>
                    )}

                    {(mode === 'ADD_BATCH' || mode === 'EDIT_BATCH') && (
                        <>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Quantity</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>MRP (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="mrp"
                                        value={formData.mrp}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Batch Number</label>
                                    <input
                                        type="text"
                                        name="batch"
                                        value={formData.batch}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. Shelf A"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Expiry Date</label>
                                <input
                                    type="date"
                                    name="expiry"
                                    value={formData.expiry}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{
                            padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer'
                        }}>Cancel</button>
                        <button type="submit" style={{
                            padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: 'var(--color-primary, #2563eb)', color: 'white', cursor: 'pointer'
                        }}>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemModal;
