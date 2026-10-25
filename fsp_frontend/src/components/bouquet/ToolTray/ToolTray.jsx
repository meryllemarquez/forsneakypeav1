import { useState } from 'react';
import Tabs, { TabPanel } from '../../ui/Tabs/Tabs';
import RadioGroup, { ColorSwatchGroup } from '../../ui/RadioGroup/RadioGroup';
import FlowerGlyph from '../BouquetCanvas/FlowerGlyph';
import { RIBBON_COLORS, WRAPS, WrapSwatch } from '../BouquetCanvas/parts';
import { FLOWERS, TINT_HEX, TINT_NAMES } from '../../../utils/bouquetRecipe';
import styles from './ToolTray.module.css';

const TABS = [
  { id: 'wrap', label: 'Wrap' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'flowers', label: 'Flowers' },
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

/** Wrap · Ribbon · Flowers panels. The wrap and ribbon choices are controlled by the recipe. */
export default function ToolTray({ recipe, onWrap, onRibbon, onAddFlower, full }) {
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
      </div>
    </div>
  );
}
