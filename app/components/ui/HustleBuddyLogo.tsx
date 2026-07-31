export const HustleBuddyLogo = ({
  className = "w-6 h-6",
}: {
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Left Pillar (Solid) - The Foundation */}
    <rect x="4" y="3" width="4" height="18" rx="2" fill="currentColor" />

    {/* Right Pillar (Translucent) - The Automation Background */}
    <rect
      x="16"
      y="3"
      width="4"
      height="18"
      rx="2"
      fill="currentColor"
      opacity="0.3"
    />

    {/* Center Node - The Sync/Transfer */}
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);
