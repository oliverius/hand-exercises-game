export function cell(value) {
  let text = String(value ?? '');
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function csv(sessions) {
  const headers = [
    'sessionId',
    'sessionStartedAt',
    'startTime',
    'endTime',
    'durationMs',
    'outcome',
    'targetMs',
    'detectionMethod',
  ];
  const rows = sessions.flatMap((s) =>
    s.attempts.map((a) => [
      s.id,
      s.startedAt,
      ...headers.slice(2).map((k) => a[k]),
    ]),
  );
  return (
    [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') +
    '\r\n'
  );
}
export function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function share(file) {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Hand exercise results' });
      return 'Shared';
    } catch (error) {
      if (error.name === 'AbortError') return 'Share cancelled';
    }
  }
  download(file);
  return 'CSV downloaded';
}
