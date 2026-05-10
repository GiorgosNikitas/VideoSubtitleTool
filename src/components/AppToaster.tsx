import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      closeButton
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "border border-white/10 bg-[#101010] text-white shadow-2xl",
          title: "text-white",
          description: "text-white/60",
          actionButton: "bg-white text-black",
          cancelButton: "bg-white/10 text-white",
          closeButton: "bg-[#101010] text-white border-white/20",
          error: "border-[#ff3d57]/40",
          info: "border-[#00e5ff]/30",
          success: "border-[#00ff85]/40",
          warning: "border-[#ffeb3b]/40",
        },
      }}
    />
  );
}
