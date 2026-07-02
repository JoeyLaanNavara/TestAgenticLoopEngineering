import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 stat cards', () => {
    expect(component.stats.length).toBe(3);
  });

  it('should render stat cards in the DOM', () => {
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.stat-card');
    expect(cards.length).toBe(3);
  });

  it('should display Users stat', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Total Users');
  });

  it('should display Revenue stat', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Monthly Revenue');
  });

  it('should have 5 activity items', () => {
    expect(component.activities.length).toBe(5);
  });

  it('should render activity list', () => {
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.activity-item');
    expect(items.length).toBe(5);
  });

  it('should show Recent Activity heading', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Recent Activity');
  });
});
