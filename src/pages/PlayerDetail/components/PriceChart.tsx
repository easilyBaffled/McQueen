import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Customized,
} from 'recharts';
import { EventMarkerPopup, getEventConfig } from '../../../shared';
import type { PriceReason, PriceHistoryEntry, EventData, ContentItem } from '../../../types';
import styles from '../PlayerDetail.module.css';

interface ChartEntry {
  time: number;
  price: number;
  timestamp: string;
  reason: PriceReason;
  content?: ContentItem[];
}

const markerPaths: Record<string, string> = {
  TD: 'M0 -5L1.5 -1.5L5.5 -0.8L2.5 2L3.1 6L0 4.2L-3.1 6L-2.5 2L-5.5 -0.8L-1.5 -1.5Z',
  INT: 'M-4 -4L4 4M4 -4L-4 4',
  injury: 'M-1.5 -5V5M-5 -1.5H5',
  trade: 'M-4 1L0 -3L4 1M-4 -1L0 3L4 -1',
  league_trade: 'M-4 3L0 -3L4 3',
  news: 'M-4 -4H4V4H-4ZM-2 -1H2M-2 1H2',
  earnings: 'M0 -5V5M-3 -3H2M-2 0H3M-3 3H2',
  stats: 'M-4 5V0M0 5V-3M4 5V-5',
  game_event: 'M0 -4A6 4 0 0 1 0 4A6 4 0 0 1 0 -4',
  default: '',
};

function getReasonEventType(reason: PriceReason | null | undefined): string {
  if (!reason) return 'default';
  if (reason.type === 'game_event') return reason.eventType || 'stats';
  if (reason.type === 'news') return 'news';
  if (reason.type === 'league_trade') return 'trade';
  return 'default';
}

interface PriceChartProps {
  priceHistory: PriceHistoryEntry[];
  basePrice: number;
  isUp: boolean;
}

export default function PriceChart({ priceHistory, basePrice, isUp }: PriceChartProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const chartData: ChartEntry[] =
    priceHistory.map((entry, i) => ({
      time: i,
      price: entry.price,
      timestamp: entry.timestamp,
      reason: entry.reason,
      content: entry.content,
    })) || [];

  const formatDateLabel = (index: number) => {
    const entry = chartData[index];
    if (!entry?.timestamp) return '';
    const date = new Date(entry.timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const xAxisInterval = Math.max(0, Math.floor((chartData.length - 1) / 4));

  const handleEventClick = (priceEntry: ChartEntry, cx: number, cy: number) => {
    setPopupPosition({ x: cx, y: cy + 20 });
    setSelectedEvent({
      type: getReasonEventType(priceEntry.reason),
      headline: priceEntry.reason?.headline || '',
      source: priceEntry.reason?.source || '',
      url: priceEntry.reason?.url || '',
      price: priceEntry.price,
      timestamp: priceEntry.timestamp,
      memberId: priceEntry.reason?.memberId,
      action: priceEntry.reason?.action,
      shares: priceEntry.reason?.shares,
    });
  };

  const closeEventPopup = () => setSelectedEvent(null);

  const EventMarker = ({ cx, cy, priceEntry }: { cx: number; cy: number; priceEntry: ChartEntry }) => {
    const eventType = getReasonEventType(priceEntry.reason);
    const config = getEventConfig(eventType);
    const path = markerPaths[eventType] || markerPaths.default;
    const isStroke = ['INT', 'injury', 'news', 'stats'].includes(eventType);

    return (
      <g
        style={{ cursor: 'pointer' }}
        onClick={() => handleEventClick(priceEntry, cx, cy)}
        transform={`translate(${cx}, ${cy})`}
      >
        <circle cx={0} cy={0} r={10} fill={config.color} stroke="#1A1A1A" strokeWidth={2} />
        {path && (
          <path
            d={path}
            fill={isStroke ? 'none' : '#fff'}
            stroke={isStroke ? '#fff' : 'none'}
            strokeWidth={isStroke ? 1.5 : 0}
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </g>
    );
  };

  return (
    <motion.div
      className={styles['chart-card']}
      data-testid="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3>Price History</h3>
      <div className={styles['chart-container']} data-testid="chart-container" ref={chartContainerRef}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666', fontSize: 11 }}
              tickFormatter={formatDateLabel}
              interval={xAxisInterval}
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666', fontSize: 12 }}
              width={50}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: '#1A1A1A',
                border: '1px solid #333',
                borderRadius: '8px',
              }}
              labelStyle={{ display: 'none' }}
              formatter={(
                value: number,
                _name: string,
                props: { payload?: ChartEntry },
              ) => {
                const entry = props.payload;
                return [
                  `$${Number(value).toFixed(2)}`,
                  entry?.reason?.headline
                    ? entry.reason.headline.substring(0, 40) + '...'
                    : 'Price',
                ];
              }}
            />
            <ReferenceLine y={basePrice} stroke="#666" strokeDasharray="3 3" />
            <Line
              type="linear"
              dataKey="price"
              stroke={isUp ? '#00C853' : '#FF1744'}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: isUp ? '#00C853' : '#FF1744' }}
            />
            <Customized
              component={({
                xAxisMap,
                yAxisMap,
              }: {
                xAxisMap?: Record<string, { scale?: (v: number) => number }>;
                yAxisMap?: Record<string, { scale?: (v: number) => number }>;
              }) => {
                const xAxis = xAxisMap && Object.values(xAxisMap)[0];
                const yAxis = yAxisMap && Object.values(yAxisMap)[0];
                const xScale = xAxis?.scale;
                const yScale = yAxis?.scale;
                if (!xScale || !yScale) return null;

                return (
                  <g className={styles['event-markers']}>
                    {chartData.map((entry, idx) => {
                      const reason = entry.reason;
                      if (!reason || (reason.type === 'news' && reason.headline?.includes('baseline'))) {
                        return null;
                      }
                      const showMarker =
                        reason.type === 'game_event' ||
                        (reason.type === 'news' && reason.eventType) ||
                        reason.type === 'league_trade';
                      if (!showMarker) return null;

                      const cx = xScale(entry.time);
                      const cy = yScale(entry.price);
                      if (isNaN(cx) || isNaN(cy)) return null;

                      return <EventMarker key={idx} cx={cx} cy={cy} priceEntry={entry} />;
                    })}
                  </g>
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        {selectedEvent && (
          <EventMarkerPopup
            event={selectedEvent as EventData}
            position={popupPosition}
            onClose={closeEventPopup}
          />
        )}
      </div>
    </motion.div>
  );
}
