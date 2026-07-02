import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [NavbarComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render Dashboard title', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.sidebar-logo')?.textContent).toContain('Dashboard');
  });

  it('should have 3 nav links', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a');
    expect(links.length).toBe(3);
  });

  it('should link to /dashboard', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a');
    const hrefs = Array.from(links).map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/dashboard');
  });

  it('should link to /users', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a');
    const hrefs = Array.from(links).map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/users');
  });

  it('should link to /settings', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a');
    const hrefs = Array.from(links).map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/settings');
  });
});
