import { useCallback, useMemo, useReducer, useRef } from 'react';
import {
  FLOWER_BY_NAME,
  LIMITS,
  clamp,
  emptyRecipe,
  fanPlacement,
  flowerCount,
  newItemId,
  round1,
  wrapAngle,
} from '../utils/bouquetRecipe';

/*
 * Bouquet editor state: the recipe, selection and undo/redo history (immutable snapshots, depth 50).
 * One-off edits (add, delete, colour...) push a snapshot each. A continuous gesture (drag, rotate,
 * scale, key nudge) passes a `key`: only the first change under that key pushes a snapshot, so a
 * whole drag is a single undo step. `endGesture` closes it.
 */
const toJson = (recipe) => JSON.stringify(recipe);
const init = (recipe) => ({ recipe, past: [], future: [], selectedId: null, gesture: null, savedJson: toJson(recipe) });

function reducer(state, action) {
  switch (action.type) {
    case 'reset':
      return init(action.recipe);
    case 'saved':
      return { ...state, savedJson: toJson(state.recipe) };
    case 'select':
      return state.selectedId === action.id ? state : { ...state, selectedId: action.id };
    case 'change': {
      const next = action.fn(state.recipe);
      if (!next || next === state.recipe) return state;
      const newStep = !action.key || action.key !== state.gesture;
      return {
        ...state,
        recipe: next,
        past: newStep ? [...state.past, state.recipe].slice(-LIMITS.history) : state.past,
        future: newStep ? [] : state.future,
        gesture: action.key || null,
        selectedId: action.select === undefined ? state.selectedId : action.select,
      };
    }
    case 'endGesture':
      return state.gesture ? { ...state, gesture: null } : state;
    case 'undo': {
      if (!state.past.length) return state;
      const recipe = state.past[state.past.length - 1];
      return {
        ...state,
        recipe,
        past: state.past.slice(0, -1),
        future: [state.recipe, ...state.future].slice(0, LIMITS.history),
        selectedId: recipe.items.some((i) => i.id === state.selectedId) ? state.selectedId : null,
        gesture: null,
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const [recipe, ...future] = state.future;
      return {
        ...state,
        recipe,
        past: [...state.past, state.recipe].slice(-LIMITS.history),
        future,
        selectedId: recipe.items.some((i) => i.id === state.selectedId) ? state.selectedId : null,
        gesture: null,
      };
    }
    default:
      return state;
  }
}

export default function useBouquetEditor(initial = emptyRecipe()) {
  const [state, dispatch] = useReducer(reducer, initial, init);
  const stateRef = useRef(state);
  stateRef.current = state;

  const change = useCallback((fn, options = {}) => dispatch({ type: 'change', fn, ...options }), []);
  const mapItem = (id, update) => (recipe) => {
    const index = recipe.items.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const current = recipe.items[index];
    const patch = typeof update === 'function' ? update(current) : update;
    const updated = { ...current, ...patch };
    if (Object.keys(patch).every((k) => current[k] === updated[k])) return null;
    const items = recipe.items.slice();
    items[index] = updated;
    return { ...recipe, items };
  };

  const actions = useMemo(
    () => ({
      select: (id) => dispatch({ type: 'select', id }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      endGesture: () => dispatch({ type: 'endGesture' }),
      reset: (recipe) => dispatch({ type: 'reset', recipe }),
      markSaved: () => dispatch({ type: 'saved' }),
      setWrap: (wrap) => change((r) => (r.wrap === wrap ? null : { ...r, wrap })),
      setRibbon: (patch) => change((r) => ({ ...r, ribbon: { ...r.ribbon, ...patch } })),
      clearAll: () => change((r) => (r.items.length ? { ...r, items: [] } : null), { select: null }),

      // Returns false when the bouquet is full (the page shows the toast).
      addFlower: (name, tint) => {
        const def = FLOWER_BY_NAME[name];
        const recipe = stateRef.current.recipe;
        if (!def || flowerCount(recipe) >= LIMITS.maxFlowers) return null;
        const index = flowerCount(recipe);
        const id = newItemId();
        const spot = fanPlacement(index, !def.stem);
        const item = {
          id,
          type: 'flower',
          name,
          tint: def.tints.includes(tint) ? tint : def.tints[0],
          ...spot,
          s: 1,
          flip: index % 2 === 1,
        };
        change((r) => ({ ...r, items: [...r.items, item] }), { select: id });
        return id;
      },

      patchItem: (id, update, key) => change(mapItem(id, update), { key }),
      removeItem: (id) =>
        change((r) => ({ ...r, items: r.items.filter((item) => item.id !== id) }), { select: null }),
      duplicateItem: (id) => {
        const recipe = stateRef.current.recipe;
        const source = recipe.items.find((item) => item.id === id);
        if (!source || source.type !== 'flower' || flowerCount(recipe) >= LIMITS.maxFlowers) return null;
        const copyId = newItemId();
        const copy = {
          ...source,
          id: copyId,
          x: round1(clamp(source.x + 14, 0, 400)),
          y: round1(clamp(source.y + 10, 0, 500)),
        };
        change(
          (r) => {
            const at = r.items.findIndex((item) => item.id === id);
            const items = r.items.slice();
            items.splice(at + 1, 0, copy);
            return { ...r, items };
          },
          { select: copyId }
        );
        return copyId;
      },
      // dir: +1 forward / -1 back; `toEdge` sends it all the way to the front / back.
      layerItem: (id, dir, toEdge = false) =>
        change((r) => {
          const from = r.items.findIndex((item) => item.id === id);
          if (from < 0) return null;
          const to = toEdge ? (dir > 0 ? r.items.length - 1 : 0) : clamp(from + dir, 0, r.items.length - 1);
          if (to === from) return null;
          const items = r.items.slice();
          const [moved] = items.splice(from, 1);
          items.splice(to, 0, moved);
          return { ...r, items };
        }),
      rotateBy: (id, deg, key) => change(mapItem(id, (i) => ({ r: wrapAngle(Math.round(i.r + deg)) })), { key }),
      scaleBy: (id, factor, key) =>
        change(
          mapItem(id, (i) => ({ s: round1Scale(clamp(i.s * factor, LIMITS.minScale, LIMITS.maxScale)) })),
          { key }
        ),
    }),
    [change]
  );

  const { recipe, past, future, selectedId, savedJson } = state;
  return {
    recipe,
    selectedId,
    selected: recipe.items.find((item) => item.id === selectedId) || null,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    dirty: toJson(recipe) !== savedJson,
    full: flowerCount(recipe) >= LIMITS.maxFlowers,
    ...actions,
  };
}

const round1Scale = (s) => Math.round(s * 100) / 100;
