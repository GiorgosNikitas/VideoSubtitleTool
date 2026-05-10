import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

type SlidingControlRowProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scrollLeftLabel: string;
  scrollRightLabel: string;
};

export function SlidingControlRow({
  children,
  className,
  contentClassName,
  scrollLeftLabel,
  scrollRightLabel,
}: SlidingControlRowProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const [scroll, setScroll] = useState({ left: false, right: false });

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const scrollLeft = Math.min(maxScrollLeft, Math.max(0, scroller.scrollLeft));
    const nextState = {
      left: scrollLeft > 1,
      right: scrollLeft < maxScrollLeft - 1,
    };

    setScroll((currentState) =>
      currentState.left === nextState.left && currentState.right === nextState.right ? currentState : nextState,
    );
  }, []);

  useEffect(() => {
    updateScrollState();
  });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(scroller);
    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    updateScrollState();

    return () => {
      if (scrollAnimationRef.current) {
        window.cancelAnimationFrame(scrollAnimationRef.current);
      }
      resizeObserver.disconnect();
      scroller.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function scrollRow(direction: -1 | 1) {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.max(220, scroller.clientWidth * 0.65),
      behavior: "smooth",
    });

    let frames = 0;
    const watchScroll = () => {
      updateScrollState();
      frames += 1;
      if (frames < 28) {
        scrollAnimationRef.current = window.requestAnimationFrame(watchScroll);
      }
    };

    if (scrollAnimationRef.current) {
      window.cancelAnimationFrame(scrollAnimationRef.current);
    }
    scrollAnimationRef.current = window.requestAnimationFrame(watchScroll);
  }

  return (
    <div className={cn("relative min-w-0 max-w-full overflow-hidden", className)}>
      {scroll.left && (
        <Button
          aria-label={scrollLeftLabel}
          className="absolute bottom-1 left-0 top-1 z-20 h-auto w-9 border-white/20 bg-card/95 p-0 shadow-xl hover:border-white/45"
          onClick={() => scrollRow(-1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronLeft size={15} />
        </Button>
      )}

      <div className="min-w-0 max-w-full overflow-hidden">
        <div
          className={cn(
            "flex w-full min-w-0 max-w-full flex-nowrap items-center gap-x-5 overflow-x-auto overscroll-x-contain scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            contentClassName,
          )}
          onScroll={updateScrollState}
          ref={scrollerRef}
        >
          {children}
        </div>
      </div>

      {scroll.right && (
        <Button
          aria-label={scrollRightLabel}
          className="absolute bottom-1 right-0 top-1 z-20 h-auto w-9 border-white/20 bg-card/95 p-0 shadow-xl hover:border-white/45"
          onClick={() => scrollRow(1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronRight size={15} />
        </Button>
      )}
    </div>
  );
}
