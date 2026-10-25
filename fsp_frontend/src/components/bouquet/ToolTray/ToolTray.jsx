import { useState } from 'react';
import Tabs, { TabPanel } from '../../ui/Tabs/Tabs';
import RadioGroup, { ColorSwatchGroup } from '../../ui/RadioGroup/RadioGroup';
import FlowerGlyph from '../BouquetCanvas/FlowerGlyph';
import { RIBBON_COLORS, WRAPS, WrapSwatch } from '../BouquetCanvas/parts';
import Field from '../../ui/Field/Field';
import { CARD_PAPERS, FLOWERS, LETTER_MAX, NAME_MAX, TINT_HEX, TINT_NAMES, findCard } from '../../../utils/bouquetRecipe';
import form from '../../ui/FormControls.module.css';
import styles from './ToolTray.module.css';

const TABS = [
  { id: 'wrap', label: 'Wrap' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'flowers', label: 'Flowers' },
  { id: 'card', label: 'Card' },
];

const RIBBON_STYLES = [
  { value: 'bow', label: 'Bow' },
  { value: 'band', label: 'Band' },
  { value: 'none', label: 'None' },
];

function FlowerTile({ flower, tint, onAdd, disabled }) {
  return (
    <button type="button" className={styles.flowerTile} onClick={onAdd} aria-label={`Add ${flower.label}`} aria-disabled={disabled || undefined}>
      <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true" focusable="false">
        <FlowerGlyph name={flower.name} tint={tint} />
      </svg>
      <span className={styles.flowerName}>{flower.label}</span>
    </button>
  );
}

// Letter card: text, names, paper and whether it shows in the picture. Typing is one undo step
// (the editor coalesces on the key; `onEndTyping` closes it on blur).
function CardPanel({ recipe, onCard, onEndTyping, onShown, onPaper }) {
  const card = recipe.card;
  const cardItem = findCard(recipe);
  const text = card.text || '';
  return (
    <div className={styles.stack}>
      <label className={styles.toggle}>
        <input type="checkbox" checked={card.show !== false} onChange={(e) => onShown(e.target.checked)} />
        <span>Show the card in the picture</span>
      </label>
      <Field label="Write something sweet" htmlFor="bouquet-letter" hint={`${text.length}/${LETTER_MAX}`}>
        <textarea
          id="bouquet-letter"
          className={`${form.textarea} ${styles.letter}`}
          rows={4}
          maxLength={LETTER_MAX}
          value={text}
          onChange={(e) => onCard({ text: e.target.value }, 'card-text')}
          onBlur={onEndTyping}
        />
      </Field>
      <div className={styles.names}>
        <Field label="To" htmlFor="bouquet-to">
          <input id="bouquet-to" className={form.input} maxLength={NAME_MAX} value={card.to || ''} onChange={(e) => onCard({ to: e.target.value }, 'card-to')} onBlur={onEndTyping} />
        </Field>
        <Field label="From" htmlFor="bouquet-from">
          <input id="bouquet-from" className={form.input} maxLength={NAME_MAX} value={card.from || ''} onChange={(e) => onCard({ from: e.target.value }, 'card-from')} onBlur={onEndTyping} />
        </Field>
      </div>
      {cardItem && (
        <RadioGroup
          label="Card paper"
          value={cardItem.paper}
          onChange={onPaper}
          options={CARD_PAPERS.map((p) => ({ value: p.id, label: p.label }))}
        />
      )}
    </div>
  );
}

/** Wrap · Ribbon · Flowers · Card panels. Everything is controlled by the recipe. */
export default function ToolTray({ recipe, onWrap, onRibbon, onAddFlower, full, onCard, onEndTyping, onCardShown, onCardPaper }) {
  const [tab, setTab] = useState('wrap');
  const [tints, setTints] = useState({}); // chosen tint per flower name

  return (
    <div className={styles.tray}>
      <Tabs label="Bouquet tools" tabs={TABS} value={tab} onChange={setTab} idPrefix="bouquet-tools" />

      <div className={styles.panel}>
        <TabPanel idPrefix="bouquet-tools" id="wrap" active={tab === 'wrap'}>
          <RadioGroup
            label="Wrap paper"
            value={recipe.wrap}
            onChange={onWrap}
            className={styles.wraps}
            options={WRAPS.map((w) => ({
              value: w.value,
              label: w.label,
              content: <WrapSwatch wrap={w.value} uid={`tile-${w.value}`} size={52} />,
            }))}
          />
        </TabPanel>

        <TabPanel idPrefix="bouquet-tools" id="ribbon" active={tab === 'ribbon'}>
          <div className={styles.stack}>
            <RadioGroup
              label="Ribbon style"
              value={recipe.ribbon.style}
              onChange={(style) => onRibbon({ style })}
              options={RIBBON_STYLES}
            />
            <ColorSwatchGroup
              label="Ribbon colour"
              value={recipe.ribbon.color}
              onChange={(color) => onRibbon({ color })}
              colors={RIBBON_COLORS}
              disabled={recipe.ribbon.style === 'none'}
            />
          </div>
        </TabPanel>

        <TabPanel idPrefix="bouquet-tools" id="flowers" active={tab === 'flowers'}>
          {full && <p className={styles.full} role="status">That's a full bouquet, love.</p>}
          <ul className={styles.flowers}>
            {FLOWERS.map((flower) => {
              const tint = tints[flower.name] || flower.tints[0];
              return (
                <li key={flower.name} className={styles.flowerCell}>
                  <FlowerTile flower={flower} tint={tint} disabled={full} onAdd={() => onAddFlower(flower.name, tint)} />
                  {flower.tints.length > 1 && (
                    <ColorSwatchGroup
                      label={`${flower.label} colour`}
                      value={tint}
                      onChange={(next) => setTints((prev) => ({ ...prev, [flower.name]: next }))}
                      colors={flower.tints.map((t) => ({ value: t, name: TINT_NAMES[t], color: TINT_HEX[t] }))}
                      className={styles.tints}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </TabPanel>

        <TabPanel idPrefix="bouquet-tools" id="card" active={tab === 'card'}>
          <CardPanel recipe={recipe} onCard={onCard} onEndTyping={onEndTyping} onShown={onCardShown} onPaper={onCardPaper} />
        </TabPanel>
      </div>
    </div>
  );
}
