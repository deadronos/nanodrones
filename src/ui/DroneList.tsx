import type { FC } from 'react';
import { useSimStore } from '../state/simStore';

const formatActivity = (activity: string) => activity.charAt(0).toUpperCase() + activity.slice(1);

export const DroneList: FC = () => {
  const drones = useSimStore((s) => s.drones);
  const orders = useSimStore((s) => s.orders);

  return (
    <section className="panel">
      <h2 className="panel-title">Drones</h2>
      <ul className="panel-list">
        {drones.map((drone) => {
          const activeOrder = orders.find(
            (order) => order.droneId === drone.id && order.status !== 'completed',
          );
          return (
            <li key={drone.id} className="panel-row">
              <span className="panel-label">{drone.id}</span>
              <span className="panel-value">
                {formatActivity(drone.activity)}
                {activeOrder ? ` → ${activeOrder.type} #${activeOrder.id}` : ''}
              </span>
              <span className="panel-subvalue">⚡{Math.round(drone.battery * 100)}%</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
