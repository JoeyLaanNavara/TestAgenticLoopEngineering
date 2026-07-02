// Global test setup for Vue integration tests.
//
// happy-dom does not register the real Stencil custom element. Vue's renderer
// only assigns a value as a DOM *property* when `key in el` is true; for an
// unregistered element it falls back to setting an attribute, which would leave
// `el.label` / `el.variant` / `el.disabled` undefined. Registering a lightweight
// stub element that exposes those props as real prototype accessors lets the
// wrapper's property-forwarding be asserted here, mirroring the real-browser
// behaviour that the Stencil e2e suite verifies. This mirrors how the React
// wrapper (which sets properties via a ref) is exercised in react-test.
class DsButtonTestStub extends HTMLElement {
  #label?: string;
  #variant?: string;
  #disabled?: boolean;

  get label(): string | undefined {
    return this.#label;
  }
  set label(value: string | undefined) {
    this.#label = value;
  }

  get variant(): string | undefined {
    return this.#variant;
  }
  set variant(value: string | undefined) {
    this.#variant = value;
  }

  get disabled(): boolean | undefined {
    return this.#disabled;
  }
  set disabled(value: boolean | undefined) {
    this.#disabled = value;
  }
}

if (!customElements.get('ds-button')) {
  customElements.define('ds-button', DsButtonTestStub);
}
