import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      closeButton
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "border border-white/10 bg-card text-white shadow-2xl",
          title: "text-white",
          description: "text-white/60",
          actionButton: "bg-white text-black",
          cancelButton: "bg-white/10 text-white",
          closeButton: "bg-card text-white border-white/20",
          error: "border-destructive/40",
          info: "border-cyan-300/30",
          success: "border-accent/40",
          warning: "border-yellow-300/40",
        },
      }}
    />
  );
}
