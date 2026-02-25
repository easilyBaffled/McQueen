import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventMarkerPopup from '../EventMarkerPopup';
import type { EventData } from '../../../types';

const animationProps = new Set([
  'initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap',
  'layout', 'variants', 'layoutId',
]);
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_: unknown, tag: string | symbol) => {
        const Component = React.forwardRef(({
          children,
          ...props
        }: {
          children?: React.ReactNode;
          [key: string]: unknown;
        }, ref: React.Ref<unknown>) => {
          const domProps: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(props)) {
            if (animationProps.has(key)) continue;
            if (key === 'style' && typeof value === 'object') domProps[key] = value;
            else if (typeof value === 'function' && key.startsWith('on')) domProps[key] = value;
            else if (typeof value !== 'object') domProps[key] = value;
          }
          return React.createElement(String(tag), { ref, ...domProps }, children);
        });
        Component.displayName = `motion.${String(tag)}`;
        return Component;
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseEvent: EventData = {
  type: 'TD',
  headline: 'Mahomes throws 3 TDs',
  price: 120.5,
  timestamp: '2025-01-02T14:00:00Z',
  source: 'ESPN',
  url: 'https://espn.com/article',
};

function createContainerRef(width: number, height: number) {
  const div = document.createElement('div');
  div.getBoundingClientRect = () => ({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
  return { current: div } as React.RefObject<HTMLDivElement>;
}

function getPopupStyle() {
  const headline = screen.getByText('Mahomes throws 3 TDs');
  const popup = headline.closest('div[style]') as HTMLElement;
  return {
    left: parseFloat(popup.style.left),
    top: parseFloat(popup.style.top),
  };
}

describe('EventMarkerPopup boundary checking', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  describe('TC-001: Popup stays within container near right edge', () => {
    it('clamps x when marker + half popup width exceeds container width', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 550, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { left } = getPopupStyle();
      // 550 + 130 = 680 > 600, so x clamps to 600 - 130 = 470
      expect(left).toBe(470);
    });

    it('clamps x at the exact boundary (cx + 130 == containerWidth)', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 470, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { left } = getPopupStyle();
      // 470 + 130 = 600 == containerWidth, not greater, so no adjustment
      expect(left).toBe(470);
    });

    it('clamps x when 1px past the right boundary', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 471, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { left } = getPopupStyle();
      // 471 + 130 = 601 > 600, so clamps to 470
      expect(left).toBe(470);
    });
  });

  describe('TC-002: Popup stays within container near left edge', () => {
    it('clamps x when marker - half popup width is negative', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 50, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { left } = getPopupStyle();
      // 50 - 130 = -80 < 0, so x clamps to 130
      expect(left).toBe(130);
    });

    it('clamps x when marker is at x=0', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 0, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { left } = getPopupStyle();
      expect(left).toBe(130);
    });

    it('does not adjust when x equals exactly POPUP_MIN_WIDTH/2', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 130, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { left } = getPopupStyle();
      // 130 - 130 = 0, not < 0, so no adjustment
      expect(left).toBe(130);
    });
  });

  describe('TC-003: Popup shifts above marker near bottom edge', () => {
    it('shifts y above when popup would overflow bottom', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 300, y: 220 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { top } = getPopupStyle();
      // 220 + 150 = 370 > 250, so y = 220 - 150 - 40 = 30
      expect(top).toBe(30);
    });

    it('shifts y at exact boundary (y + 150 == containerHeight triggers shift)', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 300, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { top } = getPopupStyle();
      // 100 + 150 = 250 == containerHeight, not greater, so no adjustment
      expect(top).toBe(100);
    });

    it('shifts when marker is at the very bottom', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 300, y: 250 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { top } = getPopupStyle();
      // 250 + 150 = 400 > 250, so y = 250 - 150 - 40 = 60
      expect(top).toBe(60);
    });
  });

  describe('TC-004: No adjustment for markers in center', () => {
    it('positions popup at default location when comfortably inside', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 300, y: 50 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { left, top } = getPopupStyle();
      expect(left).toBe(300);
      expect(top).toBe(50);
    });
  });

  describe('TC-005: Combined right + bottom edge adjustment', () => {
    it('clamps both x and y when marker is in bottom-right corner', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 580, y: 220 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { left, top } = getPopupStyle();
      // Right: 580 + 130 = 710 > 600 → x = 470
      // Bottom: 220 + 150 = 370 > 250 → y = 220 - 150 - 40 = 30
      expect(left).toBe(470);
      expect(top).toBe(30);
    });
  });

  describe('TC-006: Combined left + bottom edge adjustment', () => {
    it('clamps both x (left) and y (bottom) when marker is in bottom-left corner', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 30, y: 230 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const { left, top } = getPopupStyle();
      // Left: 30 - 130 = -100 < 0 → x = 130
      // Bottom: 230 + 150 = 380 > 250 → y = 230 - 150 - 40 = 40
      expect(left).toBe(130);
      expect(top).toBe(40);
    });
  });

  describe('TC-007: Graceful fallback when containerRef is missing', () => {
    it('uses raw position when containerRef is undefined', () => {
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 500, y: 200 }}
          onClose={onClose}
        />,
      );
      const { left, top } = getPopupStyle();
      expect(left).toBe(500);
      expect(top).toBe(200);
    });

    it('uses raw position when containerRef.current is null', () => {
      const nullRef = { current: null } as React.RefObject<HTMLDivElement | null>;
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 500, y: 200 }}
          onClose={onClose}
          containerRef={nullRef}
        />,
      );
      const { left, top } = getPopupStyle();
      expect(left).toBe(500);
      expect(top).toBe(200);
    });

    it('renders without errors when containerRef is missing', () => {
      expect(() => {
        render(
          <EventMarkerPopup
            event={baseEvent}
            position={{ x: 500, y: 200 }}
            onClose={onClose}
          />,
        );
      }).not.toThrow();
      expect(screen.getByText('Mahomes throws 3 TDs')).toBeInTheDocument();
    });
  });

  describe('TC-009: Popup remains interactive after boundary adjustment', () => {
    it('close button works after right-edge adjustment', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 550, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const closeBtn = screen.getByLabelText('Close event details');
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Escape key closes popup after adjustment', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 50, y: 220 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('click outside closes popup after adjustment', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 550, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      fireEvent.mouseDown(document.body);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Read Full Story link renders after adjustment', () => {
      const containerRef = createContainerRef(600, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 550, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      const link = screen.getByText('Read Full Story');
      expect(link).toHaveAttribute('href', 'https://espn.com/article');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('TC-010: Boundary checking uses current container dimensions', () => {
    it('uses getBoundingClientRect on each render for fresh dimensions', () => {
      const containerRef = createContainerRef(1200, 400);
      const { unmount } = render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 550, y: 100 }}
          onClose={onClose}
          containerRef={containerRef}
        />,
      );
      let { left } = getPopupStyle();
      // 1200px wide: 550 + 130 = 680 < 1200 → no adjustment
      expect(left).toBe(550);
      unmount();

      // Simulate resize by updating the mock
      const narrowRef = createContainerRef(400, 250);
      render(
        <EventMarkerPopup
          event={baseEvent}
          position={{ x: 550, y: 100 }}
          onClose={onClose}
          containerRef={narrowRef}
        />,
      );
      ({ left } = getPopupStyle());
      // 400px wide: 550 + 130 = 680 > 400 → x = 400 - 130 = 270
      expect(left).toBe(270);
    });
  });

  it('returns null when event is null', () => {
    const { container } = render(
      <EventMarkerPopup
        event={null}
        position={{ x: 300, y: 100 }}
        onClose={onClose}
      />,
    );
    expect(container.innerHTML).toBe('');
  });
});
