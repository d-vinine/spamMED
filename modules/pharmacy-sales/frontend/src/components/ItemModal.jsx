import React, { useState, useEffect } from 'react';

const ItemModal = ({ onClose, item, batch, mode, onSave }) => {
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
                    {mode === 'CREATE' && 'Add New Item'}
                    {mode === 'EDIT' && 'Edit Item'}
                    {mode === 'ADD_BATCH' && 'Add Batch'}
                    {mode === 'EDIT_BATCH' && 'Edit Batch'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(mode === 'CREATE' || mode === 'EDIT') && (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Item Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                />
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

                    {(mode === 'CREATE' || mode === 'ADD_BATCH' || mode === 'EDIT_BATCH') && (
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
