import { cn } from "@/lib/utils";

interface SidebarChoiceCardProps {
  id: number;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

export function SidebarChoiceCard({ id, label, description, isSelected, onClick }: SidebarChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all hover:border-primary/50",
        isSelected 
          ? "bg-success/10 border-success" 
          : "bg-card border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0",
            isSelected 
              ? "bg-success text-success-foreground" 
              : "bg-muted text-muted-foreground"
          )}
        >
          {id}
        </div>
        <div className="flex-1">
          <h3 className={cn("font-semibold mb-1", isSelected && "text-success")}>{label}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}
