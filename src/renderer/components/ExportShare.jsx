import React, { useState } from 'react';

const ExportShare = () => {
    const [exportType, setExportType] = useState('pdf');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [exporting, setExporting] = useState(false);

    const exportPDF = async () => {
        setExporting(true);
        const data = {
            report: 'Weekly Performance Report',
            date: new Date().toLocaleDateString(),
            metrics: {
                totalViews: 125000,
                engagement: 4.2,
                newFollowers: 1250
            }
        };
        const result = await window.electron.exportPDF({ data, filename: `report_${Date.now()}` });
        if (result.success) {
            alert(`PDF berhasil diekspor: ${result.outputPath}`);
        }
        setExporting(false);
    };

    const sendWhatsApp = async () => {
        if (!whatsappNumber) {
            alert('Masukkan nomor WhatsApp');
            return;
        }
        setExporting(true);
        const result = await window.electron.exportWhatsapp({
            phoneNumber: whatsappNumber,
            message: 'Laporan performa mingguan Drama Tool telah siap!',
            filePath: null
        });
        alert(result.message);
        setExporting(false);
    };

    return (
        <div className="export-share">
            <h2>📤 Export & Share</h2>
            
            <div className="export-section">
                <h3>📄 Ekspor Laporan</h3>
                <div className="export-options">
                    <label>
                        <input type="radio" value="pdf" checked={exportType === 'pdf'} onChange={(e) => setExportType(e.target.value)} />
                        PDF Report
                    </label>
                    <label>
                        <input type="radio" value="csv" checked={exportType === 'csv'} onChange={(e) => setExportType(e.target.value)} />
                        CSV Data
                    </label>
                    <label>
                        <input type="radio" value="json" checked={exportType === 'json'} onChange={(e) => setExportType(e.target.value)} />
                        JSON Backup
                    </label>
                </div>
                <button onClick={exportPDF} disabled={exporting}>
                    {exporting ? 'Mengekspor...' : `📥 Ekspor sebagai ${exportType.toUpperCase()}`}
                </button>
            </div>
            
            <div className="share-section">
                <h3>💬 Share ke WhatsApp</h3>
                <input 
                    type="text" 
                    placeholder="Nomor WhatsApp (contoh: 628123456789)"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                />
                <button onClick={sendWhatsApp} disabled={exporting}>
                    📱 Kirim ke WhatsApp
                </button>
            </div>
            
            <div className="share-section">
                <h3>☁️ Share ke Google Drive</h3>
                <button onClick={() => alert('Fitur integrasi Google Drive akan segera hadir!')}>
                    🔗 Hubungkan Google Drive
                </button>
            </div>
            
            <div className="share-section">
                <h3>📧 Email Report</h3>
                <button onClick={() => alert('Fitur email report akan segera hadir!')}>
                    📧 Kirim via Email
                </button>
            </div>
        </div>
    );
};

export default ExportShare;
