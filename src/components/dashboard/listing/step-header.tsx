import { ArrowLeft } from "lucide-react";

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
  onClose?: () => void;
}

export function StepHeader({
  currentStep,
  totalSteps,
  title,
  subtitle,
  onBack,
}: StepHeaderProps) {
  return (
    <div className="mb-8 px-10">
      {/* Main Header Row */}
      <div className="flex items-center justify-between mb-2">
        {/* Left Side - Title and Back Button */}
        <div className="flex  gap-2">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 border rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        </div>

        {/* Right Side - Step Indicator */}
        <div className="flex items-center gap-3 justify-start">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Subtitle and Progress Bar Row */}
      <div className="flex items-center justify-between">
        <div className="ml-12">
          {" "}
          {/* Offset to align with title */}
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-72">
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#419E6A] transition-all duration-300 ease-out rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
