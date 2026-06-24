import { Component, Prop, Event, EventEmitter, Host, h } from '@stencil/core';

@Component({
  tag: 'ds-card',
  styleUrl: 'ds-card.css',
  shadow: true,
})
export class DsCard {
  // ─── Props ────────────────────────────────────────────────────

  /** The card heading text. Use the named `header` slot for richer markup. */
  @Prop() heading: string = '';

  /** Secondary text displayed below the heading */
  @Prop() subheading: string = '';

  /** Visual variant controlling border and shadow treatment */
  @Prop() variant: 'default' | 'outlined' | 'elevated' = 'default';

  /**
   * When true the card receives hover/focus styles and emits `dsCardClick`.
   * Sets `role="button"` and `tabindex="0"` automatically.
   */
  @Prop({ reflect: true }) clickable: boolean = false;

  /** Disables the card — suppresses interaction and dims the surface */
  @Prop({ reflect: true }) disabled: boolean = false;

  /** Controls internal padding. Use `none` when the card contains full-bleed media. */
  @Prop() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';

  // ─── Events ───────────────────────────────────────────────────

  /** Emitted when a clickable card is activated (click or Enter/Space keypress) */
  @Event() dsCardClick: EventEmitter<void>;

  // ─── Private helpers ──────────────────────────────────────────

  private handleClick = () => {
    if (this.clickable && !this.disabled) {
      this.dsCardClick.emit();
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.clickable && !this.disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.dsCardClick.emit();
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  render() {
    const hasHeader = this.heading || this.subheading;

    return (
      <Host
        class={{
          'ds-card': true,
          [`ds-card--${this.variant}`]: true,
          [`ds-card--pad-${this.padding}`]: true,
          'ds-card--clickable': this.clickable,
          'ds-card--disabled': this.disabled,
        }}
        role={this.clickable ? 'button' : undefined}
        tabindex={this.clickable && !this.disabled ? '0' : undefined}
        aria-disabled={this.disabled ? 'true' : undefined}
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
      >
        {/* Named media slot — sits above header, full-bleed */}
        <slot name="media" />

        {/* Header area: named slot takes priority over heading prop */}
        <slot name="header">
          {hasHeader && (
            <div class="card__header">
              {this.heading && <h3 class="card__heading">{this.heading}</h3>}
              {this.subheading && <p class="card__subheading">{this.subheading}</p>}
            </div>
          )}
        </slot>

        {/* Body content */}
        <div class="card__body">
          <slot />
        </div>

        {/* Named footer slot */}
        <slot name="footer" />
      </Host>
    );
  }
}
