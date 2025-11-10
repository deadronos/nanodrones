import type { FC } from 'react';
import { useSimStore } from '../state/simStore';

const formatItemId = (item: string) => {
  if (item.startsWith('block:')) {
    return item.replace('block:', '');
  }
  if (item.startsWith('resource:')) {
    return item.replace('resource:', '');
  }
  return item;
};

export const Hotbar: FC = () => {
  const { slots, activeIndex } = useSimStore((s) => s.player.hotbar);
  const inventory = useSimStore((s) => s.player.inventory);

  return (
    <div className="hotbar">
      {slots.map((inventoryIndex, index) => {
        const stack = inventoryIndex !== null && inventoryIndex !== undefined ? inventory[inventoryIndex] : null;
        return (
          <div key={index} className={`hotbar-slot ${index === activeIndex ? 'is-active' : ''}`}>
            <span className="hotbar-index">{index + 1}</span>
            <div className="hotbar-item">
              <span className="hotbar-item-label">{stack ? formatItemId(stack.item) : '—'}</span>
              {stack && stack.count > 1 && <span className="hotbar-count">{stack.count}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Hotbar;
