import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Copy,
  Minus,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useBouquet } from '../queries/queries';
import { useBouquetMutations } from '../queries/mutations';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../hooks/useAuth';
import useBouquetEditor from '../hooks/useBouquetEditor';
import { LIMITS, clamp, emptyRecipe, normalizeRecipe, round1, wrapAngle } from '../utils/bouquetRecipe';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer/Footer';
import Button from '../components/ui/Button/Button';
import IconButton from '../components/ui/IconButton/IconButton';
import ConfirmDialog from '../components/ui/ConfirmDialog/ConfirmDialog';
import BouquetCanvas from '../components/bouquet/BouquetCanvas/BouquetCanvas';
import ToolTray from '../components/bouquet/ToolTray/ToolTray';
import form from '../components/ui/FormControls.module.css';
import styles from './BouquetMakerPage.module.css';

const DEFAULT_TITLE = 'Untitled bouquet';
const typing = (target) => /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName) || target?.isContentEditable;

// Maker for /bouquets/new and /bouquets/:id/edit.
export default function BouquetMakerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { createBouquet, updateBouquet } = useBouquetMutations();
  const { data: loaded, isLoading, isError, refetch } = useBouquet(id);

  // A new bouquet's card is signed with the signed-in name.
  const fresh = useMemo(() => {
    const base = emptyRecipe();
    return { ...base, card: { ...base.card, from: (user?.name || '').slice(0, 24) } };
  }, [user?.name]);
  const editor = useBouquetEditor(fresh);
  const { recipe, selected, selectedId } = editor;
  const [title, setTitle] = useState('');
  const [titleDirty, setTitleDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [justAddedId, setJustAddedId] = useState(null);

  const svgRef = useRef(null);
  const gesture = useRef(null);
  const loadedFor = useRef(null);
  const version = useRef(null);
  const dirty = editor.dirty || titleDirty;
  const selectedCardId = recipe.items.find((i) => i.type === 'card')?.id;

  // Load a saved bouquet into the editor once (later refetches must not wipe unsaved edits).
  useEffect(() => {
    if (!id || !loaded || loadedFor.current === loaded.id) return;
    loadedFor.current = loaded.id;
    version.current = loaded.version;
    editor.reset(normalizeRecipe(loaded.recipe));
    setTitle(loaded.title);
    setTitleDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loaded]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y (not while typing in a field, which has its own undo).
  const { undo, redo } = editor;
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || typing(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'z') (e.shiftKey ? redo : undo)();
      else if (key === 'y') redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ---- pointer gestures (mouse, touch, pen all arrive as pointer events) ----------------------
  const toPoint = (e) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!matrix) return { x: e.clientX, y: e.clientY };
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    return point.matrixTransform(matrix.inverse());
  };

  const begin = (e, item, kind) => {
    e.stopPropagation();
    e.preventDefault();
    editor.select(item.id);
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* the pointer may already be gone */
    }
    const start = toPoint(e);
    gesture.current = {
      kind,
      id: item.id,
      pointerId: e.pointerId,
      key: `${kind}:${item.id}:${e.timeStamp}`,
      start,
      orig: { x: item.x, y: item.y, r: item.r, s: item.s },
      startAngle: Math.atan2(start.y - item.y, start.x - item.x),
      startDist: Math.max(1, Math.hypot(start.x - item.x, start.y - item.y)),
    };
  };

  const onItemPointerDown = (e, item) => {
    e.currentTarget.focus?.({ preventScroll: true });
    begin(e, item, 'move');
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const p = toPoint(e);
    if (g.kind === 'move') {
      editor.patchItem(
        g.id,
        { x: round1(clamp(g.orig.x + p.x - g.start.x, 0, 400)), y: round1(clamp(g.orig.y + p.y - g.start.y, 0, 500)) },
        g.key
      );
    } else if (g.kind === 'rotate') {
      const turned = ((Math.atan2(p.y - g.orig.y, p.x - g.orig.x) - g.startAngle) * 180) / Math.PI;
      editor.patchItem(g.id, { r: wrapAngle(Math.round(g.orig.r + turned)) }, g.key);
    } else if (g.kind === 'scale') {
      const ratio = Math.hypot(p.x - g.orig.x, p.y - g.orig.y) / g.startDist;
      editor.patchItem(g.id, { s: Math.round(clamp(g.orig.s * ratio, LIMITS.minScale, LIMITS.maxScale) * 100) / 100 }, g.key);
    }
  };

  const endPointer = (e) => {
    if (gesture.current && gesture.current.pointerId === e.pointerId) {
      gesture.current = null;
      editor.endGesture();
    }
  };

  // ---- keyboard on a focused flower ------------------------------------------------------------
  const nudge = (item, dx, dy) =>
    editor.patchItem(
      item.id,
      (i) => ({ x: round1(clamp(i.x + dx, 0, 400)), y: round1(clamp(i.y + dy, 0, 500)) }),
      `key-move:${item.id}`
    );

  const onItemKeyDown = (e, item) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const step = e.shiftKey ? 16 : 4;
    switch (e.key) {
      case 'ArrowLeft': nudge(item, -step, 0); break;
      case 'ArrowRight': nudge(item, step, 0); break;
      case 'ArrowUp': nudge(item, 0, -step); break;
      case 'ArrowDown': nudge(item, 0, step); break;
      case '[': editor.rotateBy(item.id, -5, `key-rotate:${item.id}`); break;
      case ']': editor.rotateBy(item.id, 5, `key-rotate:${item.id}`); break;
      case '-': editor.scaleBy(item.id, 1 / 1.1, `key-scale:${item.id}`); break;
      case '+':
      case '=': editor.scaleBy(item.id, 1.1, `key-scale:${item.id}`); break;
      case 'PageUp': editor.layerItem(item.id, 1, e.shiftKey); break;
      case 'PageDown': editor.layerItem(item.id, -1, e.shiftKey); break;
      case 'Delete':
      case 'Backspace': removeItem(item); break;
      case 'd':
      case 'D': duplicate(item.id); break;
      case 'Escape': editor.select(null); break;
      default: return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const onKeyUp = () => editor.endGesture();

  // ---- actions -----------------------------------------------------------------------------------
  const addFlower = (name, tint) => {
    const added = editor.addFlower(name, tint);
    if (added) setJustAddedId(added);
    else addToast("That's a full bouquet, love.", 'info');
  };

  // Deleting the letter card turns "show the card" off (the Card tab can bring it back).
  function removeItem(item) {
    if (item.type === 'card') editor.setCardShown(false);
    else editor.removeItem(item.id);
  }

  function duplicate(itemId) {
    const copy = editor.duplicateItem(itemId);
    if (copy) setJustAddedId(copy);
    else if (editor.full) addToast("That's a full bouquet, love.", 'info');
  }

  const save = async () => {
    if (saving) return;
    const name = title.trim() || DEFAULT_TITLE;
    setSaving(true);
    try {
      const saved = id
        ? await updateBouquet(id, { title: name, recipe, version: version.current })
        : await createBouquet({ title: name, recipe });
      version.current = saved.version;
      editor.markSaved();
      setTitleDirty(false);
      addToast('Saved to our bouquets', 'success');
      navigate(`/bouquets/${saved.id}`);
    } catch (err) {
      const stale = err?.response?.status === 409;
      addToast(
        stale
          ? 'Someone changed this bouquet. Reload to get their version.'
          : err?.response?.data?.message || "Couldn't save. Your bouquet is still here.",
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => (dirty ? setLeaving(true) : navigate('/bouquets'));

  // Rebuilt every render on purpose: the handlers read the latest state.
  const interactive = {
      svgRef,
      selectedId,
      justAddedId,
      svgProps: {
        onPointerMove,
        onPointerUp: endPointer,
        onPointerCancel: endPointer,
        onPointerDown: () => editor.select(null),
      },
      onItemPointerDown,
      onItemKeyDown,
      onFocusItem: (item) => editor.select(item.id),
      onHandlePointerDown: (e, item, kind) => begin(e, item, kind),
      onDelete: removeItem,
  };

  if (id && isLoading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}><p className={styles.note} role="status">Loading your bouquet…</p></main>
      </div>
    );
  }
  if (id && (isError || !loaded)) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <p className={styles.note} role="alert">Couldn't load that bouquet.</p>
          <Button variant="secondary" onClick={() => refetch()}>Try again</Button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <header className={styles.top}>
          <IconButton label="Back" onClick={goBack}>
            <ChevronLeft size={20} />
          </IconButton>
          <input
            className={`${form.input} ${styles.titleInput}`}
            aria-label="Bouquet name"
            value={title}
            maxLength={40}
            placeholder={DEFAULT_TITLE}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleDirty(true);
            }}
          />
          <Button size="sm" variant="primary" loading={saving} onClick={save}>
            Save
          </Button>
        </header>

        <div className={styles.layout}>
          <section className={styles.stage} onKeyUp={onKeyUp} aria-label="Bouquet">
            <div className={styles.canvasWrap}>
              <BouquetCanvas recipe={recipe} interactive={interactive} />
            </div>

            {selected && (
              <div className={styles.toolbar} role="toolbar" aria-label="Selected flower">
                <IconButton label="Rotate left" onClick={() => editor.rotateBy(selected.id, -15)}><RotateCcw size={18} /></IconButton>
                <IconButton label="Rotate right" onClick={() => editor.rotateBy(selected.id, 15)}><RotateCw size={18} /></IconButton>
                <IconButton label="Smaller" onClick={() => editor.scaleBy(selected.id, 1 / 1.15)}><Minus size={18} /></IconButton>
                <IconButton label="Bigger" onClick={() => editor.scaleBy(selected.id, 1.15)}><Plus size={18} /></IconButton>
                <IconButton label="Bring forward" onClick={(e) => editor.layerItem(selected.id, 1, e.shiftKey)}><ArrowUp size={18} /></IconButton>
                <IconButton label="Send back" onClick={(e) => editor.layerItem(selected.id, -1, e.shiftKey)}><ArrowDown size={18} /></IconButton>
                {selected.type === 'flower' && (
                  <IconButton label="Duplicate" onClick={() => duplicate(selected.id)}><Copy size={18} /></IconButton>
                )}
                <IconButton label="Delete" onClick={() => removeItem(selected)}><Trash2 size={18} /></IconButton>
              </div>
            )}

            <div className={styles.globalRow}>
              <Button size="sm" variant="secondary" onClick={editor.undo} aria-disabled={!editor.canUndo || undefined} disabled={!editor.canUndo}>
                <Undo2 size={16} aria-hidden="true" /> Undo
              </Button>
              <Button size="sm" variant="secondary" onClick={editor.redo} aria-disabled={!editor.canRedo || undefined} disabled={!editor.canRedo}>
                <Redo2 size={16} aria-hidden="true" /> Redo
              </Button>
              <Button size="sm" variant="ghost" onClick={editor.clearAll} disabled={!recipe.items.length}>
                Clear all
              </Button>
            </div>
          </section>

          <aside className={styles.side} aria-label="Bouquet tools">
            <ToolTray
              recipe={recipe}
              full={editor.full}
              onWrap={editor.setWrap}
              onRibbon={editor.setRibbon}
              onAddFlower={addFlower}
              onCard={editor.setCard}
              onEndTyping={editor.endGesture}
              onCardShown={editor.setCardShown}
              onCardPaper={(paper) => selectedCardId && editor.patchItem(selectedCardId, { paper })}
            />
          </aside>
        </div>
      </main>
      <Footer />

      <ConfirmDialog
        open={leaving}
        title="Leave without saving?"
        message="Your changes to this bouquet will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        danger
        onConfirm={() => navigate('/bouquets')}
        onClose={() => setLeaving(false)}
      />
    </div>
  );
}
