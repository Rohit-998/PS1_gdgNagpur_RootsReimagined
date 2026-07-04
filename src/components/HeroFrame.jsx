'use client';

/* ============================================================
   🎛️ CONTROL SIZE HERE — just change this number:
   0.3 = small, 0.5 = medium, 0.7 = large, 1.0 = full Figma size
   ============================================================ */
const SIZE = 0.4;

const imgPills = '/hero-pills.png';
const imgBottles = '/hero-bottles.png';
const imgPhone = '/hero-phone.png';

function Group() {
  return (
    <>
      <div style={{ position: 'absolute', height: 388.08, left: 1168.77, top: 554.47, width: 494.139 }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <img alt="" src={imgPills} style={{ position: 'absolute', height: '238.51%', left: '-109.76%', maxWidth: 'none', top: '-26.09%', width: '343.41%' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', display: 'flex', height: 271.142, alignItems: 'center', justifyContent: 'center', left: 1466.22, top: 1008.18, width: 445.047 }}>
        <div style={{ flexShrink: 0, transform: 'scaleY(-1) rotate(180deg)' }}>
          <div style={{ height: 271.142, position: 'relative', width: 445.047 }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <img alt="" src={imgPills} style={{ position: 'absolute', height: '264.83%', left: '-110.57%', maxWidth: 'none', top: '-128.6%', width: '295.8%' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Group1() {
  return (
    <>
      <div style={{ position: 'absolute', display: 'flex', height: 448, alignItems: 'center', justifyContent: 'center', left: 549, top: 216, width: 571 }}>
        <div style={{ flexShrink: 0, transform: 'scaleY(-1) rotate(180deg)' }}>
          <div style={{ filter: 'blur(8.4px)', height: 448, position: 'relative', width: 571 }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <img alt="" src={imgPills} style={{ position: 'absolute', height: '238.51%', left: '-109.76%', maxWidth: 'none', top: '-26.09%', width: '343.41%' }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', display: 'flex', height: 529.924, alignItems: 'center', justifyContent: 'center', left: 1554.26, top: 90, width: 674.747 }}>
        <div style={{ flexShrink: 0, transform: 'scaleY(-1)' }}>
          <div style={{ height: 529.924, position: 'relative', width: 674.747 }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <img alt="" src={imgPills} style={{ position: 'absolute', height: '238.51%', left: '-109.76%', maxWidth: 'none', top: '-26.09%', width: '343.41%' }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', display: 'flex', height: 973.663, alignItems: 'center', justifyContent: 'center', left: 668.94, top: 792.78, width: 689.611 }}>
        <div style={{ flexShrink: 0, transform: 'scaleY(-1) rotate(99.88deg)' }}>
          <div style={{ height: 544.362, position: 'relative', width: 893.505 }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <img alt="" src={imgPills} style={{ position: 'absolute', height: '264.83%', left: '-110.57%', maxWidth: 'none', top: '-128.6%', width: '295.8%' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function HeroFrame() {
  // Crop offsets — removes empty space from the Figma canvas
  const CROP_LEFT = 500;
  const CROP_TOP = 60;
  const CONTENT_W = 2247 - CROP_LEFT;
  const CONTENT_H = 1648 - CROP_TOP;

  return (
    <div style={{
      width: CONTENT_W * SIZE,
      height: CONTENT_H * SIZE,
      position: 'relative',
      overflow: 'visible',
    }}>
      <div style={{
        width: 2247,
        height: 1648,
        position: 'relative',
        transform: `scale(${SIZE}) translate(-${CROP_LEFT}px, -${CROP_TOP}px)`,
        transformOrigin: 'top left',
      }}>
        {/* Bottles — blurred bottom */}
        <div style={{ position: 'absolute', aspectRatio: '698.168 / 912.933', filter: 'blur(20.6px)', left: '51.93%', right: '32.06%', top: 1228 }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <img alt="" src={imgBottles} style={{ position: 'absolute', height: '252.81%', left: '-165.7%', maxWidth: 'none', top: '-66.05%', width: '330.58%' }} />
          </div>
        </div>

        {/* Phone — center */}
        <div style={{ position: 'absolute', top: '24.2%', right: '27.11%', bottom: '4.8%', left: '48.46%' }}>
          <img alt="" src={imgPhone} style={{ position: 'absolute', inset: 0, maxWidth: 'none', objectFit: 'cover', pointerEvents: 'none', width: '100%', height: '100%' }} />
        </div>

        <Group />
        <Group1 />

        {/* Small blurred pills */}
        <div style={{ position: 'absolute', display: 'flex', height: 218.399, alignItems: 'center', justifyContent: 'center', left: 1772, top: 575, width: 278.085 }}>
          <div style={{ flexShrink: 0, transform: 'scaleY(-1) rotate(180deg)' }}>
            <div style={{ filter: 'blur(13.5px)', height: 218.399, position: 'relative', width: 278.085 }}>
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <img alt="" src={imgPills} style={{ position: 'absolute', height: '238.51%', left: '-109.76%', maxWidth: 'none', top: '-26.09%', width: '343.41%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
