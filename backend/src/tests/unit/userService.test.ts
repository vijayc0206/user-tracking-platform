import { User } from '../../models/User.js';
import { userService } from '../../services/userService.js';
import { NotFoundError } from '../../middlewares/errorHandler.js';

describe('UserService', () => {
  describe('findOrCreate', () => {
    it('should create a new user if not exists', async () => {
      const visitorId = 'visitor-123';
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await userService.findOrCreate(visitorId, userData);

      expect(user).toBeDefined();
      expect(user.visitorId).toBe(visitorId);
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
    });

    it('should return existing user if already exists', async () => {
      const visitorId = 'visitor-456';

      // Create user first
      await User.create({
        visitorId,
        email: 'existing@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        firstSeen: new Date(),
        lastSeen: new Date(),
      });

      // Try to find or create
      const user = await userService.findOrCreate(visitorId, {
        email: 'new@example.com', // Different email
      });

      expect(user.email).toBe('existing@example.com'); // Should keep original
    });
  });

  describe('findByVisitorId', () => {
    it('should return user when found', async () => {
      const visitorId = 'visitor-789';

      await User.create({
        visitorId,
        email: 'find@example.com',
        firstSeen: new Date(),
        lastSeen: new Date(),
      });

      const user = await userService.findByVisitorId(visitorId);

      expect(user).toBeDefined();
      expect(user?.visitorId).toBe(visitorId);
    });

    it('should return null when user not found', async () => {
      const user = await userService.findByVisitorId('non-existent');

      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const visitorId = 'visitor-update';

      await User.create({
        visitorId,
        email: 'update@example.com',
        firstName: 'Old',
        lastName: 'Name',
        firstSeen: new Date(),
        lastSeen: new Date(),
      });

      const updatedUser = await userService.update(visitorId, {
        firstName: 'New',
        lastName: 'Updated',
      });

      expect(updatedUser.firstName).toBe('New');
      expect(updatedUser.lastName).toBe('Updated');
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(
        userService.update('non-existent', { firstName: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Create test users
      await User.create([
        {
          visitorId: 'search-1',
          email: 'search1@example.com',
          firstName: 'Alice',
          lastName: 'Smith',
          totalEvents: 100,
          tags: ['premium', 'active'],
          segments: ['high-value'],
          firstSeen: new Date(),
          lastSeen: new Date(),
        },
        {
          visitorId: 'search-2',
          email: 'search2@example.com',
          firstName: 'Bob',
          lastName: 'Johnson',
          totalEvents: 50,
          tags: ['basic'],
          segments: ['new-user'],
          firstSeen: new Date(),
          lastSeen: new Date(),
        },
        {
          visitorId: 'search-3',
          email: 'search3@example.com',
          firstName: 'Charlie',
          lastName: 'Brown',
          totalEvents: 200,
          tags: ['premium'],
          segments: ['high-value'],
          firstSeen: new Date(),
          lastSeen: new Date(),
        },
      ]);
    });

    it('should return paginated results', async () => {
      const result = await userService.search({ page: 1, limit: 2 });

      expect(result.users.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.pages).toBe(2);
    });

    it('should filter by search term', async () => {
      const result = await userService.search({ search: 'Alice' });

      expect(result.users.length).toBe(1);
      expect(result.users[0].firstName).toBe('Alice');
    });

    it('should filter by tags', async () => {
      const result = await userService.search({ tags: ['premium'] });

      expect(result.users.length).toBe(2);
    });

    it('should filter by segments', async () => {
      const result = await userService.search({ segments: ['high-value'] });

      expect(result.users.length).toBe(2);
    });

    it('should filter by event count range', async () => {
      const result = await userService.search({
        minEvents: 75,
        maxEvents: 150,
      });

      expect(result.users.length).toBe(1);
      expect(result.users[0].totalEvents).toBe(100);
    });
  });

  describe('addTags', () => {
    it('should add tags to user', async () => {
      const visitorId = 'visitor-tags';

      await User.create({
        visitorId,
        tags: ['existing'],
        firstSeen: new Date(),
        lastSeen: new Date(),
      });

      const user = await userService.addTags(visitorId, ['new-tag', 'another-tag']);

      expect(user.tags).toContain('existing');
      expect(user.tags).toContain('new-tag');
      expect(user.tags).toContain('another-tag');
    });

    it('should not duplicate tags', async () => {
      const visitorId = 'visitor-tags-dup';

      await User.create({
        visitorId,
        tags: ['existing'],
        firstSeen: new Date(),
        lastSeen: new Date(),
      });

      const user = await userService.addTags(visitorId, ['existing', 'new']);

      const existingCount = user.tags.filter((t) => t === 'existing').length;
      expect(existingCount).toBe(1);
    });
  });

  describe('removeTags', () => {
    it('should remove tags from user', async () => {
      const visitorId = 'visitor-remove-tags';

      await User.create({
        visitorId,
        tags: ['tag1', 'tag2', 'tag3'],
        firstSeen: new Date(),
        lastSeen: new Date(),
      });

      const user = await userService.removeTags(visitorId, ['tag1', 'tag3']);

      expect(user.tags).toContain('tag2');
      expect(user.tags).not.toContain('tag1');
      expect(user.tags).not.toContain('tag3');
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      await User.create([
        {
          visitorId: 'stats-1',
          totalEvents: 100,
          totalSessions: 10,
          firstSeen: new Date(),
          lastSeen: new Date(),
        },
        {
          visitorId: 'stats-2',
          totalEvents: 200,
          totalSessions: 20,
          firstSeen: new Date(),
          lastSeen: new Date(),
        },
      ]);

      const stats = await userService.getStats();

      expect(stats.totalUsers).toBe(2);
      expect(stats.avgEventsPerUser).toBe(150);
      expect(stats.avgSessionsPerUser).toBe(15);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const visitorId = 'visitor-delete';

      await User.create({
        visitorId,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });

      await userService.delete(visitorId);

      const user = await User.findOne({ visitorId });
      expect(user).toBeNull();
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(userService.delete('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
