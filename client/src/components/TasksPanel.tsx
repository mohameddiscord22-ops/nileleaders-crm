import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TasksPanel() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  const { data: myTasks } = trpc.tasks.getMyTasks.useQuery(
    { status: "pending" },
    { enabled: open }
  );
  const { data: overdueTasks } = trpc.tasks.getOverdueTasks.useQuery(
    {},
    { enabled: open }
  );
  const completeMutation = trpc.tasks.complete.useMutation();

  useEffect(() => {
    if (myTasks) {
      setTasks(myTasks);
    }
  }, [myTasks]);

  const handleCompleteTask = async (taskId: number) => {
    await completeMutation.mutateAsync({ taskId });
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const overdue = overdueTasks?.length || 0;
  const pending = tasks.length;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Clock className="h-5 w-5" />
        {(overdue > 0 || pending > 0) && (
          <Badge
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
            variant={overdue > 0 ? "destructive" : "secondary"}
          >
            {(overdue + pending) > 99 ? "99+" : overdue + pending}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:w-96">
          <SheetHeader>
            <SheetTitle>المهام والمتابعات</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            <div className="space-y-4 pr-4">
              {/* Overdue Tasks */}
              {overdueTasks && overdueTasks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-red-600 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    مهام متأخرة ({overdueTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {overdueTasks.map(task => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border border-red-200 bg-red-50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {task.priority}
                              </Badge>
                              <p className="text-xs text-red-600">
                                منذ {Math.floor((Date.now() - task.dueDate) / (1000 * 60 * 60))} ساعة
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Tasks */}
              {tasks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">
                    المهام المعلقة ({tasks.length})
                  </h3>
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {task.priority}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                في {new Date(task.dueDate).toLocaleDateString("ar-EG")}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tasks.length === 0 && (!overdueTasks || overdueTasks.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد مهام معلقة
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
