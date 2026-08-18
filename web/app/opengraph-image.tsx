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
          background: '#16161a',
          color: '#e8e8ec',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 44 }}>
          <svg width="76" height="76" viewBox="0 0 1024 1024" fill="none">
            <rect x="72" y="72" width="880" height="880" rx="220" fill="#16161D" />
            <rect x="73" y="73" width="878" height="878" rx="219" stroke="#FFFFFF" strokeOpacity=".09" strokeWidth="2" />
            <path d="M252 660L420 532L574 608L772 360" stroke="#F2F0EA" strokeWidth="54" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="252" cy="660" r="60" fill="#16161D" stroke="#F2F0EA" strokeWidth="34" />
            <circle cx="420" cy="532" r="60" fill="#16161D" stroke="#F2F0EA" strokeWidth="34" />
            <circle cx="574" cy="608" r="86" fill="#7C6CFF" />
            <circle cx="574" cy="608" r="86" stroke="#C8C0FF" strokeOpacity=".58" strokeWidth="8" />
            <circle cx="772" cy="360" r="60" fill="#16161D" stroke="#F2F0EA" strokeWidth="34" />
            <path d="M228 302V230H300M724 794H796V722" stroke="#7C6CFF" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: '-0.02em' }}>ai-intel</div>
        </div>
        <div style={{ fontSize: 32, color: '#9a9aa6', maxWidth: 820, lineHeight: 1.4 }}>
          A self-writing AI intel wiki: the people, companies, and ideas moving the AI world.
        </div>
      </div>
    ),
    { ...size }
  );
}
