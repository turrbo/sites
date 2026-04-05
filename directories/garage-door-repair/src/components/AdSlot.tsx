interface Props {
  position: 'header' | 'sidebar' | 'in-content' | 'footer';
}

const sizeMap: Record<Props['position'], string> = {
  header: 'h-24',
  sidebar: 'h-64',
  'in-content': 'h-28',
  footer: 'h-24',
};

export default function AdSlot({ position }: Props) {
  return (
    /* Ad placeholder — replace with your ad network code (e.g. Google AdSense) */
    <div
      className={`w-full ${sizeMap[position]} bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs`}
      aria-hidden="true"
      data-ad-position={position}
    >
      Advertisement
    </div>
  );
}
