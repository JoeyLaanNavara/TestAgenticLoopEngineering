import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [SettingsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.form.get('name')?.value).toBe('Alice Johnson');
    expect(component.form.get('email')?.value).toBe('alice@example.com');
    expect(component.form.get('notifications')?.value).toBeTrue();
  });

  it('form should be valid with default values', () => {
    expect(component.form.valid).toBeTrue();
  });

  it('should invalidate form when name is empty', () => {
    component.form.get('name')?.setValue('');
    expect(component.form.invalid).toBeTrue();
  });

  it('should invalidate form when email is invalid', () => {
    component.form.get('email')?.setValue('not-an-email');
    expect(component.form.invalid).toBeTrue();
  });

  it('should set saved to true on valid submit', () => {
    component.save();
    expect(component.saved).toBeTrue();
  });

  it('should not save when form is invalid', () => {
    component.form.get('name')?.setValue('');
    component.save();
    expect(component.saved).toBeFalse();
  });

  it('should render Save Changes button', () => {
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(btn?.textContent).toContain('Save Changes');
  });
});
