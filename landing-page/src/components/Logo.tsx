'use client';

export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-0">
      <img
        src="/logo.svg"
        alt="DrCliniq"
        width={size}
        height={size}
        style={{ display: 'block', marginRight: -2, marginTop: '-4px' }}
      />
      <span className="text-[21px] font-semibold" style={{ letterSpacing: '-0.02em' }}>
        Cliniq
      </span>
    </div>
  );
}
