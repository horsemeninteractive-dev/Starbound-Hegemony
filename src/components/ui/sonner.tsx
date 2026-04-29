import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      style={{ position: 'absolute' }}
      toastOptions={{
        classNames: {
          toast:
            "group toast hud-panel hud-corner !bg-black/70 backdrop-blur-md border border-primary/30 p-4 shadow-[0_0_15px_hsl(var(--primary)/0.1)] w-full flex flex-col items-start",
          title: "font-mono-hud text-[10px] uppercase tracking-[0.2em] text-primary text-glow",
          description: "font-mono-hud text-[8px] uppercase tracking-widest text-primary/60 mt-1",
          error: "group toast !border-red-500/40 !bg-black/80 [&_[data-title]]:!text-red-400 [&_[data-title]]:!text-shadow-none [&_[data-description]]:!text-red-400/70 shadow-[0_0_15px_rgba(255,0,0,0.2)]",
          success: "group toast !border-success/40 !bg-black/80 [&_[data-title]]:!text-success [&_[data-description]]:!text-success/70 shadow-[0_0_15px_hsl(var(--success)/0.2)]",
          warning: "group toast !border-warning/40 !bg-black/80 [&_[data-title]]:!text-warning [&_[data-description]]:!text-warning/70 shadow-[0_0_15px_hsl(var(--warning)/0.2)]",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-mono-hud uppercase text-[8px]",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-mono-hud uppercase text-[8px]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
