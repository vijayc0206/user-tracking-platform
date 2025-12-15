import { AdminUser } from '../../models/AdminUser.js';
import { authService } from '../../services/authService.js';
import { UserRole } from '../../types/index.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../middlewares/errorHandler.js';

describe('AuthService', () => {
  describe('register', () => {
    it('should create a new admin user', async () => {
      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'securePassword123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.firstName).toBe('John');
      expect(result.user.lastName).toBe('Doe');
      expect(result.user.role).toBe(UserRole.ANALYST);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should hash the password', async () => {
      await authService.register({
        email: 'hash@example.com',
        password: 'plainPassword',
        firstName: 'Test',
        lastName: 'User',
      });

      const user = await AdminUser.findOne({ email: 'hash@example.com' }).select(
        '+password'
      );

      expect(user?.password).not.toBe('plainPassword');
      expect(user?.password.startsWith('$2')).toBe(true); // bcrypt hash
    });

    it('should throw ConflictError if email already exists', async () => {
      await authService.register({
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'First',
        lastName: 'User',
      });

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          password: 'differentPassword',
          firstName: 'Second',
          lastName: 'User',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should allow setting custom role', async () => {
      const result = await authService.register({
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      });

      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'login@example.com',
        password: 'correctPassword',
        firstName: 'Login',
        lastName: 'User',
      });
    });

    it('should return tokens on successful login', async () => {
      const result = await authService.login({
        email: 'login@example.com',
        password: 'correctPassword',
      });

      expect(result.user.email).toBe('login@example.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedError on wrong password', async () => {
      await expect(
        authService.login({
          email: 'login@example.com',
          password: 'wrongPassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError on non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'anyPassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if user is deactivated', async () => {
      // Deactivate user
      await AdminUser.updateOne(
        { email: 'login@example.com' },
        { isActive: false }
      );

      await expect(
        authService.login({
          email: 'login@example.com',
          password: 'correctPassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should update lastLogin on successful login', async () => {
      const beforeLogin = new Date();

      await authService.login({
        email: 'login@example.com',
        password: 'correctPassword',
      });

      const user = await AdminUser.findOne({ email: 'login@example.com' });

      expect(user?.lastLogin).toBeDefined();
      expect(user?.lastLogin?.getTime()).toBeGreaterThanOrEqual(
        beforeLogin.getTime()
      );
    });
  });

  describe('refreshToken', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'refresh@example.com',
        password: 'password123',
        firstName: 'Refresh',
        lastName: 'User',
      });
      refreshToken = result.tokens.refreshToken;
    });

    it('should return new tokens with valid refresh token', async () => {
      const newTokens = await authService.refreshToken(refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedError with invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('getProfile', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'profile@example.com',
        password: 'password123',
        firstName: 'Profile',
        lastName: 'User',
      });
      userId = result.user.id;
    });

    it('should return user profile', async () => {
      const profile = await authService.getProfile(userId);

      expect(profile.email).toBe('profile@example.com');
      expect(profile.firstName).toBe('Profile');
      expect(profile.lastName).toBe('User');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(
        authService.getProfile('000000000000000000000000')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProfile', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'update@example.com',
        password: 'password123',
        firstName: 'Update',
        lastName: 'User',
      });
      userId = result.user.id;
    });

    it('should update user profile', async () => {
      const updated = await authService.updateProfile(userId, {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('Name');
    });

    it('should throw ConflictError if email is already in use', async () => {
      // Create another user
      await authService.register({
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      });

      await expect(
        authService.updateProfile(userId, { email: 'existing@example.com' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('changePassword', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'password@example.com',
        password: 'oldPassword123',
        firstName: 'Password',
        lastName: 'User',
      });
      userId = result.user.id;
    });

    it('should change password successfully', async () => {
      await authService.changePassword(userId, 'oldPassword123', 'newPassword456');

      // Try to login with new password
      const result = await authService.login({
        email: 'password@example.com',
        password: 'newPassword456',
      });

      expect(result.user.email).toBe('password@example.com');
    });

    it('should throw UnauthorizedError with wrong current password', async () => {
      await expect(
        authService.changePassword(userId, 'wrongPassword', 'newPassword456')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('deactivateUser / activateUser', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'active@example.com',
        password: 'password123',
        firstName: 'Active',
        lastName: 'User',
      });
      userId = result.user.id;
    });

    it('should deactivate user', async () => {
      await authService.deactivateUser(userId);

      const user = await AdminUser.findById(userId);
      expect(user?.isActive).toBe(false);
    });

    it('should activate user', async () => {
      await authService.deactivateUser(userId);
      await authService.activateUser(userId);

      const user = await AdminUser.findById(userId);
      expect(user?.isActive).toBe(true);
    });
  });

  describe('updateRole', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'role@example.com',
        password: 'password123',
        firstName: 'Role',
        lastName: 'User',
      });
      userId = result.user.id;
    });

    it('should update user role', async () => {
      const updated = await authService.updateRole(userId, UserRole.ADMIN);

      expect(updated.role).toBe(UserRole.ADMIN);
    });
  });
});
