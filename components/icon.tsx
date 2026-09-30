const paths = {
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  "arrow-up-right": "M7 17 17 7M7 7h10v10",
  "arrow-left": "M19 12H5m6-6-6 6 6 6",
  close: "m6 6 12 12M6 18 18 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  expand: "M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5",
} as const;

// Tabler Icons, MIT License: https://github.com/tabler/tabler-icons
export function Icon({
  name,
  className,
}: {
  name: keyof typeof paths;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[name]} />
    </svg>
  );
}
