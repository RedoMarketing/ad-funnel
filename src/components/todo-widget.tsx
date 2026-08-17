"use client";

import * as React from "react";
import { ListTodo, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export function TodoWidget() {
  const { data, ready, addTodo, toggleTodo, removeTodo } = useStore();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const openCount = data.todos.filter((t) => !t.done).length;

  // Escape closes, matching every other dismissible surface in the app.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await addTodo(trimmed);
      setText("");
      haptic();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="To-do list"
          className="bg-popover text-popover-foreground animate-in fade-in-0 slide-in-from-bottom-2 fixed right-4 bottom-20 z-50 flex max-h-[min(28rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-xl border shadow-lg sm:right-6 sm:bottom-24"
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <span className="text-sm font-semibold">To-do</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {openCount === 0 ? "All clear" : `${openCount} open`}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {data.todos.length === 0 ? (
              <p className="text-muted-foreground px-2 py-8 text-center text-sm">
                Nothing yet. Add the first one below.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {data.todos.map((todo) => (
                  <li
                    key={todo.id}
                    className="group hover:bg-muted/60 flex items-start gap-2.5 rounded-md px-2 py-1.5"
                  >
                    <Checkbox
                      id={`todo-${todo.id}`}
                      checked={todo.done}
                      className="mt-0.5"
                      onCheckedChange={(v) => {
                        haptic();
                        void toggleTodo(todo.id, v === true).catch((e) =>
                          toast.error(e instanceof Error ? e.message : "Could not update"),
                        );
                      }}
                    />
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={cn(
                        "flex-1 cursor-pointer text-sm leading-snug break-words",
                        todo.done && "text-muted-foreground line-through",
                      )}
                    >
                      {todo.text}
                    </label>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${todo.text}`}
                      className="text-muted-foreground hover:text-destructive row-action shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() =>
                        void removeTodo(todo.id).catch((e) =>
                          toast.error(e instanceof Error ? e.message : "Could not delete"),
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={submit} className="flex gap-2 border-t p-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a to-do…"
              aria-label="New to-do"
              className="h-8"
            />
            <Button type="submit" size="icon-sm" disabled={!text.trim() || saving} aria-label="Add">
              <Plus />
            </Button>
          </form>
        </div>
      )}

      <Button
        size="icon"
        aria-label={open ? "Close to-do list" : "Open to-do list"}
        aria-expanded={open}
        onClick={() => {
          haptic();
          setOpen((v) => !v);
        }}
        className="fixed right-4 bottom-4 z-50 size-12 rounded-full shadow-lg sm:right-6 sm:bottom-6"
      >
        {open ? <X className="size-5" /> : <ListTodo className="size-5" />}
        {!open && openCount > 0 && (
          <span className="bg-background text-foreground absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full border px-1 text-[11px] font-semibold tabular-nums">
            {openCount}
          </span>
        )}
      </Button>
    </>
  );
}
