import React, { useState, useEffect } from 'react';

const EditingTemplate = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        transitions: [],
        textStyles: {},
        effects: []
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const templateList = await window.electron.templateGetAll();
        setTemplates(templateList);
    };

    const saveTemplate = async () => {
        if (!newTemplate.name) {
            alert('Masukkan nama template');
            return;
        }
        const saved = await window.electron.templateSave(newTemplate);
        setTemplates([...templates, saved]);
        setNewTemplate({ name: '', description: '', transitions: [], textStyles: {}, effects: [] });
        alert('Template saved!');
    };

    const applyTemplate = async (template) => {
        setSelectedTemplate(template);
        alert(`Template "${template.name}" diterapkan!`);
    };

    const presetTemplates = [
        { name: 'Drama Sedih', icon: '😭', transitions: 'fade', textStyle: 'kuning besar', effects: 'blur' },
        { name: 'Action Epic', icon: '⚔️', transitions: 'zoom', textStyle: 'merah tebal', effects: 'shake' },
        { name: 'Romantis', icon: '💕', transitions: 'soft', textStyle: 'pink italic', effects: 'glow' },
        { name: 'Plot Twist', icon: '🎭', transitions: 'flash', textStyle: 'putih bold', effects: 'slowmo' }
    ];

    return (
        <div className="editing-template">
            <h2>🎨 Editing Template</h2>
            
            <div className="preset-section">
                <h3>📁 Preset Template</h3>
                <div className="preset-grid">
                    {presetTemplates.map((preset, i) => (
                        <div key={i} className="preset-card" onClick={() => applyTemplate(preset)}>
                            <div className="preset-icon">{preset.icon}</div>
                            <div className="preset-name">{preset.name}</div>
                            <div className="preset-detail">{preset.transitions} | {preset.textStyle}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="custom-section">
                <h3>✏️ Buat Template Custom</h3>
                <div className="form-group">
                    <input type="text" placeholder="Nama Template" value={newTemplate.name} onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} />
                </div>
                <div className="form-group">
                    <textarea placeholder="Deskripsi" value={newTemplate.description} onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})} />
                </div>
                <div className="form-row">
                    <select>
                        <option>Transisi: Fade</option>
                        <option>Transisi: Zoom</option>
                        <option>Transisi: Slide</option>
                        <option>Transisi: Flash</option>
                    </select>
                    <select>
                        <option>Gaya Teks: Kuning Besar</option>
                        <option>Gaya Teks: Putih Bold</option>
                        <option>Gaya Teks: Pink Italic</option>
                    </select>
                    <select>
                        <option>Efek: Blur</option>
                        <option>Efek: Glow</option>
                        <option>Efek: Shake</option>
                    </select>
                </div>
                <button onClick={saveTemplate}>💾 Simpan Template</button>
            </div>
            
            <div className="templates-list">
                <h3>📋 Template Saya</h3>
                {templates.length === 0 ? (
                    <p className="info-text">Belum ada template custom. Buat template di atas.</p>
                ) : (
                    templates.map((template) => (
                        <div key={template.id} className="template-item">
                            <div className="template-info">
                                <div className="template-name">{template.name}</div>
                                <div className="template-desc">{template.description}</div>
                            </div>
                            <button onClick={() => applyTemplate(template)}>Terapkan</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EditingTemplate;
