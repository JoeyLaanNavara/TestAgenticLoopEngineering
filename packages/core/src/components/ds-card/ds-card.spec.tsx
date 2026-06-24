import { newSpecPage } from '@stencil/core/testing';
import { DsCard } from './ds-card';

describe('ds-card', () => {

  // ── Default rendering ──────────────────────────────────────────

  it('renders with default props', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card></ds-card>`,
    });
    expect(page.root).toBeDefined();
    expect(page.root.shadowRoot).toBeDefined();
  });

  it('renders the card body wrapper', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card></ds-card>`,
    });
    const body = page.root.shadowRoot.querySelector('.card__body');
    expect(body).toBeTruthy();
  });

  it('renders slot content in card body', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card>Card content here</ds-card>`,
    });
    expect(page.root.textContent).toContain('Card content here');
  });

  // ── heading prop ───────────────────────────────────────────────

  it('renders heading when prop is set', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card heading="My Title"></ds-card>`,
    });
    const heading = page.root.shadowRoot.querySelector('.card__heading');
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe('My Title');
  });

  it('does not render header element when heading prop is empty', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card></ds-card>`,
    });
    const header = page.root.shadowRoot.querySelector('.card__header');
    expect(header).toBeNull();
  });

  // ── subheading prop ────────────────────────────────────────────

  it('renders subheading when prop is set', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card heading="Title" subheading="Subtitle"></ds-card>`,
    });
    const subheading = page.root.shadowRoot.querySelector('.card__subheading');
    expect(subheading).toBeTruthy();
    expect(subheading.textContent).toBe('Subtitle');
  });

  it('does not render subheading element when subheading prop is empty', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card heading="Title"></ds-card>`,
    });
    const subheading = page.root.shadowRoot.querySelector('.card__subheading');
    expect(subheading).toBeNull();
  });

  it('renders header when only subheading is provided', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card subheading="Sub only"></ds-card>`,
    });
    const subheading = page.root.shadowRoot.querySelector('.card__subheading');
    expect(subheading).toBeTruthy();
    expect(subheading.textContent).toBe('Sub only');
  });

  // ── variant prop ───────────────────────────────────────────────

  it('applies default variant class', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card></ds-card>`,
    });
    expect(page.root.classList.contains('ds-card--default')).toBe(true);
  });

  it('applies outlined variant class', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card variant="outlined"></ds-card>`,
    });
    expect(page.root.classList.contains('ds-card--outlined')).toBe(true);
  });

  it('applies elevated variant class', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card variant="elevated"></ds-card>`,
    });
    expect(page.root.classList.contains('ds-card--elevated')).toBe(true);
  });

  // ── padding prop ───────────────────────────────────────────────

  it('applies md padding class by default', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card></ds-card>`,
    });
    expect(page.root.classList.contains('ds-card--pad-md')).toBe(true);
  });

  it('applies sm padding class', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card padding="sm"></ds-card>`,
    });
    expect(page.root.classList.contains('ds-card--pad-sm')).toBe(true);
  });

  it('applies lg padding class', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card padding="lg"></ds-card>`,
    });
    expect(page.root.classList.contains('ds-card--pad-lg')).toBe(true);
  });

  it('applies none padding class', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card padding="none"></ds-card>`,
    });
    expect(page.root.classList.contains('ds-card--pad-none')).toBe(true);
  });

  // ── clickable prop ─────────────────────────────────────────────

  it('does not apply clickable class by default', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card></ds-card>`,
    });
    expect(page.root.classList.contains('ds-card--clickable')).toBe(false);
  });

  it('applies clickable class when clickable prop is true', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card clickable></ds-card>`,
    });
    expect(page.root.classList.contains('ds-card--clickable')).toBe(true);
  });

  it('reflects clickable attribute to host', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card clickable></ds-card>`,
    });
    expect(page.root).toHaveAttribute('clickable');
  });

  it('sets role="button" on host when clickable', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card clickable></ds-card>`,
    });
    expect(page.root.getAttribute('role')).toBe('button');
  });

  it('sets tabindex="0" on host when clickable and not disabled', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card clickable></ds-card>`,
    });
    expect(page.root.getAttribute('tabindex')).toBe('0');
  });

  // ── disabled prop ──────────────────────────────────────────────

  it('reflects disabled attribute to host', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card disabled></ds-card>`,
    });
    expect(page.root.disabled).toBe(true);
    expect(page.root).toHaveAttribute('disabled');
  });

  it('sets aria-disabled="true" when disabled', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card disabled></ds-card>`,
    });
    expect(page.root.getAttribute('aria-disabled')).toBe('true');
  });

  it('does not set tabindex when clickable and disabled', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card clickable disabled></ds-card>`,
    });
    expect(page.root.getAttribute('tabindex')).toBeNull();
  });

  // ── dsCardClick event ──────────────────────────────────────────

  it('emits dsCardClick when clickable card is clicked', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card clickable></ds-card>`,
    });
    const spy = jest.fn();
    page.root.addEventListener('dsCardClick', spy);
    page.root.click();
    expect(spy).toHaveBeenCalled();
  });

  it('does not emit dsCardClick when not clickable', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card></ds-card>`,
    });
    const spy = jest.fn();
    page.root.addEventListener('dsCardClick', spy);
    page.root.click();
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not emit dsCardClick when disabled', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card clickable disabled></ds-card>`,
    });
    const spy = jest.fn();
    page.root.addEventListener('dsCardClick', spy);
    page.root.click();
    expect(spy).not.toHaveBeenCalled();
  });

  // ── Edge cases ─────────────────────────────────────────────────

  it('renders without throwing when all props are empty strings', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card heading="" subheading=""></ds-card>`,
    });
    expect(page.root).toBeDefined();
  });

  it('renders heading and subheading together correctly', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card heading="Title" subheading="Sub"></ds-card>`,
    });
    const header = page.root.shadowRoot.querySelector('.card__header');
    expect(header).toBeTruthy();
    expect(header.querySelector('.card__heading').textContent).toBe('Title');
    expect(header.querySelector('.card__subheading').textContent).toBe('Sub');
  });

  it('renders role and tabindex correctly on non-clickable card', async () => {
    const page = await newSpecPage({
      components: [DsCard],
      html: `<ds-card></ds-card>`,
    });
    expect(page.root.getAttribute('role')).toBeNull();
    expect(page.root.getAttribute('tabindex')).toBeNull();
  });
});
