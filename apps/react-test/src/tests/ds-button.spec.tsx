import React from 'react';
import { render } from '@testing-library/react';
import { DsButton } from '@my-org/react';

// The React wrapper created by createReactComponent() renders a <ds-button> custom
// element and forwards React props as element properties using attachProps(). In a
// happy-dom/jsdom environment the custom element is an unknown HTMLElement, so
// properties land directly on the DOM node. We test the binding layer, not Stencil
// component behaviour (which is covered by packages/core tests).

describe('DsButton — React wrapper', () => {
  // ── Rendering ──────────────────────────────────────────────────────
  it('renders the ds-button custom element', () => {
    const { container } = render(<DsButton />);
    expect(container.querySelector('ds-button')).toBeTruthy();
  });

  // ── Prop forwarding ────────────────────────────────────────────────
  it('forwards label prop as element property', () => {
    const { container } = render(<DsButton label="Click Me" />);
    const el = container.querySelector('ds-button') as any;
    expect(el.label).toBe('Click Me');
  });

  it('forwards variant="secondary" as element property', () => {
    const { container } = render(<DsButton variant="secondary" />);
    const el = container.querySelector('ds-button') as any;
    expect(el.variant).toBe('secondary');
  });

  it('forwards variant="danger" as element property', () => {
    const { container } = render(<DsButton variant="danger" />);
    const el = container.querySelector('ds-button') as any;
    expect(el.variant).toBe('danger');
  });

  it('forwards disabled=true as element property', () => {
    const { container } = render(<DsButton disabled />);
    const el = container.querySelector('ds-button') as any;
    expect(el.disabled).toBe(true);
  });

  it('forwards disabled=false as element property', () => {
    const { container } = render(<DsButton disabled={false} />);
    const el = container.querySelector('ds-button') as any;
    expect(el.disabled).toBeFalsy();
  });

  // ── Event handling ────────────────────────────────────────────────
  // The React wrapper uses attachProps() which maps onDsClick → addEventListener('dsClick').
  it('calls onDsClick handler when dsClick event fires', () => {
    const handler = vi.fn();
    const { container } = render(
      <DsButton onDsClick={handler as unknown as (e: CustomEvent<void>) => void} />
    );
    const el = container.querySelector('ds-button') as HTMLElement;
    el.dispatchEvent(new CustomEvent('dsClick', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call onDsClick when a different event fires', () => {
    const handler = vi.fn();
    const { container } = render(
      <DsButton onDsClick={handler as unknown as (e: CustomEvent<void>) => void} />
    );
    const el = container.querySelector('ds-button') as HTMLElement;
    el.dispatchEvent(new CustomEvent('click'));
    expect(handler).not.toHaveBeenCalled();
  });

  // ── Slot / children ────────────────────────────────────────────────
  it('renders children inside the custom element', () => {
    const { container } = render(<DsButton>Button text</DsButton>);
    const el = container.querySelector('ds-button') as HTMLElement;
    expect(el.textContent).toBe('Button text');
  });

  // ── Prop updates ───────────────────────────────────────────────────
  it('updates element property when label prop changes', () => {
    const { container, rerender } = render(<DsButton label="Initial" />);
    rerender(<DsButton label="Updated" />);
    const el = container.querySelector('ds-button') as any;
    expect(el.label).toBe('Updated');
  });
});
