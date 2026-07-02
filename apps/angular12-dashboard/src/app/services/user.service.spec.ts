import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return 7 users', () => {
    expect(service.getUsers().length).toBe(7);
  });

  it('should return users with required fields', () => {
    const users = service.getUsers();
    users.forEach(u => {
      expect(u.id).toBeDefined();
      expect(u.name).toBeDefined();
      expect(u.email).toBeDefined();
      expect(u.role).toBeDefined();
    });
  });

  it('should get user by id', () => {
    const user = service.getUserById(1);
    expect(user).toBeDefined();
    expect(user?.name).toBe('Alice Johnson');
  });

  it('should return undefined for unknown id', () => {
    expect(service.getUserById(999)).toBeUndefined();
  });
});
