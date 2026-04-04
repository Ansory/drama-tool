import React, { useState, useEffect } from 'react';

const TeamCollab = () => {
    const [members, setMembers] = useState([]);
    const [newMember, setNewMember] = useState({ email: '', role: 'editor' });
    const [activeProject, setActiveProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        const teamMembers = await window.electron.teamListMembers();
        setMembers(teamMembers);
    };

    const addMember = async () => {
        if (!newMember.email) {
            alert('Masukkan email anggota');
            return;
        }
        await window.electron.teamAddMember(newMember);
        alert(`Undangan dikirim ke ${newMember.email}`);
        setNewMember({ email: '', role: 'editor' });
        loadMembers();
    };

    const updateRole = async (memberId, newRole) => {
        await window.electron.teamUpdateRole({ memberId, role: newRole });
        loadMembers();
    };

    const getRoleIcon = (role) => {
        const icons = {
            admin: '👑',
            editor: '✏️',
            scheduler: '📅',
            viewer: '👁️'
        };
        return icons[role] || '👤';
    };

    return (
        <div className="team-collab">
            <h2>👥 Team Collaboration</h2>
            
            <div className="team-section">
                <h3>Anggota Tim</h3>
                <div className="add-member">
                    <input 
                        type="email" 
                        placeholder="Email anggota"
                        value={newMember.email}
                        onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    />
                    <select value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})}>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="scheduler">Scheduler</option>
                        <option value="viewer">Viewer</option>
                    </select>
                    <button onClick={addMember}>+ Undang</button>
                </div>
                
                <div className="members-list">
                    {members.map((member) => (
                        <div key={member.id} className="member-card">
                            <div className="member-avatar">{getRoleIcon(member.role)}</div>
                            <div className="member-info">
                                <div className="member-email">{member.email}</div>
                                <div className="member-role">
                                    <select value={member.role} onChange={(e) => updateRole(member.id, e.target.value)}>
                                        <option value="admin">Admin</option>
                                        <option value="editor">Editor</option>
                                        <option value="scheduler">Scheduler</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                            </div>
                            <div className={`member-status ${member.status}`}>{member.status}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="project-section">
                <h3>Proyek Aktif</h3>
                <div className="project-list">
                    <div className="project-card" onClick={() => setActiveProject('The Double EP5')}>
                        🎬 The Double - Episode 5
                        <span className="project-status">12 clips, 3 komentar</span>
                    </div>
                    <div className="project-card" onClick={() => setActiveProject('Hidden Love EP10')}>
                        🎬 Hidden Love - Episode 10
                        <span className="project-status">8 clips, 1 komentar</span>
                    </div>
                </div>
                
                {activeProject && (
                    <div className="project-discussion">
                        <h4>Diskusi: {activeProject}</h4>
                        <div className="comments-list">
                            {comments.map((comment, i) => (
                                <div key={i} className="comment-item">
                                    <strong>{comment.author}</strong>: {comment.text}
                                </div>
                            ))}
                        </div>
                        <div className="new-comment">
                            <input 
                                type="text" 
                                placeholder="Tulis komentar..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button onClick={() => {
                                if (newComment) {
                                    setComments([...comments, { author: 'Saya', text: newComment }]);
                                    setNewComment('');
                                }
                            }}>Kirim</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamCollab;
