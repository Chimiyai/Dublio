//src/components/projects/TaskBoard.tsx
'use client';

import { useState } from 'react';
import { Task, TaskStatus, TaskType, TeamMember, User } from '@prisma/client';
import { toast } from 'react-hot-toast';

// Gelen propların tiplerini tanımlayalım
type TaskWithAssignees = Task & {
  assignees: { user: { username: string, profileImage: string | null } }[];
};
type TeamMemberWithUser = TeamMember & { user: { username: string } };

interface Props {
  initialTasks: TaskWithAssignees[];
  teamMembers: TeamMemberWithUser[];
  viewerRole: string;
  projectId: number;
}

// Kanban panosundaki sütunlar
const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export default function TaskBoard({ initialTasks, teamMembers, viewerRole, projectId }: Props) {
  const [tasks, setTasks] = useState(initialTasks);

  // Yeni görev formu için basit bir state
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('TRANSLATION');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTaskTitle) return;

    toast.loading("Görev oluşturuluyor...");
    try {
        const response = await fetch(`/api/projects/${projectId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTaskTitle, type: newTaskType })
        });
        const newTask = await response.json();
        toast.dismiss();
        if(!response.ok) throw new Error(newTask.message || "Hata");
        
        toast.success("Görev oluşturuldu!");
        setTasks(prev => [...prev, newTask]);
        setShowNewTaskForm(false);
        setNewTaskTitle('');
    } catch(error: any) {
        toast.dismiss();
        toast.error(error.message);
    }
  };

  return (
    <div>
      <h2>Proje Stüdyosu - Görev Panosu</h2>
      
      {/* Sadece Lider/Admin yeni görev ekleyebilir */}
      {['LEADER', 'ADMIN'].includes(viewerRole) && (
        <div style={{ margin: '20px 0' }}>
          <button onClick={() => setShowNewTaskForm(!showNewTaskForm)}>
            {showNewTaskForm ? 'Formu Kapat' : '+ Yeni Görev Ekle'}
          </button>
          {showNewTaskForm && (
            <form onSubmit={handleCreateTask} style={{ marginTop: '10px', background: '#222', padding: '10px', display: 'flex', gap: '10px' }}>
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Görev Başlığı" />
              <select value={newTaskType} onChange={e => setNewTaskType(e.target.value as TaskType)}>
                {Object.values(TaskType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <button type="submit">Oluştur</button>
            </form>
          )}
        </div>
      )}

      {/* Kanban Panosu */}
      <div style={{ display: 'flex', gap: '15px', overflowX: 'auto' }}>
        {statuses.map(status => (
          <div key={status} style={{ flex: '1 1 280px', minWidth: '280px', background: '#1c1c1c', padding: '10px' }}>
            <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>{status}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {tasks.filter(task => task.status === status).map(task => (
                <div key={task.id} style={{ background: '#333', padding: '15px', borderRadius: '5px' }}>
                  <p>{task.title}</p>
                  <small style={{ background: 'gray', padding: '2px 5px', borderRadius: '3px' }}>{task.type}</small>
                  {/* Atananları göster */}
                  <div style={{marginTop: '10px', display: 'flex', gap: '5px'}}>
                    {task.assignees.map(a => (
                      <img key={a.user.username} src={a.user.profileImage || `https://ui-avatars.com/api/?name=${a.user.username}`} title={a.user.username} style={{width: '24px', height: '24px', borderRadius: '50%'}} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}