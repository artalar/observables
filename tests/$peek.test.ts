import { $computed, $observable, $peek, $effect, $tick, $dispose, onDispose } from '../src';

afterEach(() => $tick());

it('should not create dependency', async () => {
  const effect = vi.fn();
  const computeC = vi.fn();

  const $a = $observable(10);
  const $b = $computed(() => $a() + 10);
  const $c = $computed(() => {
    computeC();
    return $peek($b) + 10;
  });

  $effect(() => {
    effect();
    expect($peek($a)).toBe(10);
    expect($peek($b)).toBe(20);
    expect($peek($c)).toBe(30);
  });

  expect(effect).toHaveBeenCalledTimes(1);
  expect(computeC).toHaveBeenCalledTimes(1);

  $a.set(20);
  await $tick();
  expect(effect).toHaveBeenCalledTimes(1);
  expect(computeC).toHaveBeenCalledTimes(1);
});

it('should not affect deep dependency being created', async () => {
  const effect = vi.fn();
  const computeD = vi.fn();

  const $a = $observable(10);
  const $b = $observable(10);
  const $c = $observable(10);
  const $d = $computed(() => {
    computeD();
    return $a() + $peek($b) + $peek($c) + 10;
  });

  $effect(() => {
    effect();
    expect($peek($a)).toBe(10);
    expect($peek($d)).toBe(40);
  });

  expect(effect).toHaveBeenCalledTimes(1);
  expect(computeD).toHaveBeenCalledTimes(1);
  expect($d()).toBe(40);

  $a.set(20);
  await $tick();
  expect(effect).toHaveBeenCalledTimes(1);
  expect(computeD).toHaveBeenCalledTimes(2);
  expect($d()).toBe(50);

  $b.set(20);
  await $tick();
  expect(effect).toHaveBeenCalledTimes(1);
  expect(computeD).toHaveBeenCalledTimes(2);
  expect($d()).toBe(50);

  $c.set(20);
  await $tick();
  expect(effect).toHaveBeenCalledTimes(1);
  expect(computeD).toHaveBeenCalledTimes(2);
  expect($d()).toBe(50);
});

it('should not trigger deep `onDispose`', async () => {
  const dispose = vi.fn();
  const computeB = vi.fn();

  const $b = $computed(() => {
    computeB();
    onDispose(dispose);
    return 10;
  });

  const stop = $effect(() => {
    $peek(() => $b());
  });

  stop();
  await $tick();

  expect(computeB).to.toHaveBeenCalledTimes(1);
  expect(dispose).to.toHaveBeenCalledTimes(0);

  $dispose($b);
  expect(dispose).to.toHaveBeenCalledTimes(1);
});
