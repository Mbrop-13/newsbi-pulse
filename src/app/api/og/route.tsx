import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Default fonts will be used as no local font files are provided yet.


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Dynamic params
    const title = searchParams.get('title') || 'Noticias y Análisis IA';
    const category = searchParams.get('category') || 'Maverlang';
    const date = searchParams.get('date') || new Date().toLocaleDateString('es-CL');
    const image = searchParams.get('image'); // Optional background image

    const bgImage = image ? image : 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&h=630&fit=crop';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backgroundColor: '#0F172A',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Image using standard img tag for Satori compatibility */}
          <img
            src={bgImage}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Dark Overlay Gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(15, 23, 42, 0.1) 100%)',
            }}
          />

          {/* Content Box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              position: 'relative',
              zIndex: 10,
              width: '100%',
            }}
          >
            {/* Top row: Category and Date */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(24, 144, 255, 0.2)',
                  color: '#60A5FA',
                  padding: '8px 16px',
                  borderRadius: '100px',
                  fontSize: '24px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                }}
              >
                {category}
              </div>
              
              <div style={{ color: '#94A3B8', fontSize: '24px', fontWeight: 400 }}>
                {date}
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: title.length > 60 ? '56px' : '72px',
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.1,
                marginBottom: '40px',
                maxWidth: '900px',
                fontFamily: 'Inter',
              }}
            >
              {title}
            </div>

            {/* Brand Footer */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#1890FF',
                  color: 'white',
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  fontSize: '32px',
                  fontWeight: 900,
                  marginRight: '20px',
                  boxShadow: '0 4px 20px rgba(24, 144, 255, 0.4)',
                }}
              >
                R
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'white', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                  Maverlang
                </span>
                <span style={{ color: '#94A3B8', fontSize: '20px', fontWeight: 400 }}>
                  Inteligencia Artificial
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        // Uncomment once fonts are added locally:
        // fonts: [
        //   { name: 'Inter', data: await interRegular, style: 'normal', weight: 400 },
        //   { name: 'Inter', data: await interBold, style: 'normal', weight: 700 },
        // ],
      }
    );
  } catch (e: any) {
    console.error(e.message);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
