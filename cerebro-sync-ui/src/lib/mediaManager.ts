/**
 * Media Manager — Handles getUserMedia permission requests and stream lifecycle
 * Provides utilities for audio/video broadcast initialization and cleanup
 */

export type BroadcastType = 'audio' | 'video'

export interface MediaStreamConfig {
    audio: boolean | MediaTrackConstraints
    video?: boolean | MediaTrackConstraints
}

/**
 * Request media permissions and return MediaStream
 * @param broadcastType - 'audio' for audio-only, 'video' for audio+video
 * @returns Promise<MediaStream> with appropriate tracks
 * @throws Error if permission denied or media not available
 */
export async function requestMediaStream(broadcastType: BroadcastType): Promise<MediaStream> {
    const constraints: MediaStreamConfig =
        broadcastType === 'audio'
            ? { audio: true }
            : { video: true, audio: true }

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log(`[MEDIA] ${broadcastType} stream acquired:`, {
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length,
        })
        return stream
    } catch (error) {
        const message =
            error instanceof DOMException
                ? error.name === 'NotAllowedError'
                    ? 'Permission denied. Please allow access to your ' +
                    (broadcastType === 'audio' ? 'microphone' : 'camera and microphone')
                    : error.name === 'NotFoundError'
                        ? 'No ' +
                        (broadcastType === 'audio' ? 'microphone' : 'camera') +
                        ' device found'
                        : error.message
                : String(error)
        throw new Error(`Failed to acquire ${broadcastType} stream: ${message}`)
    }
}

/**
 * Stop all tracks in a media stream and release resources
 * @param stream - MediaStream to stop
 */
export function stopMediaStream(stream: MediaStream | undefined | null): void {
    if (!stream) return

    try {
        // Stop all tracks (both audio and video)
        stream.getTracks().forEach((track) => {
            track.stop()
            console.log(`[MEDIA] Stopped track: ${track.kind}`)
        })
        console.log('[MEDIA] Stream cleanup complete')
    } catch (error) {
        console.error('[MEDIA] Error stopping stream:', error)
    }
}

/**
 * Attach MediaStream to a video element
 * @param element - HTMLVideoElement
 * @param stream - MediaStream to attach
 */
export function attachStreamToVideo(
    element: HTMLVideoElement | null | undefined,
    stream: MediaStream
): void {
    if (!element) return

    try {
        element.srcObject = stream
        element.play().catch((err) => {
            console.warn('[MEDIA] Failed to auto-play video:', err)
        })
        console.log('[MEDIA] Stream attached to video element')
    } catch (error) {
        console.error('[MEDIA] Error attaching stream to video:', error)
    }
}

/**
 * Detach MediaStream from a video element
 * @param element - HTMLVideoElement
 */
export function detachStreamFromVideo(element: HTMLVideoElement | null | undefined): void {
    if (!element) return

    try {
        element.pause()
        element.srcObject = null
        console.log('[MEDIA] Stream detached from video element')
    } catch (error) {
        console.error('[MEDIA] Error detaching stream:', error)
    }
}

/**
 * Check if audio track is enabled
 */
export function isAudioEnabled(stream: MediaStream | null | undefined): boolean {
    if (!stream) return false
    const audioTrack = stream.getAudioTracks()[0]
    return audioTrack ? audioTrack.enabled : false
}

/**
 * Check if video track is enabled
 */
export function isVideoEnabled(stream: MediaStream | null | undefined): boolean {
    if (!stream) return false
    const videoTrack = stream.getVideoTracks()[0]
    return videoTrack ? videoTrack.enabled : false
}

/**
 * Enable/disable audio track
 */
export function setAudioEnabled(stream: MediaStream | null | undefined, enabled: boolean): void {
    if (!stream) return
    stream.getAudioTracks().forEach((track) => {
        track.enabled = enabled
    })
}

/**
 * Enable/disable video track
 */
export function setVideoEnabled(stream: MediaStream | null | undefined, enabled: boolean): void {
    if (!stream) return
    stream.getVideoTracks().forEach((track) => {
        track.enabled = enabled
    })
}

/**
 * Get audio level from MediaStream (simplified meter)
 * Returns value 0-100 representing current audio level
 */
export async function createAudioLevelMonitor(
    stream: MediaStream,
    onLevelChange: (level: number) => void
): Promise<() => void> {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(stream)
        microphone.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        let isRunning = true

        const monitor = () => {
            if (!isRunning) return

            analyser.getByteFrequencyData(dataArray)
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i]
            }
            const average = sum / dataArray.length
            const level = Math.min(100, Math.round((average / 255) * 100))
            onLevelChange(level)

            requestAnimationFrame(monitor)
        }

        monitor()

        // Return cleanup function
        return () => {
            isRunning = false
            microphone.disconnect()
            analyser.disconnect()
        }
    } catch (error) {
        console.error('[MEDIA] Failed to create audio level monitor:', error)
        return () => { }
    }
}
