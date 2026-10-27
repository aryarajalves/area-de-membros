import { describe, it, expect, vi, beforeEach } from 'vitest';
import { preloadCourseImages } from './imagePreloader';

describe('imagePreloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles empty or non-array inputs gracefully without errors', () => {
    expect(() => preloadCourseImages()).not.toThrow();
    expect(() => preloadCourseImages(null)).not.toThrow();
    expect(() => preloadCourseImages([])).not.toThrow();
    expect(() => preloadCourseImages('not-an-array')).not.toThrow();
  });

  it('preloads thumbnail_url and cover_image_url for courses', () => {
    const originalImage = global.Image;
    const instances = [];
    global.Image = class {
      constructor() {
        instances.push(this);
      }
    };

    const mockCourses = [
      { id: 1, thumbnail_url: 'https://b2.com/thumb1.webp', cover_image_url: 'https://b2.com/cover1.webp' },
      { id: 2, thumbnail_url: 'https://b2.com/thumb2.webp' }
    ];

    preloadCourseImages(mockCourses);

    expect(instances.length).toBe(3);
    expect(instances[0].src).toBe('https://b2.com/thumb1.webp');
    expect(instances[1].src).toBe('https://b2.com/cover1.webp');
    expect(instances[2].src).toBe('https://b2.com/thumb2.webp');

    global.Image = originalImage;
  });

  it('preloads images from nested bundled_courses', () => {
    const originalImage = global.Image;
    const instances = [];
    global.Image = class {
      constructor() {
        instances.push(this);
      }
    };

    const mockCourses = [
      {
        id: 1,
        thumbnail_url: 'https://b2.com/bundle.webp',
        bundled_courses: [
          { id: 10, thumbnail_url: 'https://b2.com/item1.webp' },
          { id: 11, cover_image_url: 'https://b2.com/item2.webp' }
        ]
      }
    ];

    preloadCourseImages(mockCourses);

    expect(instances.length).toBe(3);
    expect(instances[0].src).toBe('https://b2.com/bundle.webp');
    expect(instances[1].src).toBe('https://b2.com/item1.webp');
    expect(instances[2].src).toBe('https://b2.com/item2.webp');

    global.Image = originalImage;
  });
});
