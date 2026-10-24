import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import '../styles/loveboard-fonts.css';
import '../styles/loveboard-tailwind.css';

import CorkBoard from '../components/loveBoard/CorkBoard/CorkBoard';
import BoardToolbar from '../components/loveBoard/Toolbar/BoardToolbar';
import BoardMenu from '../components/loveBoard/Toolbar/BoardMenu';
import SearchFilterPanel from '../components/loveBoard/Toolbar/SearchFilterPanel';
import StickerLibrary from '../components/loveBoard/StickerLibrary/StickerLibrary';
import ArchiveDrawer from '../components/loveBoard/Archive/ArchiveDrawer';
import LayerPanel from '../components/loveBoard/Layers/LayerPanel';
import NoteComposerModal from '../components/loveBoard/Composer/NoteComposerModal';
import NoteReaderModal from '../components/loveBoard/Note/NoteReaderModal';
import ConfirmDialog from '../components/ui/ConfirmDialog/ConfirmDialog';
import DeleteAllDialog from '../components/ui/DeleteAllDialog/DeleteAllDialog';
import { useNotification } from '../hooks/useNotification';

import Icon from '../components/Icon';
import { useLoveNotes, useLoveStickers, useCacheSetter } from '../queries/queries';
import { useLoveBoardMutations } from '../queries/mutations';
import { queryKeys } from '../queries/queryKeys';
import { PAPERS, paperValue, resolvePaperId, resolveStickerIcon, stickerLabel } from '../constants/loveBoardCatalog';
import { randomBoardPosition, randomNoteRotation, randomStickerRotation } from '../constants/loveBoardConstants';

const PAPER_FILTER_OPTIONS = PAPERS.map((p) => ({ filename: paperValue(p.id), label: p.label }));

export default function LoveLettersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const boardRef = useRef(null);
  const stickerDebounceRef = useRef({});

  // Notes and stickers live in the query cache. `setNotes` / `setStickers` take a value or an
  // updater like useState's setters but write into that cache, so every optimistic update below
  // (drag, edit, archive...) is also what the next visit to this page shows.
  const notesQuery = useLoveNotes();
  const stickersQuery = useLoveStickers();
  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const stickers = useMemo(() => stickersQuery.data ?? [], [stickersQuery.data]);
  const setNotes = useCacheSetter(queryKeys.loveNotes());
  const setStickers = useCacheSetter(queryKeys.loveStickers());
  const loading = notesQuery.isPending || stickersQuery.isPending;
  const error = notesQuery.isError || stickersQuery.isError ? 'Unable to load the board. Please check your connection.' : '';
  const {
    createNote, updateNote, deleteNote, updateNotePosition,
    createSticker, updateSticker, deleteSticker, deleteAll: deleteAllBoard,
  } = useLoveBoardMutations();
  const { addToast } = useNotification();
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState('');

  const [decorateMode, setDecorateMode] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [stickerLibraryOpen, setStickerLibraryOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState(null);
  const [moodFilter, setMoodFilter] = useState(null);
  const [paperFilter, setPaperFilter] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [readerNoteId, setReaderNoteId] = useState(null);
  const [readerSaving, setReaderSaving] = useState(false);

  const [topNoteId, setTopNoteId] = useState(null);
  const [noteExitReasons, setNoteExitReasons] = useState({});

  const [confirmState, setConfirmState] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [activeTool, setActiveTool] = useState('select');
  const [zoomPercent, setZoomPercent] = useState(100);
  const historyRef = useRef({ past: [], future: [] });
  const transformSnapshotRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Deep-link from a notification ("?noteId=...") — open that note's reader
  // once notes have loaded, then strip the param so it doesn't re-trigger.
  useEffect(() => {
    const noteId = searchParams.get('noteId');
    if (!noteId || !notes.some((n) => n.id === noteId)) return;
    queueMicrotask(() => {
      setReaderNoteId(noteId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('noteId');
        return next;
      }, { replace: true });
    });
  }, [notes, searchParams, setSearchParams]);

  const readerNote = useMemo(() => notes.find((n) => n.id === readerNoteId) || null, [notes, readerNoteId]);

  const nextZIndex = useCallback(() => {
    const maxNote = notes.reduce((m, n) => Math.max(m, n.zIndex || 1), 1);
    const maxSticker = stickers.reduce((m, s) => Math.max(m, s.zIndex || 1), 1);
    return Math.max(maxNote, maxSticker) + 1;
  }, [notes, stickers]);

  const prevZIndex = useCallback(() => {
    const minNote = notes.reduce((m, n) => Math.min(m, n.zIndex || 1), 1);
    const minSticker = stickers.reduce((m, s) => Math.min(m, s.zIndex || 1), 1);
    return Math.min(minNote, minSticker) - 1;
  }, [notes, stickers]);

  /* ---------------------------------------------------------------
     UNDO / REDO
     Scoped to transform-style edits (move, resize, rotate, lock,
     stacking order, favorite/archive toggle) — additions and hard
     deletes are intentionally excluded. Notes/stickers are hard-deleted
     server-side with no restore-by-id endpoint, so "undoing" a delete
     would only be able to recreate a look-alike under a new id, which
     would silently desync from any other history entries still
     referencing the original id. Deletes already go through
     ConfirmDialog as their safety net instead.
  --------------------------------------------------------------- */

  const syncHistoryFlags = () => {
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
  };

  const pushHistory = useCallback((entry) => {
    const history = historyRef.current;
    history.past.push(entry);
    if (history.past.length > 50) history.past.shift();
    history.future = [];
    syncHistoryFlags();
  }, []);

  const applyStickerPatch = useCallback((id, patch) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    updateSticker(id, patch).catch((err) => console.error('Failed to persist sticker patch', err));
  }, [setStickers, updateSticker]);

  const applyNotePatch = useCallback((id, patch) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    const positionKeys = ['positionX', 'positionY', 'rotation', 'zIndex'];
    const isPositionOnly = Object.keys(patch).every((k) => positionKeys.includes(k));
    if (isPositionOnly) {
      // Optimistic: the note already moved in the cache above; a failure resyncs the board.
      updateNotePosition(id, patch).catch((err) => console.error('Failed to persist note patch', err));
    } else {
      updateNote(id, patch)
        .then((updated) => setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n))))
        .catch((err) => console.error('Failed to persist note patch', err));
    }
  }, [setNotes, updateNote, updateNotePosition]);

  const applyPatch = useCallback(
    (type, id, patch) => (type === 'sticker' ? applyStickerPatch(id, patch) : applyNotePatch(id, patch)),
    [applyStickerPatch, applyNotePatch]
  );

  const handleUndo = useCallback(() => {
    const entry = historyRef.current.past.pop();
    if (!entry) return;
    historyRef.current.future.push(entry);
    applyPatch(entry.type, entry.id, entry.before);
    syncHistoryFlags();
  }, [applyPatch]);

  const handleRedo = useCallback(() => {
    const entry = historyRef.current.future.pop();
    if (!entry) return;
    historyRef.current.past.push(entry);
    applyPatch(entry.type, entry.id, entry.after);
    syncHistoryFlags();
  }, [applyPatch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z';
      const isRedo = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'));
      if (isUndo) {
        e.preventDefault();
        handleUndo();
      } else if (isRedo) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const visibleNotes = useMemo(() => {
    return notes.filter((n) => {
      if (n.isArchived) return false;
      if (favoritesOnly && !n.isFavorite) return false;
      if (authorFilter && n.authorName !== authorFilter) return false;
      if (moodFilter && n.mood !== moodFilter) return false;
      if (paperFilter && resolvePaperId(n.paperImage) !== resolvePaperId(paperFilter)) return false;
      if (query) {
        const q = query.toLowerCase();
        const haystack = `${n.title || ''} ${n.content || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [notes, favoritesOnly, authorFilter, moodFilter, paperFilter, query]);

  const archivedNotes = useMemo(() => notes.filter((n) => n.isArchived), [notes]);
  const authorOptions = useMemo(
    () => [...new Set(notes.map((n) => n.authorName).filter(Boolean))],
    [notes]
  );

  const layerItems = useMemo(() => {
    const noteItems = notes
      .filter((n) => !n.isArchived)
      .map((n) => ({
        id: n.id,
        type: 'note',
        zIndex: n.zIndex || 1,
        label: n.title || 'Untitled letter',
        paper: n.paperImage,
      }));
    const stickerItems = stickers.map((s) => ({
      id: s.id,
      type: 'sticker',
      zIndex: s.zIndex || 1,
      label: stickerLabel(s.image),
      icon: resolveStickerIcon(s.image),
      locked: s.isLocked,
    }));
    return [...noteItems, ...stickerItems].sort((a, b) => b.zIndex - a.zIndex);
  }, [notes, stickers]);

  /* ---------------------------------------------------------------
     NOTES
  --------------------------------------------------------------- */

  const handleCreateNote = async (form) => {
    try {
      setCreating(true);
      const { x, y } = randomBoardPosition();
      const created = await createNote({
        ...form,
        positionX: x,
        positionY: y,
        rotation: randomNoteRotation(),
        zIndex: nextZIndex(),
      });
      setNotes((prev) => [...prev, created]);
      setComposerOpen(false);
    } catch (err) {
      console.error('Failed to create note', err);
    } finally {
      setCreating(false);
    }
  };

  const handleNoteDragEnd = (id, x, y) => {
    const before = notes.find((n) => n.id === id);
    if (before) {
      pushHistory({
        type: 'note',
        id,
        before: { positionX: before.positionX, positionY: before.positionY },
        after: { positionX: x, positionY: y },
      });
    }
    applyNotePatch(id, { positionX: x, positionY: y });
  };

  const handleBringNoteToFront = (id) => {
    const before = notes.find((n) => n.id === id);
    const z = nextZIndex();
    setTopNoteId(id);
    if (before) pushHistory({ type: 'note', id, before: { zIndex: before.zIndex }, after: { zIndex: z } });
    applyNotePatch(id, { zIndex: z });
  };

  const handleSendNoteBackward = (id) => {
    const before = notes.find((n) => n.id === id);
    const z = prevZIndex();
    if (before) pushHistory({ type: 'note', id, before: { zIndex: before.zIndex }, after: { zIndex: z } });
    applyNotePatch(id, { zIndex: z });
  };

  const handleSaveNoteEdit = async (patch) => {
    if (!readerNote) return;
    try {
      setReaderSaving(true);
      const updated = await updateNote(readerNote.id, patch);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch (err) {
      console.error('Failed to save note', err);
    } finally {
      setReaderSaving(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!readerNote) return;
    pushHistory({
      type: 'note',
      id: readerNote.id,
      before: { isFavorite: readerNote.isFavorite },
      after: { isFavorite: !readerNote.isFavorite },
    });
    applyNotePatch(readerNote.id, { isFavorite: !readerNote.isFavorite });
  };

  const handleToggleArchive = () => {
    if (!readerNote) return;
    pushHistory({
      type: 'note',
      id: readerNote.id,
      before: { isArchived: readerNote.isArchived },
      after: { isArchived: !readerNote.isArchived },
    });
    setNoteExitReasons((prev) => ({ ...prev, [readerNote.id]: 'archive' }));
    applyNotePatch(readerNote.id, { isArchived: !readerNote.isArchived });
    setReaderNoteId(null);
  };

  const handleRestoreFromArchive = async (note) => {
    const updated = await updateNote(note.id, { isArchived: false });
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const requestDeleteNote = (note) => {
    setConfirmState({
      title: 'Delete this letter?',
      message: 'This letter will be taken off the board for good, love. This can’t be undone.',
      confirmLabel: 'Delete Letter',
      onConfirm: async () => {
        setNoteExitReasons((prev) => ({ ...prev, [note.id]: 'delete' }));
        await deleteNote(note.id);
        setNotes((prev) => prev.filter((n) => n.id !== note.id));
        setReaderNoteId((current) => (current === note.id ? null : current));
      },
    });
  };

  /* ---------------------------------------------------------------
     STICKERS
  --------------------------------------------------------------- */

  const handleAddSticker = async (filename) => {
    try {
      const { x, y } = randomBoardPosition();
      const created = await createSticker({
        image: filename,
        positionX: x,
        positionY: y,
        rotation: randomStickerRotation(),
        scale: 1,
        zIndex: nextZIndex(),
      });
      setStickers((prev) => [...prev, created]);
    } catch (err) {
      console.error('Failed to add sticker', err);
    }
  };

  const handleStickerDragEnd = (id, x, y) => {
    const before = stickers.find((s) => s.id === id);
    if (before) {
      pushHistory({
        type: 'sticker',
        id,
        before: { positionX: before.positionX, positionY: before.positionY },
        after: { positionX: x, positionY: y },
      });
    }
    applyStickerPatch(id, { positionX: x, positionY: y });
  };

  const handleBringStickerToFront = (id) => {
    const before = stickers.find((s) => s.id === id);
    const z = nextZIndex();
    if (before) pushHistory({ type: 'sticker', id, before: { zIndex: before.zIndex }, after: { zIndex: z } });
    applyStickerPatch(id, { zIndex: z });
  };

  const handleSendStickerBackward = (id) => {
    const before = stickers.find((s) => s.id === id);
    const z = prevZIndex();
    if (before) pushHistory({ type: 'sticker', id, before: { zIndex: before.zIndex }, after: { zIndex: z } });
    applyStickerPatch(id, { zIndex: z });
  };

  // Live, per-tick updates while a resize/rotate handle is being dragged —
  // deliberately NOT pushed to history here (that would flood the undo
  // stack with one entry per pixel/degree). See
  // handleStickerTransformStart/End below for the coalesced version.
  const handleStickerChange = (id, patch) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    clearTimeout(stickerDebounceRef.current[id]);
    stickerDebounceRef.current[id] = setTimeout(() => {
      updateSticker(id, patch).catch((err) => console.error(err));
    }, 250);
  };

  const handleStickerTransformStart = (id) => {
    const current = stickers.find((s) => s.id === id);
    if (current) transformSnapshotRef.current = { id, before: { scale: current.scale, rotation: current.rotation } };
  };

  const handleStickerTransformEnd = (id) => {
    const snap = transformSnapshotRef.current;
    transformSnapshotRef.current = null;
    if (!snap || snap.id !== id) return;
    const current = stickers.find((s) => s.id === id);
    if (!current) return;
    const after = { scale: current.scale, rotation: current.rotation };
    if (after.scale !== snap.before.scale || after.rotation !== snap.before.rotation) {
      pushHistory({ type: 'sticker', id, before: snap.before, after });
    }
  };

  const handleDuplicateSticker = async (sticker) => {
    const created = await createSticker({
      image: sticker.image,
      positionX: sticker.positionX + 24,
      positionY: sticker.positionY + 24,
      rotation: sticker.rotation,
      scale: sticker.scale,
      zIndex: nextZIndex(),
    });
    setStickers((prev) => [...prev, created]);
  };

  const handleToggleStickerLock = (sticker) => {
    pushHistory({
      type: 'sticker',
      id: sticker.id,
      before: { isLocked: sticker.isLocked },
      after: { isLocked: !sticker.isLocked },
    });
    applyStickerPatch(sticker.id, { isLocked: !sticker.isLocked });
  };

  const requestDeleteSticker = (sticker) => {
    setConfirmState({
      title: 'Remove this sticker?',
      message: 'This little decoration will be peeled off the board.',
      confirmLabel: 'Remove Sticker',
      onConfirm: async () => {
        setSelectedStickerId(null);
        await deleteSticker(sticker.id);
        setStickers((prev) => prev.filter((s) => s.id !== sticker.id));
      },
    });
  };

  const closeConfirm = () => {
    if (confirmBusy) return;
    setConfirmState(null);
  };

  const handleConfirmAccept = async () => {
    if (!confirmState) return;
    try {
      setConfirmBusy(true);
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (err) {
      console.error('Confirmed action failed', err);
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleToggleDecorateMode = () => {
    setDecorateMode((prev) => {
      const next = !prev;
      setStickerLibraryOpen(next);
      if (!next) setSelectedStickerId(null);
      return next;
    });
  };

  const handleSelectLayerItem = (item) => {
    if (item.type === 'note') {
      setReaderNoteId(item.id);
    } else {
      setDecorateMode(true);
      setSelectedStickerId(item.id);
    }
  };

  const handleLayerBringToFront = (item) => {
    if (item.type === 'note') handleBringNoteToFront(item.id);
    else handleBringStickerToFront(item.id);
  };

  const handleLayerSendBackward = (item) => {
    if (item.type === 'note') handleSendNoteBackward(item.id);
    else handleSendStickerBackward(item.id);
  };

  // "Delete all letters and stickers": the backend hard-deletes both lists for both accounts.
  const handleDeleteAll = async () => {
    setDeleteAllBusy(true);
    setDeleteAllError('');
    try {
      await deleteAllBoard();
      historyRef.current = { past: [], future: [] };
      setCanUndo(false);
      setCanRedo(false);
      setReaderNoteId(null);
      setSelectedStickerId(null);
      setDeleteAllOpen(false);
      addToast('All letters and stickers deleted.', 'success');
    } catch (err) {
      setDeleteAllError(err?.response?.data?.message || 'Could not delete everything. Please try again.');
    } finally {
      setDeleteAllBusy(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setAuthorFilter(null);
    setMoodFilter(null);
    setPaperFilter(null);
  };

  return (
    <div className="lb-room fixed inset-0 flex flex-col font-sans text-(--ink)">
      <header className="z-[110] flex flex-wrap items-center justify-between gap-2 border-0 border-b-2 border-solid border-(--ink) bg-(--white) px-3 py-3 text-(--ink) sm:gap-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/home')}
            aria-label="Back to Home"
            className="inline-flex min-h-11 shrink-0 cursor-pointer appearance-none items-center gap-1.5 rounded-full border-2 border-solid border-(--ink) bg-(--white) px-3 text-sm font-extrabold text-(--ink) transition hover:bg-(--sea-tint) sm:px-4"
          >
            <ArrowLeft size={18} strokeWidth={2.8} aria-hidden="true" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div className="hidden items-center gap-2.5 md:flex">
            <Icon name="envelope" size={40} />
            <h1 className="m-0 font-serif text-[1.9rem] leading-none font-extrabold">Our love board</h1>
          </div>
        </div>

        <BoardMenu
          activeTool={activeTool}
          onToolChange={setActiveTool}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          zoomPercent={zoomPercent}
          onZoomIn={() => boardRef.current?.zoomIn()}
          onZoomOut={() => boardRef.current?.zoomOut()}
          onResetView={() => boardRef.current?.resetView()}
          favoritesOnly={favoritesOnly}
          onToggleFavorites={() => setFavoritesOnly((v) => !v)}
          layersOpen={layersOpen}
          onToggleLayers={() => {
            setStickerLibraryOpen(false);
            setLayersOpen((v) => !v);
          }}
          onOpenArchive={() => setArchiveOpen(true)}
          decorateMode={decorateMode}
          onToggleDecorate={handleToggleDecorateMode}
          onDeleteAll={() => {
            setDeleteAllError('');
            setDeleteAllOpen(true);
          }}
        />
      </header>

      <main className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-[130] flex items-center justify-center bg-(--paper)/85" role="status" aria-live="polite">
            <p className="m-0 rounded-full border-2 border-solid border-(--ink) bg-white px-6 py-2 font-serif text-lg font-bold">Loading your board…</p>
          </div>
        )}
        {error && (
          <div role="alert" className="absolute top-4 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-solid border-(--ink) bg-(--citrus-tint) px-4 py-2 text-sm font-bold text-(--ink)">
            <Icon name="bell" size={28} />
            {error}
          </div>
        )}

        <CorkBoard
          ref={boardRef}
          notes={visibleNotes}
          stickers={stickers}
          decorateMode={decorateMode}
          activeTool={activeTool}
          selectedStickerId={selectedStickerId}
          onSelectSticker={setSelectedStickerId}
          onOpenNote={(note) => setReaderNoteId(note.id)}
          onNoteDragEnd={handleNoteDragEnd}
          onBringNoteToFront={handleBringNoteToFront}
          onStickerDragEnd={handleStickerDragEnd}
          onBringStickerToFront={handleBringStickerToFront}
          onSendStickerBackward={handleSendStickerBackward}
          onStickerChange={handleStickerChange}
          onStickerTransformStart={handleStickerTransformStart}
          onStickerTransformEnd={handleStickerTransformEnd}
          onDuplicateSticker={handleDuplicateSticker}
          onToggleStickerLock={handleToggleStickerLock}
          onDeleteSticker={requestDeleteSticker}
          onZoomChange={setZoomPercent}
          topNoteId={topNoteId}
          noteExitReasons={noteExitReasons}
        />

        <SearchFilterPanel
          open={searchOpen}
          query={query}
          onQueryChange={setQuery}
          authorOptions={authorOptions}
          authorFilter={authorFilter}
          onAuthorFilterChange={setAuthorFilter}
          moodFilter={moodFilter}
          onMoodFilterChange={setMoodFilter}
          paperOptions={PAPER_FILTER_OPTIONS}
          paperFilter={paperFilter}
          onPaperFilterChange={setPaperFilter}
          onClear={clearFilters}
        />

        <StickerLibrary
          open={stickerLibraryOpen}
          onAdd={handleAddSticker}
          onClose={() => setStickerLibraryOpen(false)}
        />

        <ArchiveDrawer
          open={archiveOpen}
          notes={archivedNotes}
          onClose={() => setArchiveOpen(false)}
          onRestore={handleRestoreFromArchive}
          onDelete={requestDeleteNote}
        />

        <LayerPanel
          open={layersOpen}
          items={layerItems}
          onClose={() => setLayersOpen(false)}
          onSelect={handleSelectLayerItem}
          onBringToFront={handleLayerBringToFront}
          onSendBackward={handleLayerSendBackward}
        />

        <BoardToolbar
          onWriteLetter={() => setComposerOpen(true)}
          stickerLibraryOpen={stickerLibraryOpen}
          onToggleStickerLibrary={() => {
            setLayersOpen(false);
            setStickerLibraryOpen((v) => !v);
          }}
          searchOpen={searchOpen}
          onToggleSearch={() => setSearchOpen((v) => !v)}
        />
      </main>

      <NoteComposerModal
        open={composerOpen}
        creating={creating}
        onClose={() => setComposerOpen(false)}
        onCreate={handleCreateNote}
      />

      <NoteReaderModal
        note={readerNote || null}
        saving={readerSaving}
        onClose={() => setReaderNoteId(null)}
        onSave={handleSaveNoteEdit}
        onToggleFavorite={handleToggleFavorite}
        onToggleArchive={handleToggleArchive}
        onDelete={() => requestDeleteNote(readerNote)}
      />

      <DeleteAllDialog
        open={deleteAllOpen}
        what="letters and stickers"
        busy={deleteAllBusy}
        error={deleteAllError}
        onConfirm={handleDeleteAll}
        onClose={() => setDeleteAllOpen(false)}
      />

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        busy={confirmBusy}
        onConfirm={handleConfirmAccept}
        onClose={closeConfirm}
      />
    </div>
  );
}
