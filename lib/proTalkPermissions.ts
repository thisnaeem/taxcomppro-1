import { TrackSource } from "livekit-server-sdk";

// Stage approval persists independently of whether any media is currently active.
export function proTalkPublishPermissions(onStage: boolean) {
  return {
    canPublish: onStage,
    canPublishSources: onStage ? [
      TrackSource.MICROPHONE,
      TrackSource.CAMERA,
      TrackSource.SCREEN_SHARE,
      TrackSource.SCREEN_SHARE_AUDIO,
    ] : [],
    canSubscribe: true,
    canPublishData: true,
    canUpdateMetadata: false,
  };
}
