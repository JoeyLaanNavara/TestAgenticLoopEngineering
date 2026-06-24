import { newSpecPage } from '@stencil/core/testing';
import { DsButton } from './ds-button';

describe('ds-button', () => {
  it('renders with default label', async () => {
    const page = await newSpecPage({
      components: [DsButton],
      html: '<ds-button></ds-button>',
    });
    const button = page.root?.shadowRoot?.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('renders with custom label prop', async () => {
    const page = await newSpecPage({
      components: [DsButton],
      html: '<ds-button label="Click me"></ds-button>',
    });
    expect(page.root?.label).toBe('Click me');
  });

  it('renders with primary variant by default', async () => {
    const page = await newSpecPage({
      components: [DsButton],
      html: '<ds-button></ds-button>',
    });
    const button = page.root?.shadowRoot?.querySelector('button');
    expect(button?.classList.contains('btn--primary')).toBe(true);
  });

  it('applies secondary variant class', async () => {
    const page = await newSpecPage({
      components: [DsButton],
      html: '<ds-button variant="secondary"></ds-button>',
    });
    const button = page.root?.shadowRoot?.querySelector('button');
    expect(button?.classList.contains('btn--secondary')).toBe(true);
  });

  it('disables the button when disabled prop is true', async () => {
    const page = await newSpecPage({
      components: [DsButton],
      html: '<ds-button disabled></ds-button>',
    });
    const button = page.root?.shadowRoot?.querySelector('button');
    expect(button?.disabled).toBe(true);
  });

  it('emits dsClick event when clicked', async () => {
    const page = await newSpecPage({
      components: [DsButton],
      html: '<ds-button></ds-button>',
    });
    const clickSpy = jest.fn();
    page.root?.addEventListener('dsClick', clickSpy);
    page.root?.shadowRoot?.querySelector('button')?.click();
    expect(clickSpy).toHaveBeenCalled();
  });
});
