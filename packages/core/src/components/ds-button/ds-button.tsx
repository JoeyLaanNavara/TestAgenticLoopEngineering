import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'ds-button',
  styleUrl: 'ds-button.css',
  shadow: true,
})
export class DsButton {
  /** The button label text */
  @Prop() label: string = 'Button';

  /** The button variant */
  @Prop() variant: 'primary' | 'secondary' | 'danger' = 'primary';

  /** Whether the button is disabled */
  @Prop({ reflect: true }) disabled: boolean = false;

  /** Emitted when the button is clicked */
  @Event() dsClick: EventEmitter<void>;

  private handleClick = () => {
    if (!this.disabled) {
      this.dsClick.emit();
    }
  };

  render() {
    return (
      <button
        class={`btn btn--${this.variant}`}
        disabled={this.disabled}
        onClick={this.handleClick}
      >
        <slot>{this.label}</slot>
      </button>
    );
  }
}
