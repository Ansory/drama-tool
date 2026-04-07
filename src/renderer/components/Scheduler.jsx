import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const Scheduler = () => {
    const [schedules, setSchedules] = useState([]);
    const [newSchedule, setNewSchedule] = useState({
        videoPath: '',
        caption: '',
        hashtags: '',
        scheduledTime: ''
    });

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        const list = await window.electron.schedulerList();
        setSchedules(list);
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setNewSchedule({ ...newSchedule, videoPath: file.path });
        }
    }, [newSchedule]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const addSchedule = async () => {
        if (!newSchedule.videoPath || !newSchedule.scheduledTime) {
            alert('Pilih video dan waktu jadwal terlebih dahulu');
            return;
        }
        
        const result = await window.electron.schedulerAdd(newSchedule);
        if (result.success) {
            alert('Jadwal berhasil ditambahkan!');
            setNewSchedule({
                videoPath: '',
                caption: '',
                hashtags: '',
                scheduledTime: ''
            });
            loadSchedules();
        }
    };

    const removeSchedule = async (id) => {
        if (confirm('Hapus jadwal ini?')) {
            await window.electron.schedulerRemove(id);
            loadSchedules();
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="scheduler">
            <h2>📅 Scheduler & Auto-posting</h2>
            
            <div className="schedule-form">
                <h3>Tambah Jadwal Baru</h3>
                
                <div {...getRootProps()} className="mini-dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan video di sini...</p> : <p>📹 Drag & drop video, atau klik</p>}
                </div>
                {newSchedule.videoPath && <p className="selected-file">Video: {newSchedule.videoPath.split('\\').pop()}</p>}
                
                <textarea 
                    placeholder="Caption untuk video..."
                    value={newSchedule.caption}
                    onChange={(e) => setNewSchedule({...newSchedule, caption: e.target.value})}
                    rows={3}
                />
                
                <input 
                    type="text" 
                    placeholder="Hashtag (pisahkan dengan spasi)"
                    value={newSchedule.hashtags}
                    onChange={(e) => setNewSchedule({...newSchedule, hashtags: e.target.value})}
                />
                
                <div className="form-row">
                    <input
                        type="datetime-local"
                        value={newSchedule.scheduledTime}
                        onChange={(e) => setNewSchedule({...newSchedule, scheduledTime: new Date(e.target.value).getTime()})}
                    />
                </div>
                
                <button onClick={addSchedule}>Tambah ke Jadwal</button>
            </div>
            
            <div className="schedule-list">
                <h3>📋 Daftar Jadwal</h3>
                {schedules.length === 0 ? (
                    <p className="info-text">Belum ada jadwal. Tambahkan jadwal di atas.</p>
                ) : (
                    <div className="schedule-items">
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className="schedule-item">
                                <div className="schedule-info">
                                    <div className="schedule-video">{schedule.videoPath?.split('\\').pop() || 'No video'}</div>
                                    <div className="schedule-time">📅 {formatDate(schedule.scheduledTime)}</div>
                                    <div className={`schedule-status ${schedule.status}`}>{schedule.status}</div>
                                </div>
                                <div className="schedule-actions">
                                    <button onClick={() => removeSchedule(schedule.id)} className="btn-small btn-danger">Hapus</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Scheduler;
