import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersComponent } from './users.component';
import { UserService } from '../../services/user.service';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let userService: UserService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UsersComponent],
      providers: [UserService],
    }).compileComponents();
    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users from service on init', () => {
    expect(component.users.length).toBe(userService.getUsers().length);
  });

  it('should render a row per user', () => {
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('.user-row');
    expect(rows.length).toBe(component.users.length);
  });

  it('should display table headers', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Name');
    expect(text).toContain('Email');
    expect(text).toContain('Role');
  });

  it('should display first user name', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Alice Johnson');
  });
});
