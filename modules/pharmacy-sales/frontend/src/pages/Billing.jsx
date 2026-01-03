import React, { useState } from 'react';
import SmartEditor from '../components/SmartEditor';
import SummaryPanel from '../components/SummaryPanel';

const Billing = ({ items, setItems }) => {

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
            <div className="lg:col-span-3 flex flex-col gap-6 h-full">
                {/* Patient Info Header */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-6 items-center">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Patient Name</label>
                        <input type="text" defaultValue="Walk-in Customer" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Doctor</label>
                        <input type="text" placeholder="Dr. Name" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                        <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                </div>

                {/* Smart Editor */}
                <SmartEditor items={items} setItems={setItems} />
            </div>

            <div className="lg:col-span-1 h-full">
                <SummaryPanel items={items} />
            </div>
        </div>
    );
};

export default Billing;
