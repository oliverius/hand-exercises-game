export async function openCamera(video) {
  if (!window.isSecureContext)
    throw new Error(
      'Camera needs HTTPS or localhost. You can still use manual mode.',
    );
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error(
      'Camera is unsupported here. Use a recent Safari or Chrome, or manual mode.',
    );
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    return stream;
  } catch (error) {
    stream?.getTracks().forEach((t) => t.stop());
    const messages = {
      NotAllowedError:
        'Camera permission was declined. Allow access in browser settings, or use manual mode.',
      NotFoundError: 'No camera was found. You can use manual mode.',
      NotReadableError:
        'Camera is busy or unavailable. Close other camera apps and retry, or use manual mode.',
    };
    throw new Error(
      messages[error.name] ||
        'Camera could not start. Please retry, or use manual mode.',
      { cause: error },
    );
  }
}
export function closeCamera(video) {
  video.srcObject?.getTracks().forEach((t) => t.stop());
  video.srcObject = null;
}
