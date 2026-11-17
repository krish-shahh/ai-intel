import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '90px',
          background: '#f4f5f6',
          color: '#263b50',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ fontSize: 24, color: '#667583', marginBottom: 28, fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Personal reading list</div>
        <div style={{ fontSize: 72, fontWeight: 500, letterSpacing: '-0.04em' }}>AI &amp; technology</div>
        <div style={{ fontSize: 30, color: '#65717d', maxWidth: 820, lineHeight: 1.4, marginTop: 18, fontFamily: 'sans-serif' }}>
          A daily brief with sources and connected notes.
        </div>
      </div>
    ),
    { ...size }
  );
}
