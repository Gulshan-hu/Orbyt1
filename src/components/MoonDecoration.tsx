import moonImage from '@/assets/moon.png';

export function MoonDecoration() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '-150px',
        right: '-150px',
        width: '600px',
        height: '600px',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <img
        src={moonImage}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: 0.8,
        }}
      />
    </div>
  );
}
