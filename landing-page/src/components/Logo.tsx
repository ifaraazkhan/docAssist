'use client';

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="serif italic grid place-items-center rounded-[7px]"
        style={{
          width: size,
          height: size,
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: size * 0.6,
          lineHeight: 1,
          paddingTop: 2,
        }}
      >
        Dr
      </div>
      <span className="text-[17px] font-medium" style={{ letterSpacing: '-0.02em' }}>
        Cliniq
      </span>
    </div>
  );
}
