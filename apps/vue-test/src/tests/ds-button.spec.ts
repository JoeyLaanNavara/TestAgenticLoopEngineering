import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { DsButton } from '@my-org/vue';

// The Vue wrapper created by defineContainer() renders h('ds-button', props, slots).
// In a happy-dom/jsdom environment the custom element is an unknown HTMLElement.
// We test the binding layer, not Stencil component behaviour.
//
// Event note: Vue converts onXxx attrs to event listeners via hyphenate(), so
// @dsClick in a template maps to the DOM event 'ds-click' (kebab-cased).
// The ds-button Stencil component fires 'dsClick' (camelCase). For DOM-level
// event tests below we dispatch events directly to the element.

const globalConfig = {
  config: {
    compilerOptions: {
      // Silence Vue warnings about unknown elements in test host templates.
      isCustomElement: (tag: string) => tag.startsWith('ds-'),
    },
  },
};

describe('DsButton — Vue wrapper', () => {
  // ── Rendering ──────────────────────────────────────────────────────
  it('renders the ds-button custom element', () => {
    const wrapper = mount(DsButton, {
      props: { label: 'Test' },
      global: globalConfig,
    });
    expect(wrapper.find('ds-button').exists()).toBe(true);
  });

  // ── Prop forwarding ────────────────────────────────────────────────
  // defineContainer() passes declared component props through h() to the DOM.
  // Vue sets custom element properties (not attributes) for object/non-string values.

  it('forwards label prop to the element', async () => {
    const wrapper = mount(DsButton, {
      props: { label: 'Hello World' },
      global: globalConfig,
    });
    await wrapper.vm.$nextTick();
    const el = wrapper.find('ds-button').element as any;
    expect(el.label).toBe('Hello World');
  });

  it('forwards variant="secondary" to the element', async () => {
    const wrapper = mount(DsButton, {
      props: { variant: 'secondary' },
      global: globalConfig,
    });
    await wrapper.vm.$nextTick();
    const el = wrapper.find('ds-button').element as any;
    expect(el.variant).toBe('secondary');
  });

  it('forwards variant="danger" to the element', async () => {
    const wrapper = mount(DsButton, {
      props: { variant: 'danger' },
      global: globalConfig,
    });
    await wrapper.vm.$nextTick();
    const el = wrapper.find('ds-button').element as any;
    expect(el.variant).toBe('danger');
  });

  it('forwards disabled=true to the element', async () => {
    const wrapper = mount(DsButton, {
      props: { disabled: true },
      global: globalConfig,
    });
    await wrapper.vm.$nextTick();
    const el = wrapper.find('ds-button').element as any;
    expect(el.disabled).toBe(true);
  });

  it('forwards disabled=false to the element', async () => {
    const wrapper = mount(DsButton, {
      props: { disabled: false },
      global: globalConfig,
    });
    await wrapper.vm.$nextTick();
    const el = wrapper.find('ds-button').element as any;
    expect(el.disabled).toBeFalsy();
  });

  // ── Prop updates ───────────────────────────────────────────────────
  it('updates element property when label prop changes', async () => {
    const wrapper = mount(DsButton, {
      props: { label: 'Before' },
      global: globalConfig,
    });
    await wrapper.setProps({ label: 'After' });
    const el = wrapper.find('ds-button').element as any;
    expect(el.label).toBe('After');
  });

  // ── Slot / children ────────────────────────────────────────────────
  it('renders default slot content', () => {
    const wrapper = mount(DsButton, {
      slots: { default: 'Button label' },
      global: globalConfig,
    });
    expect(wrapper.find('ds-button').text()).toBe('Button label');
  });

  // ── Events (DOM-level) ────────────────────────────────────────────
  // Use a host component to test event propagation through the Vue wrapper.
  // The wrapper renders h('ds-button'), so DOM events bubble normally.
  it('allows a parent to listen to DOM dsClick events', async () => {
    const handler = vi.fn();

    const Host = defineComponent({
      components: { DsButton },
      template: `<DsButton ref="btn" />`,
      mounted() {
        (this.$refs.btn as any).$el.addEventListener('dsClick', handler);
      },
    });

    const wrapper = mount(Host, { global: globalConfig });
    await wrapper.vm.$nextTick();

    const el = wrapper.find('ds-button').element as HTMLElement;
    el.dispatchEvent(new CustomEvent('dsClick', { bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
