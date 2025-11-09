import type { FC } from 'react';
import { useMemo } from 'react';
import { useSimStore } from '../state/simStore';
import { columnKey, listActiveResources } from '../voxel/generator';

export const OrderRadial: FC = () => {
  const issueMineOrder = useSimStore((s) => s.issueMineOrder);
  const orders = useSimStore((s) => s.orders);
  const world = useSimStore((s) => s.world);

  const availableTargets = useMemo(() => {
    const active = new Set(
      orders.filter((o) => o.status !== 'completed').map((o) => columnKey(o.target)),
    );
    return listActiveResources(world.chunk).filter((coord) => !active.has(columnKey(coord))).length;
  }, [orders, world.chunk]);

  const disabled = availableTargets === 0;

  return (
    <section className="panel">
      <h2 className="panel-title">Orders</h2>
      <p className="panel-description">Issue contextual commands to your nano drones.</p>
      <button type="button" className="panel-button" onClick={issueMineOrder} disabled={disabled}>
        ⛏️ Mine resource {disabled ? '(no targets)' : ''}
      </button>
      <p className="panel-footnote">Click and drag to orbit. WASD to move.</p>
    </section>
  );
};
