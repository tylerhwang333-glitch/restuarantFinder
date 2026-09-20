export default function PhotoTile({ photo, size = 'sm' }) {
  const dims = size === 'lg' ? 'h-44 w-full text-6xl' : 'h-28 w-28 text-4xl';

  if (photo.imageUrl) {
    return (
      <div className={`shrink-0 overflow-hidden rounded-xl bg-slate-100 ${dims}`}>
        <img src={photo.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${photo.gradient} ${dims}`}
    >
      <span>{photo.emoji}</span>
    </div>
  );
}
