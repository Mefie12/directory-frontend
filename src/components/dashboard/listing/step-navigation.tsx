import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepNavigationProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  listingType: "business" | "event" | "community";
}

const steps: Step[] = [
  {
    id: 1,
    title: "Basic Information",
    description: "Name, category, and description",
  },
  {
    id: 2,
    title: "Business Details",
    description: "Location and contact info",
  },
  {
    id: 3,
    title: "Media Upload",
    description: "Images and cover photo",
  },
  {
    id: 4,
    title: "Social Media",
    description: "Links to social profiles",
  },
  {
    id: 5,
    title: "Preview & Submit",
    description: "Final review",
  },
];

export function StepNavigation({
  currentStep,
  onStepClick,
  listingType,
}: StepNavigationProps) {
  return (
    <aside className="w-80 shrink-0">
      <div className="sticky top-6 space-y-3">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {listingType === "business" ? "Business Listing" : "Event Listing"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Navigate through the form steps
          </p>
        </div>

        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all hover:border-[#93C01F]/50",
                isActive && "bg-[#93C01F]/10 border-[#93C01F]",
                !isActive && !isCompleted && "bg-card border-border",
                isCompleted && "bg-[#93C01F]/10 border-[#93C01F]"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0",
                    isActive && "bg-[#93C01F] text-primary-foreground",
                    !isActive &&
                      !isCompleted &&
                      "bg-muted text-muted-foreground",
                    isCompleted && "bg-[#93C01F] text-primary-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div className="flex-1">
                  <h3
                    className={cn(
                      "font-semibold mb-1",
                      isActive && "text-primary",
                      isCompleted && "text-success"
                    )}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
