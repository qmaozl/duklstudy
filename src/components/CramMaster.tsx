import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus, GripVertical, Calendar, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  task_type: string;
  subject: string;
  due_date: string;
  priority_order: number;
  completed: boolean;
  notes?: string;
  difficulty: number;
}

interface SortableTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const SortableTask = ({ task, onEdit, onDelete }: SortableTaskProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeColors = {
    test: "bg-red-500/20 text-red-500",
    exam: "bg-orange-500/20 text-orange-500",
    homework: "bg-blue-500/20 text-blue-500",
    project: "bg-purple-500/20 text-purple-500",
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card rounded-lg p-4 border">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-foreground">{task.title}</h4>
              <p className="text-sm text-muted-foreground">{task.subject}</p>
            </div>
            <button
              onClick={() => onDelete(task.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${typeColors[task.task_type as keyof typeof typeColors]}`}>
              {task.task_type}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(task.due_date), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CramMasterProps {
  onClose: () => void;
  onScheduleCreated: () => void;
}

const CramMaster = ({ onClose, onScheduleCreated }: CramMasterProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    task_type: "homework",
    subject: "",
    due_date: "",
    notes: "",
    difficulty: 3,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user?.id)
      .eq("completed", false)
      .order("priority_order", { ascending: true });

    if (!error && data) {
      setTasks(data);
    }
  };

  const handleAddTask = async () => {
    if (!formData.title || !formData.subject || !formData.due_date) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      user_id: user?.id,
      ...formData,
      priority_order: tasks.length,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task added successfully",
      });
      setFormData({
        title: "",
        task_type: "homework",
        subject: "",
        due_date: "",
        notes: "",
        difficulty: 3,
      });
      setShowAddForm(false);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (!error) {
      fetchTasks();
      toast({
        title: "Success",
        description: "Task deleted",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);

      // Update priority_order in database
      const updates = newTasks.map((task, index) => ({
        id: task.id,
        priority_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("tasks")
          .update({ priority_order: update.priority_order })
          .eq("id", update.id);
      }
    }
  };

  const handleCreateSchedule = async () => {
    if (tasks.length === 0) {
      toast({
        title: "No tasks",
        description: "Add some tasks before generating a schedule",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-schedule", {
        body: { tasks },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schedule created successfully!",
      });
      onScheduleCreated();
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to generate schedule",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cram Master</h2>
            <p className="text-sm text-muted-foreground">
              Organize your tasks and generate an AI-powered study schedule
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {showAddForm ? (
            <Card className="p-4 bg-accent/5">
              <h3 className="font-semibold mb-4 text-foreground">Add New Task</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Final Exam"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="task_type">Type *</Label>
                    <Select
                      value={formData.task_type}
                      onValueChange={(value) => setFormData({ ...formData, task_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="homework">Homework</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty (1-5) *</Label>
                  <Select
                    value={formData.difficulty.toString()}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">⭐ Very Easy</SelectItem>
                      <SelectItem value="2">⭐⭐ Easy</SelectItem>
                      <SelectItem value="3">⭐⭐⭐ Medium</SelectItem>
                      <SelectItem value="4">⭐⭐⭐⭐ Hard</SelectItem>
                      <SelectItem value="5">⭐⭐⭐⭐⭐ Very Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddTask}>Add Task</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button onClick={() => setShowAddForm(true)} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}

          {tasks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Drag to reorder by priority (top = highest)
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {tasks.map((task) => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      onEdit={() => {}}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tasks yet. Add your first task to get started!</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <Button
            onClick={handleCreateSchedule}
            disabled={tasks.length === 0 || isGenerating}
            className="w-full"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating Schedule..." : "Create Schedule"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CramMaster;
