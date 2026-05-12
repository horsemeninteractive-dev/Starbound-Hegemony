import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onBack: () => void;
  backLabel?: string;
  actions?: React.ReactNode;
  bottom?: React.ReactNode;
  hue?: number;
  className?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  icon, 
  onBack, 
  backLabel = "Back to Galaxy", 
  actions, 
  bottom,
  hue,
  className
}: PageHeaderProps) {
  const accentColor = hue !== undefined ? `hsl(${hue}, 70%, 55%)` : 'var(--primary)';
  const accentBg = hue !== undefined ? `hsla(${hue}, 70%, 20%, 0.4)` : 'rgba(var(--primary-rgb), 0.2)';
  const accentBorder = hue !== undefined ? `hsla(${hue}, 70%, 50%, 0.4)` : 'rgba(var(--primary-rgb), 0.4)';

  return (
    <header className={cn("border-b border-primary/20 bg-primary/5 shrink-0 transition-all", className)}>
      {/* Main title row — icon + title on left, Back button on right */}
      <div className="px-2 sm:px-8 py-2 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-2">
          {/* Left: icon + title */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {icon && (
              <div 
                className="p-2 md:p-3 bg-primary/20 rounded border border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] shrink-0"
                style={{ 
                  backgroundColor: accentBg,
                  borderColor: accentBorder
                } as React.CSSProperties}
              >
                {React.cloneElement(icon as React.ReactElement, { 
                  className: cn("text-primary", (icon as React.ReactElement).props.className),
                  size: window.innerWidth < 640 ? 16 : 28,
                  style: { color: hue !== undefined ? accentColor : undefined }
                })}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 
                className="font-display text-sm md:text-3xl text-primary text-glow uppercase tracking-wider md:tracking-[0.2em] truncate"
                style={{ color: hue !== undefined ? accentColor : undefined } as React.CSSProperties}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="font-mono-hud text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider md:tracking-widest mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Back button only */}
          <Button 
            variant="outline"
            onClick={onBack}
            className="h-8 md:h-10 text-[8px] md:text-[10px] uppercase tracking-widest font-display gap-1 md:gap-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 transition-all rounded px-2 md:px-4 py-1 shrink-0"
          >
            <ChevronLeft size={window.innerWidth < 640 ? 10 : 12} />
            <span className="hidden xs:inline">{backLabel}</span>
            <span className="xs:hidden">Back</span>
          </Button>
        </div>
      </div>

      {/* Actions sub-bar — centered, only rendered when actions are provided */}
      {actions && (
        <div className="border-t border-primary/10 bg-background/20 px-2 sm:px-8">
          <div className="max-w-7xl mx-auto flex justify-center overflow-x-auto no-scrollbar">
            {actions}
          </div>
        </div>
      )}

      {/* Bottom slot for tabs/stats */}
      {bottom && (
        <div className="border-t border-primary/20">
          {bottom}
        </div>
      )}
    </header>
  );
}
