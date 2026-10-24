import { useEffect, useMemo, useState } from 'react';
import { Trash2, Heart, Image } from 'lucide-react';
import FilterBar from '../../components/admin/common/FilterBar';
import EmptyState from '../../components/admin/common/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCards } from '../../components/admin/common/LoadingSkeleton';
import { memoryService } from '../../services/memoryService';

export default function AdminGalleryPage() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await memoryService.getFolders(true);
        if (mounted) setFolders(Array.isArray(data) ? data : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const photos = useMemo(() => {
    return folders.flatMap((folder) => (folder.photos || []).map((p) => ({ ...p, folderName: folder.name })));
  }, [folders]);

  const filtered = useMemo(() => {
    return photos
      .filter((p) => !folderFilter || p.folderName === folderFilter)
      .filter((p) => !query || p.caption?.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [photos, folderFilter, query]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await memoryService.deletePhoto(confirmDelete.id);
      setFolders((prev) =>
        prev.map((f) => ({ ...f, photos: (f.photos || []).filter((p) => p.id !== confirmDelete.id) }))
      );
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const folderOptions = folders.map((f) => ({ value: f.name, label: f.name }));

  return (
    <div className="space-y-4">
      <FilterBar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search by caption…"
        filters={[{ label: 'Folder', value: folderFilter, onChange: setFolderFilter, options: folderOptions }]}
        onClear={() => {
          setQuery('');
          setFolderFilter(null);
        }}
      />

      {loading ? (
        <SkeletonCards count={8} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Image} title="No photos found" description="Uploads from Memories will appear here." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-(--color-admin-surface-2)">
              <img src={photo.photoUrl} alt={photo.caption || ''} className="h-full w-full object-cover transition group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(photo)}
                    className="flex h-7 w-7 appearance-none items-center justify-center rounded-md border-0 bg-white/90 text-(--color-admin-danger) transition hover:bg-white"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="text-white">
                  <p className="m-0 truncate text-[11px] font-medium">{photo.folderName}</p>
                  {photo.isFavorite && <Heart size={11} className="mt-0.5 fill-current" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this photo?"
        message="This photo will be permanently removed from the folder."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => !busy && setConfirmDelete(null)}
      />
    </div>
  );
}
