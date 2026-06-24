import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DsButton } from '@my-org/angular';

// Minimal host component — drives the wrapper via Angular template bindings.
@Component({
  template: `
    <ds-button
      [label]="label"
      [variant]="variant"
      [disabled]="disabled"
    ></ds-button>
  `,
})
class TestHostComponent {
  label = 'Test';
  variant: 'primary' | 'secondary' | 'danger' = 'primary';
  disabled = false;
}

describe('DsButton — Angular wrapper', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent, DsButton],
      // CUSTOM_ELEMENTS_SCHEMA suppresses Angular warnings about the ds-button host element.
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  // ── Rendering ────────────────────────────────────────────────────────
  it('renders the ds-button custom element', () => {
    expect(fixture.nativeElement.querySelector('ds-button')).toBeTruthy();
  });

  it('the Angular wrapper component instance is created', () => {
    const debugEl = fixture.debugElement.query(By.directive(DsButton));
    expect(debugEl).toBeTruthy();
    expect(debugEl.componentInstance).toBeInstanceOf(DsButton);
  });

  // ── Prop forwarding ──────────────────────────────────────────────────
  // The Angular proxy uses proxyInputs() to create setters that push values
  // directly onto the underlying HTMLElement property (this.el[propName] = val).
  // In jsdom, ds-button is an unknown HTMLElement, so props land as JS properties.

  it('forwards [label] to the element property', () => {
    fixture.componentInstance.label = 'Click Me';
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('ds-button') as any;
    expect(el.label).toBe('Click Me');
  });

  it('forwards [variant] to the element property', () => {
    fixture.componentInstance.variant = 'secondary';
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('ds-button') as any;
    expect(el.variant).toBe('secondary');
  });

  it('forwards [variant]="danger" to the element property', () => {
    fixture.componentInstance.variant = 'danger';
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('ds-button') as any;
    expect(el.variant).toBe('danger');
  });

  it('forwards [disabled]=true to the element property', () => {
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('ds-button') as any;
    expect(el.disabled).toBe(true);
  });

  it('forwards [disabled]=false to the element property', () => {
    fixture.componentInstance.disabled = false;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('ds-button') as any;
    expect(el.disabled).toBe(false);
  });

  // ── Event surface ────────────────────────────────────────────────────
  // The Angular proxy exposes dsClick as an RxJS Observable (via proxyOutputs).
  // DOM events fired on the element are surfaced through that observable.

  it('dsClick Observable emits when the dsClick DOM event fires', (done) => {
    const debugEl = fixture.debugElement.query(By.directive(DsButton));
    const compInstance = debugEl.componentInstance as DsButton & { dsClick: any };
    const el = fixture.nativeElement.querySelector('ds-button') as HTMLElement;

    compInstance.dsClick.subscribe(() => done());

    el.dispatchEvent(new CustomEvent('dsClick', { bubbles: true }));
  });

  it('direct DOM listener receives dsClick events', () => {
    const handler = jest.fn();
    const el = fixture.nativeElement.querySelector('ds-button') as HTMLElement;

    el.addEventListener('dsClick', handler);
    el.dispatchEvent(new CustomEvent('dsClick'));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
