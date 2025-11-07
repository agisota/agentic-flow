/**
 * Tests for HTTP/2 Multiplexing
 */

import {
  HTTP2MultiplexingManager,
  FlowControlManager,
  PriorityScheduler
} from '../../src/utils/http2-multiplexing';

describe('HTTP2MultiplexingManager', () => {
  let manager: HTTP2MultiplexingManager;

  beforeEach(() => {
    manager = new HTTP2MultiplexingManager({
      enabled: true,
      maxConcurrentStreams: 100,
      defaultPriority: 16
    });
  });

  test('should initialize with config', () => {
    expect(manager).toBeDefined();
    const stats = manager.getStats();
    expect(stats.totalStreams).toBe(0);
    expect(stats.activeStreams).toBe(0);
  });

  test('should check if can accept streams', () => {
    expect(manager.canAcceptStream()).toBe(true);
  });

  test('should calculate load percentage', () => {
    const load = manager.getLoad();
    expect(load).toBeGreaterThanOrEqual(0);
    expect(load).toBeLessThanOrEqual(100);
  });

  test('should get statistics', () => {
    const stats = manager.getStats();

    expect(stats).toHaveProperty('totalStreams');
    expect(stats).toHaveProperty('activeStreams');
    expect(stats).toHaveProperty('completedStreams');
    expect(stats).toHaveProperty('averageDuration');
    expect(stats).toHaveProperty('priorityDistribution');
  });

  test('should track priority distribution', () => {
    const stats = manager.getStats();
    expect(stats.priorityDistribution).toBeInstanceOf(Map);
  });
});

describe('FlowControlManager', () => {
  let flowControl: FlowControlManager;

  beforeEach(() => {
    flowControl = new FlowControlManager({
      initialWindowSize: 65535,
      maxWindowSize: 16777215,
      minWindowSize: 16384
    });
  });

  test('should initialize window size', () => {
    flowControl.initializeWindow(1);
    const size = flowControl.getWindowSize(1);
    expect(size).toBe(65535);
  });

  test('should update window size', () => {
    flowControl.initializeWindow(1);
    const newSize = flowControl.updateWindow(1, 10000);

    expect(newSize).toBe(75535);
  });

  test('should respect min window size', () => {
    flowControl.initializeWindow(1);
    const newSize = flowControl.updateWindow(1, -100000);

    expect(newSize).toBeGreaterThanOrEqual(16384);
  });

  test('should respect max window size', () => {
    flowControl.initializeWindow(1);
    const newSize = flowControl.updateWindow(1, 20000000);

    expect(newSize).toBeLessThanOrEqual(16777215);
  });

  test('should calculate optimal window size', () => {
    const throughput = 10000000; // 10 Mbps
    const rtt = 100; // 100ms

    const optimal = flowControl.calculateOptimalWindow(throughput, rtt);
    expect(optimal).toBeGreaterThan(0);
  });

  test('should cleanup closed streams', () => {
    flowControl.initializeWindow(1);
    flowControl.cleanup(1);

    // After cleanup, should return default size
    const size = flowControl.getWindowSize(1);
    expect(size).toBe(65535);
  });
});

describe('PriorityScheduler', () => {
  let scheduler: PriorityScheduler;

  beforeEach(() => {
    scheduler = new PriorityScheduler();
  });

  test('should enqueue streams with priority', () => {
    scheduler.enqueue(1, 10);
    scheduler.enqueue(2, 20);

    const stats = scheduler.getStats();
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should dequeue highest priority first', () => {
    scheduler.enqueue(1, 10);
    scheduler.enqueue(2, 20);
    scheduler.enqueue(3, 15);

    const first = scheduler.dequeue();
    expect(first).toBe(2); // Priority 20 is highest
  });

  test('should handle empty queues', () => {
    const result = scheduler.dequeue();
    expect(result).toBeNull();
  });

  test('should remove streams', () => {
    scheduler.enqueue(1, 10);
    scheduler.enqueue(2, 10);
    scheduler.remove(1);

    const next = scheduler.dequeue();
    expect(next).toBe(2);
  });

  test('should get queue statistics', () => {
    scheduler.enqueue(1, 10);
    scheduler.enqueue(2, 20);

    const stats = scheduler.getStats();
    expect(stats.size).toBe(2);
  });

  test('should maintain FIFO within same priority', () => {
    scheduler.enqueue(1, 10);
    scheduler.enqueue(2, 10);
    scheduler.enqueue(3, 10);

    expect(scheduler.dequeue()).toBe(1);
    expect(scheduler.dequeue()).toBe(2);
    expect(scheduler.dequeue()).toBe(3);
  });
});
