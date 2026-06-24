import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

interface DsButtonArgs {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  disabled: boolean;
}

const meta: Meta<DsButtonArgs> = {
  title: 'Design System/DsButton',
  tags: ['autodocs'],
  render: (args) => html`
    <ds-button
      label=${args.label}
      variant=${args.variant}
      ?disabled=${args.disabled}
    ></ds-button>
  `,
  argTypes: {
    label: {
      control: 'text',
      description: 'The button label text',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'The button variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
  },
  args: {
    label: 'Button',
    variant: 'primary',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<DsButtonArgs>;

export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Danger: Story = {
  args: {
    label: 'Danger Button',
    variant: 'danger',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    disabled: true,
  },
};
