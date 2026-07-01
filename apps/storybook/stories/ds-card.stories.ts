import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

interface DsCardArgs {
  heading: string;
  subheading: string;
  variant: 'default' | 'outlined' | 'elevated';
  clickable: boolean;
  disabled: boolean;
  padding: 'none' | 'sm' | 'md' | 'lg';
}

// ── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta<DsCardArgs> = {
  title: 'Design System/DsCard',
  tags: ['autodocs'],

  render: (args) => html`
    <ds-card
      heading=${args.heading}
      subheading=${args.subheading}
      variant=${args.variant}
      ?clickable=${args.clickable}
      ?disabled=${args.disabled}
      padding=${args.padding}
      style="max-width: 400px;"
    >
      <p>Card body content goes here. Use the default slot for any markup.</p>
    </ds-card>
  `,

  argTypes: {
    heading: {
      control: 'text',
      description: 'The card heading text. Use the named `header` slot for richer markup.',
      table: { defaultValue: { summary: '' }, type: { summary: 'string' } },
    },
    subheading: {
      control: 'text',
      description: 'Secondary text displayed below the heading.',
      table: { defaultValue: { summary: '' }, type: { summary: 'string' } },
    },
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
      description: 'Visual variant controlling border and shadow treatment.',
      table: { defaultValue: { summary: 'default' } },
    },
    clickable: {
      control: 'boolean',
      description: 'When true, the card receives hover/focus styles and emits `dsCardClick`.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the card — suppresses interaction and dims the surface.',
      table: { defaultValue: { summary: 'false' } },
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Controls internal padding. Use `none` for full-bleed media cards.',
      table: { defaultValue: { summary: 'md' } },
    },
  },

  args: {
    heading: 'Card Heading',
    subheading: '',
    variant: 'default',
    clickable: false,
    disabled: false,
    padding: 'md',
  },
};

export default meta;
type Story = StoryObj<DsCardArgs>;

// ── Stories ─────────────────────────────────────────────────────────────────

/** Default state — all props at their default values */
export const Default: Story = {};

/** Heading and subheading together */
export const WithSubheading: Story = {
  args: {
    heading: 'Card Title',
    subheading: 'Supporting description text below the heading',
  },
};

/** All three visual variants side by side */
export const Variants: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start;">
      <ds-card heading="Default" variant="default" style="width: 220px;">
        <p>Standard card with border and subtle shadow.</p>
      </ds-card>
      <ds-card heading="Outlined" variant="outlined" style="width: 220px;">
        <p>Stronger border, no shadow — clean table-style layout.</p>
      </ds-card>
      <ds-card heading="Elevated" variant="elevated" style="width: 220px;">
        <p>No border, medium shadow — floating surface effect.</p>
      </ds-card>
    </div>
  `,
};

/** All padding sizes compared */
export const PaddingSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start;">
      <ds-card heading="padding=none" padding="none" style="width: 180px;">
        <p style="margin:0;padding:8px;background:#e2e8f0;">Full-bleed area</p>
      </ds-card>
      <ds-card heading="padding=sm" padding="sm" style="width: 180px;">
        <p>Compact card</p>
      </ds-card>
      <ds-card heading="padding=md" padding="md" style="width: 180px;">
        <p>Default padding</p>
      </ds-card>
      <ds-card heading="padding=lg" padding="lg" style="width: 180px;">
        <p>Spacious card</p>
      </ds-card>
    </div>
  `,
};

/** Clickable card — receives hover lift and emits dsCardClick */
export const Clickable: Story = {
  args: {
    heading: 'Clickable Card',
    subheading: 'Click or press Enter / Space to activate',
    clickable: true,
  },
};

/** Disabled state — no interactions fire */
export const Disabled: Story = {
  args: {
    heading: 'Disabled Card',
    subheading: 'This card cannot be interacted with',
    clickable: true,
    disabled: true,
  },
};

/** Named `header` slot overrides the heading prop */
export const CustomHeader: Story = {
  render: () => html`
    <ds-card style="width: 320px;">
      <div slot="header" style="display:flex;align-items:center;gap:8px;padding:16px 24px;border-bottom:1px solid var(--ds-color-border);">
        <span style="font-size:1.25rem;">⚡</span>
        <strong style="font-size:1rem;">Custom Header Slot</strong>
      </div>
      <p>The <code>header</code> slot replaces the prop-driven heading area entirely,
         giving you full control over header markup.</p>
    </ds-card>
  `,
};

/** Named `footer` slot */
export const WithFooter: Story = {
  render: () => html`
    <ds-card heading="Card with Footer" subheading="Footer is a named slot" style="width: 320px;">
      <p>Main body content. The footer slot sits below the body with an automatic top divider.</p>
      <div slot="footer" style="display:flex;justify-content:flex-end;gap:8px;padding:12px 24px;">
        <ds-button variant="secondary" label="Cancel"></ds-button>
        <ds-button label="Confirm"></ds-button>
      </div>
    </ds-card>
  `,
};

/** Edge cases — long text, empty heading, emoji */
export const EdgeCases: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
      <ds-card heading="A very long heading that might overflow the card header area if unconstrained">
        <p>Long heading test.</p>
      </ds-card>
      <ds-card>
        <p>Card with no heading or subheading — header area is suppressed entirely.</p>
      </ds-card>
      <ds-card heading="🎉 Emoji Heading 🎉" subheading="Unicode and emoji support">
        <p>Special character test.</p>
      </ds-card>
    </div>
  `,
};
