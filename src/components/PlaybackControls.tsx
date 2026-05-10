import { ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "./ui/button";

type PlaybackControlsProps = {
  playing: boolean;
  timeline: ReactNode;
  videoLoaded: boolean;
  onTogglePlay: () => void;
};

export function PlaybackControls({ playing, timeline, videoLoaded, onTogglePlay }: PlaybackControlsProps) {
  return (
    <div className="flex shrink-0 items-center gap-4 border-t border-white/10 px-6 py-3 max-md:flex-col max-md:items-stretch max-md:px-3">
      <Button className="h-10 w-10 shrink-0" disabled={!videoLoaded} onClick={onTogglePlay} size="icon" type="button" variant="default">
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </Button>
      {timeline}
    </div>
  );
}
