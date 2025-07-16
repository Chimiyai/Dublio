//src/components/projects/TaskBoard.tsx
'use client';

import { useState } from 'react';

import { Task, TaskStatus, TaskType, TeamMember, User } from '@prisma/client';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import TaskDetailModal from './TaskDetailModal';

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

const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

// Tek bir görev kartını temsil eden bileşen
function TaskCard({ task, index, onClick }: { task: TaskWithAssignees, index: number, onClick: () => void }) {
    return (
        <Draggable draggableId={task.id.toString()} index={index}>
            {(provided) => (
                <div
                    onClick={onClick} // <-- Tıklama olayını ekledik
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ cursor: 'pointer',
                        background: '#333',
                        padding: '15px',
                        borderRadius: '5px',
                        ...provided.draggableProps.style,
                    }}
                >
                    <p>{task.title}</p>
                    <small style={{ background: 'gray', padding: '2px 5px', borderRadius: '3px' }}>{task.type}</small>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                        {task.assignees.map(a => (
                            <img key={a.user.username} src={a.user.profileImage || `https://ui-avatars.com/api/?name=${a.user.username}`} title={a.user.username} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                        ))}
                    </div>
                </div>
            )}
        </Draggable>
    );
}


export default function TaskBoard({ initialTasks, teamMembers, viewerRole, projectId }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('TRANSLATION');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  // YENİ: Yeni görev için seçilen atananları tutan state
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState<number[]>([]);

  // Checkbox değiştiğinde çalışacak fonksiyon
  const handleAssigneeChange = (memberId: number) => {
    setNewTaskAssigneeIds(prev => 
        prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };
  
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTaskTitle) return;

    toast.loading("Görev oluşturuluyor...");
    try {
        const response = await fetch(`/api/projects/${projectId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Body'ye assigneeIds'i de ekliyoruz
            body: JSON.stringify({ 
                title: newTaskTitle, 
                type: newTaskType, 
                assigneeIds: newTaskAssigneeIds 
            })
        });
        const newTask = await response.json();
        toast.dismiss();
        if(!response.ok) throw new Error(newTask.message || "Hata");
        
        toast.success("Görev oluşturuldu!");
        setTasks(prev => [...prev, newTask]);
        setShowNewTaskForm(false);
        setNewTaskTitle('');
        setNewTaskAssigneeIds([]);
    } catch(error: any) {
        toast.dismiss();
        toast.error(error.message);
    }
  };
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Eğer görev, geçerli bir hedefe bırakılmadıysa, hiçbir şey yapma
    if (!destination) return;

    // Eğer görev, başladığı yere geri bırakıldıysa, hiçbir şey yapma
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId as TaskStatus;

    // Optimistic UI: Arayüzü hemen güncelle
    const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
    );
    setTasks(updatedTasks);
    
    // Backend'e güncelleme isteği gönder
    const updateStatus = async () => {
        try {
            const response = await fetch(`/api/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if(!response.ok) throw new Error("Statü güncellenemedi.");
            // Başarı mesajına gerek yok, arayüz zaten güncellendi.
        } catch(error) {
            toast.error("Hata: Görev statüsü güncellenemedi. Değişiklikler geri alınıyor.");
            // Hata durumunda arayüzü eski haline döndür (rollback)
            setTasks(initialTasks);
        }
    };
    updateStatus();
  };

  return (
    <div>
      <h2>Proje Stüdyosu - Görev Panosu</h2>
      
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
              
              {/* YENİ: Atananları Seçme Bölümü */}
              <div>
                <p>Ata:</p>
                <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #555', padding: '5px' }}>
                    {teamMembers.map(member => (
                        <div key={member.userId}>
                            <input 
                                type="checkbox"
                                id={`member-${member.userId}`}
                                checked={newTaskAssigneeIds.includes(member.userId)}
                                onChange={() => handleAssigneeChange(member.userId)}
                            />
                            <label htmlFor={`member-${member.userId}`}>{member.user.username}</label>
                        </div>
                    ))}
                </div>
              </div>

              <button type="submit">Oluştur</button>
            </form>
          )}
        </div>
      )}

      {/* Kanban Panosu (değişiklik yok) */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', marginTop: '20px' }}>
          {statuses.map(status => (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                // === ÇÖZÜM BURADA ===
                // `provided.innerRef` ve `droppableProps` doğrudan
                // Droppable'ın altındaki ilk HTML elementine verilmeli.
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    flex: '1 1 280px',
                    minWidth: '280px',
                    background: snapshot.isDraggingOver ? '#2a2a2e' : '#1c1c1c', // Sürüklerken arkaplanı değiştir
                    padding: '10px',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '10px' }}>
                    {status}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px' }}>
                    {tasks
                      .filter(task => task.status === status)
                      .map((task, index) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          index={index} 
                          onClick={() => setSelectedTaskId(task.id)} 
                        />
                      ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* YENİ: Eğer bir görev seçiliyse, modal'ı render et */}
      {selectedTaskId && (
        <TaskDetailModal 
            taskId={selectedTaskId}
            teamMembers={teamMembers.map(m => ({
              ...m,
              user: { id: m.userId, username: m.user.username }
            }))}
            onClose={() => setSelectedTaskId(null)} // Kapatma fonksiyonu
        />
      )}
    </div>
  );
}