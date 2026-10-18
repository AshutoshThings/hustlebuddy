"use client";

import { motion } from "framer-motion"; // Or "motion/react" based on your project config
import { Application } from "@/app/types/application";

type KanbanCardProps = {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
};

export default function KanbanCard({ app, onEdit, onDelete }: KanbanCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("appId", app.id);
    e.dataTransfer.setData("text/plain", app.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <motion.div
      layoutId={app.id}
      draggable={true}
      onDragStart={handleDragStart as any}
      whileDrag={{
        scale: 1.05,
        rotate: 2,
        opacity: 0.9,
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group p-4 bg-[#050505] border border-white/10 rounded-xl hover:border-white/20 transition-colors cursor-grab active:cursor-grabbing shadow-sm relative"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-white truncate pr-4">
          {app.company}
        </h4>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(app);
            }}
            className="text-slate-400 hover:text-white text-xs font-medium"
            title="Edit application"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(app);
            }}
            className="text-red-400 hover:text-red-300 text-xs font-medium"
            title="Delete application"
          >
            Delete
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4 line-clamp-1">{app.role}</p>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
        <span>Applied on {app.date}</span>
        <span className="capitalize px-2 py-0.5 rounded bg-white/5 text-slate-300">
          {app.status}
        </span>
      </div>
    </motion.div>
  );
}
