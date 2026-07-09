import React, { useState } from "react";
import { Check, ArrowRight, X, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WebBuilderQuestionOption {
  id: string;
  title: string;
  description?: string;
}

export interface WebBuilderQuestion {
  title: string;
  options: WebBuilderQuestionOption[];
  allowWriteIn?: boolean;
}

interface InteractiveQuestionCardProps {
  question: WebBuilderQuestion;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  onClose?: () => void;
}

export function InteractiveQuestionCard({
  question,
  onSubmit,
  onSkip,
  onClose
}: InteractiveQuestionCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleNext = () => {
    if (selectedOptionId === "custom") {
      if (customText.trim()) {
        onSubmit(customText.trim());
      }
    } else {
      const option = question.options.find((o) => o.id === selectedOptionId);
      if (option) {
        onSubmit(option.title);
      }
    }
  };

  const isNextDisabled =
    !selectedOptionId || (selectedOptionId === "custom" && !customText.trim());

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-xl backdrop-blur-md transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/95">
      {/* Glow Effect */}
      <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
          <h3 className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-50">
            {question.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-4 space-y-2.5 max-h-[300px] overflow-y-auto">
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <label
                key={option.id}
                onClick={() => setSelectedOptionId(option.id)}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border border-zinc-200/70 p-3.5 transition-all duration-200 cursor-pointer hover:border-zinc-300 dark:border-zinc-850 dark:hover:border-zinc-800",
                  isSelected
                    ? "border-blue-500 bg-blue-50/20 shadow-sm dark:border-blue-500/80 dark:bg-blue-950/15"
                    : "bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50"
                )}
              >
                {/* Custom radio indicator */}
                <div
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                    isSelected
                      ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-400"
                      : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 group-hover:border-zinc-400 dark:group-hover:border-zinc-600"
                  )}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3.5px]" />}
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {option.title}
                  </span>
                  {option.description && (
                    <p className="text-[11px] leading-normal text-zinc-500 dark:text-zinc-400">
                      {option.description}
                    </p>
                  )}
                </div>
              </label>
            );
          })}

          {/* Write-in Option */}
          {question.allowWriteIn && (
            <div
              className={cn(
                "rounded-xl border border-zinc-200/70 p-3.5 transition-all duration-200 dark:border-zinc-850",
                selectedOptionId === "custom"
                  ? "border-blue-500 bg-blue-50/20 shadow-sm dark:border-blue-500/80 dark:bg-blue-950/15"
                  : "bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50"
              )}
            >
              <label
                onClick={() => setSelectedOptionId("custom")}
                className="group flex items-start gap-3 cursor-pointer"
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                    selectedOptionId === "custom"
                      ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-400"
                      : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 group-hover:border-zinc-400 dark:group-hover:border-zinc-600"
                  )}
                >
                  {selectedOptionId === "custom" && <Check className="h-2.5 w-2.5 stroke-[3.5px]" />}
                </div>
                <div className="space-y-0.5 flex-1">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Escribir respuesta...
                  </span>
                </div>
              </label>

              {selectedOptionId === "custom" && (
                <div className="mt-3.5 pl-7">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Describe exactamente qué necesitas..."
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 shadow-inner outline-none transition-all duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isNextDisabled) {
                        e.preventDefault();
                        handleNext();
                      }
                    }}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-900 dark:bg-zinc-900/10">
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-[11px] font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            onClick={onSkip}
          >
            Omitir pregunta
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isNextDisabled}
            onClick={handleNext}
            className={cn(
              "h-8 rounded-lg text-[11px] font-bold gap-1 px-4 shadow-md transition-all duration-300",
              isNextDisabled
                ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-650"
                : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/20 dark:bg-blue-600 dark:hover:bg-blue-500"
            )}
          >
            <span>Siguiente</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
          </Button>
        </div>
      )}
    </div>
  );
}
