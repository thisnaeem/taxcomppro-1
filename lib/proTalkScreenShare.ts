import { Track, type LocalParticipant } from "livekit-client";

/** Browser Stop Sharing can leave an ended publication until unpublish finishes. */
export async function toggleProTalkScreenShare(participant: LocalParticipant) {
  if (!participant.permissions?.canPublish) return;
  const publication = participant.getTrackPublication(Track.Source.ScreenShare);
  const activelySharing = publication?.track?.mediaStreamTrack.readyState === "live";
  if (activelySharing) {
    await participant.setScreenShareEnabled(false);
    return;
  }

  // Never try to unmute/reuse an ended capture. Remove stale screen/audio tracks
  // without changing the participant's stage role or microphone publication.
  const staleTracks = [Track.Source.ScreenShare, Track.Source.ScreenShareAudio]
    .map(source => participant.getTrackPublication(source)?.track)
    .filter(track => track !== undefined);
  await Promise.all(staleTracks.map(track => participant.unpublishTrack(track, true)));
  if (participant.permissions?.canPublish) {
    await participant.setScreenShareEnabled(true);
  }
}
