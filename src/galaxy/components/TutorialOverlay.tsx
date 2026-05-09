import React from 'react';
import { Joyride, Step, TooltipRenderProps, EventData, STATUS } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface TutorialOverlayProps {
  run: boolean;
  onFinish: () => void;
  steps: Step[];
}

const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps & { size: number }) => {
  return (
    <div 
      {...tooltipProps} 
      className="hud-panel p-4 sm:p-6 border border-primary/40 bg-background/95 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)] animate-in fade-in zoom-in-95 duration-200 max-w-sm"
    >
      <div className="absolute top-2 right-2">
        <button 
          {...closeProps} 
          className="text-primary/50 hover:text-primary transition-colors p-1"
          title="Skip Tutorial"
        >
          <X size={14} />
        </button>
      </div>
      
      {step.title && (
        <h3 className="font-display text-lg uppercase tracking-widest text-primary mb-2 pr-6">
          {step.title}
        </h3>
      )}
      
      <div className="font-mono-hud text-xs text-muted-foreground leading-relaxed">
        {step.content}
      </div>
      
      <div className="mt-6 flex items-center justify-between border-t border-primary/20 pt-4">
        <div className="flex gap-2">
          {index > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              {...backProps}
              className="h-8 text-[10px] font-display uppercase tracking-widest px-3"
            >
              <ChevronLeft size={12} className="mr-1" /> Back
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="font-mono-hud text-[10px] text-primary/40">
            {index + 1} / {size}
          </span>
          <Button 
            variant="default" 
            size="sm" 
            {...primaryProps}
            className="h-8 text-[10px] font-display uppercase tracking-widest px-4 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
          >
            {isLastStep ? 'Complete' : 'Next'} {!isLastStep && <ChevronRight size={12} className="ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export function TutorialOverlay({ run, onFinish, steps }: TutorialOverlayProps) {
  const processedSteps = React.useMemo(() => {
    if (typeof window === 'undefined') return steps;
    const isMobile = window.innerWidth < 640;
    
    return steps.map(step => {
      if (step.target === '.tour-overview-target') {
        return {
          ...step,
          // Target the one that isn't hidden by Tailwind classes
          target: isMobile 
            ? '.tour-overview-target:not(.hidden)' 
            : '.tour-overview-target:not(.sm\\:hidden)'
        };
      }
      return step;
    });
  }, [steps]);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={processedSteps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      onEvent={handleJoyrideCallback}
      tooltipComponent={(props) => <CustomTooltip {...props} size={processedSteps.length} />}
      options={{
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
        zIndex: 10000,
        arrowColor: 'hsl(var(--primary) / 0.1)',
        backgroundColor: 'transparent',
        overlayColor: 'rgba(0, 0, 0, 0.7)',
        primaryColor: 'hsl(var(--primary))',
        textColor: 'hsl(var(--primary))',
      }}
    />
  );
}
