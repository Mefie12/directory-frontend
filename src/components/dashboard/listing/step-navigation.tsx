import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { LISTING_JOURNEYS, ListingStepState } from "@/lib/listing-form-v2";

interface StepNavigationProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  listingType: "business" | "event" | "community";
  unlockedStep?: number;
  stepStates?: Record<string, ListingStepState>;
}

export function StepNavigation({
  currentStep,
  onStepClick,
  listingType,
  unlockedStep = currentStep,
  stepStates = {},
}: StepNavigationProps) {
  const steps = LISTING_JOURNEYS[listingType];
  return (
    <aside className="w-80 shrink-0">
      <div className="sticky top-6 space-y-3">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {listingType.charAt(0).toUpperCase() + listingType.slice(1)} Listing
          </h2>
          <p className="text-sm text-muted-foreground">
            Navigate through the form steps
          </p>
        </div>

        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isLocked = step.id > unlockedStep;
          const state = stepStates[step.key];

          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              disabled={isLocked}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all hover:border-[#93C01F]/50",
                isActive && "bg-[#93C01F]/10 border-[#93C01F]",
                !isActive && !isCompleted && "bg-card border-border",
                isCompleted && "bg-[#93C01F]/10 border-[#93C01F]",
                isLocked && "cursor-not-allowed opacity-50",
                state === "needs_attention" && "border-amber-400 bg-amber-50"
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
