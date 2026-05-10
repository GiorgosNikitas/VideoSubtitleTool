import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CaptionStylePanel } from "../components/CaptionStylePanel";
import { ExportProgressDialog } from "../components/ExportProgressDialog";
import { PlaybackControls } from "../components/PlaybackControls";
import { StatusBar } from "../components/StatusBar";
import { StudioTopbar } from "../components/StudioTopbar";
import { SubtitleList } from "../components/SubtitleList";
import { TimelinePanel } from "../components/TimelinePanel";
import { TranscriptionPanel } from "../components/TranscriptionPanel";
import { VideoPreview } from "../components/VideoPreview";
import { useAuth } from "../hooks/useAuth";
import { useSubtitleEditor } from "../hooks/useSubtitleEditor";

export function EditorPage() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const openLogin = useCallback(() => {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(`/login?next=${next}`);
  }, [location.pathname, location.search, navigate]);
  const { actions, refs, state, t } = useSubtitleEditor({
    accessToken: auth.accessToken,
    isAuthenticated: auth.isAuthenticated,
    onAccountRefresh: auth.refreshProfile,
    onAuthRequired: openLogin,
  });

  return (
    <div className="relative flex h-dvh min-w-80 flex-col overflow-hidden bg-background bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_18rem),hsl(var(--background))] font-mono text-foreground max-[1180px]:h-auto max-[1180px]:min-h-dvh max-[1180px]:overflow-visible">
      <StudioTopbar
        authEmail={auth.user?.email ?? auth.profile?.email ?? null}
        authLoading={auth.loading}
        creditBalance={auth.profile?.creditBalance ?? null}
        isAuthenticated={auth.isAuthenticated}
        language={state.uiLanguage}
        onAuthOpen={openLogin}
        onLanguageChange={actions.setUiLanguage}
        onLogout={auth.signOut}
        t={t}
      />

      <StatusBar
        dirty={state.dirty}
        exportFormat={state.exportFormat}
        exportFormatOptions={state.exportFormatOptions}
        exportProgress={state.exportProgress}
        isBusy={state.isExporting}
        isExporting={state.isExporting}
        isTranscribing={state.isTranscribing}
        isVideoLoading={state.isVideoLoading}
        onDownloadSrt={actions.downloadSrt}
        onDownloadVtt={actions.downloadVtt}
        onExport={actions.handleVideoExport}
        onExportFormatChange={actions.setExportFormat}
        onSubtitleUpload={actions.handleSubtitleUpload}
        onTranscribe={actions.handleTranscribe}
        onVideoUpload={actions.handleVideoUpload}
        segmentCount={state.segments.length}
        status={state.status}
        t={t}
        videoFile={state.videoFile}
        videoLoadProgress={state.videoLoadProgress}
      />

      <main className="relative z-10 grid min-h-0 flex-1 grid-cols-[minmax(0,8fr)_minmax(24rem,4fr)] max-[1180px]:flex max-[1180px]:flex-col max-[1180px]:overflow-visible">
        <section className="flex min-h-0 min-w-0 flex-col border-r border-white/10 max-[1180px]:min-h-[48rem] max-[1180px]:border-r-0">
          <VideoPreview
            activeCaption={state.activeCaption}
            activeSegment={state.activeSegment}
            onCaptionPointerDown={actions.startCaptionDrag}
            onCaptionPointerMove={actions.moveCaptionDrag}
            onCaptionPointerUp={actions.finishCaptionDrag}
            onDurationChange={actions.syncVideoMetadata}
            onPause={() => actions.setPlaying(false)}
            onPlay={() => actions.setPlaying(true)}
            onSeeked={actions.setCurrentTime}
            onTimeUpdate={actions.setCurrentTime}
            onVideoError={actions.handleVideoLoadError}
            onVideoUpload={actions.handleVideoUpload}
            previewFrameRef={refs.previewFrameRef}
            t={t}
            videoRef={refs.videoRef}
            videoStageStyle={state.videoStageStyle}
            videoUrl={state.videoUrl}
          />

          <PlaybackControls
            onTogglePlay={actions.togglePlay}
            playing={state.playing}
            timeline={
              <TimelinePanel
                activeSegmentId={state.activeSegment?.id}
                currentTime={state.currentTime}
                duration={state.duration}
                highlightedSegmentId={state.highlightedSegmentId}
                offset={state.offset}
                onHoverSegment={actions.setHoveredSegmentId}
                onPointerCancel={actions.clearTimelineDrag}
                onSegmentPointerDown={actions.startTimelineDrag}
                onSegmentPointerMove={actions.moveTimelineSegment}
                onSegmentPointerUp={actions.finishTimelineDrag}
                onTimelineSeek={actions.seekTo}
                segments={state.segments}
                statusMessage={state.statusMessage}
                t={t}
                timelineDuration={state.timelineDuration}
                timelineProgressPercent={state.timelineProgressPercent}
                timelineRef={refs.timelineRef}
                timelineWidth={state.timelineWidth}
              />
            }
            videoLoaded={Boolean(state.videoUrl)}
          />

          <CaptionStylePanel
            fontColor={state.fontColor}
            fontFamily={state.fontFamily}
            fontSize={state.fontSize}
            globalCaptionY={state.globalCaptionY}
            offset={state.offset}
            onFontColorChange={actions.setFontColor}
            onFontFamilyChange={actions.setFontFamily}
            onFontSizeChange={actions.setFontSize}
            onGlobalCaptionYChange={actions.setGlobalCaptionY}
            onOffsetChange={actions.setOffset}
            onOutlineColorChange={actions.setOutlineColor}
            onPositionChange={actions.setPosition}
            onShadowColorChange={actions.setShadowColor}
            onShadowStyleChange={actions.setShadowStyle}
            onTextCaseChange={actions.setTextCase}
            outlineColor={state.outlineColor}
            position={state.position}
            shadowColor={state.shadowColor}
            shadowStyle={state.shadowStyle}
            t={t}
            textCase={state.textCase}
          />
        </section>

        <aside className="flex min-h-0 min-w-0 flex-col max-[1180px]:min-h-[42rem] max-[1180px]:border-t max-[1180px]:border-white/10">
          <TranscriptionPanel
            autoChunking={state.autoChunking}
            language={state.transcriptionLanguage}
            model={state.model}
            onAutoChunkingChange={actions.setAutoChunking}
            onLanguageChange={actions.updateLanguagePrompt}
            onModelChange={actions.setModel}
            onPromptChange={actions.setTranscriptionPrompt}
            onTemperatureChange={actions.setTemperature}
            prompt={state.transcriptionPrompt}
            t={t}
            temperature={state.temperature}
          />

          <SubtitleList
            activeSegmentId={state.activeSegment?.id}
            canTranscribe={Boolean(state.videoFile)}
            globalCaptionY={state.globalCaptionY}
            highlightedSegmentId={state.highlightedSegmentId}
            isTranscribing={state.isTranscribing}
            offset={state.offset}
            onAddAfter={actions.addSegmentAfter}
            onDelete={actions.deleteSegment}
            onHoverSegment={actions.setHoveredSegmentId}
            onPlaySegment={actions.playSegment}
            onSeekToSegment={actions.seekToSegment}
            onTranscribe={actions.handleTranscribe}
            onUpdateSegment={actions.updateSegment}
            rowRefs={refs.rowRefs}
            segments={state.segments}
            t={t}
          />
        </aside>
      </main>

      <ExportProgressDialog format={state.exportFormat} open={state.isExporting} progress={state.exportProgress} statusMessage={state.statusMessage} t={t} />
    </div>
  );
}
