export function mapMany<TSourceItem, TResultItem>(
  source: TSourceItem[],
  selector: (item: TSourceItem) => TResultItem[]
): TResultItem[] {
  return source.reduce(
    (acc, item) => acc.concat(selector(item)),
    [] as TResultItem[]
  );
}

export function range(count: number): number[] {
  return Array(count)
    .fill(0)
    .map((_, i) => i);
}

export function maxBy<TItem>(
  items: TItem[],
  selector: (item: TItem) => number
): TItem | undefined {
  return items.reduce((max, item) => {
    const value = selector(item);
    if (value > selector(max)) {
      return item;
    }
    return max;
  }, items[0]);
}

export function sumBy<TItem>(
  items: TItem[],
  selector: (item: TItem) => number
): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}

export function orderBy<TItem>(
  items: TItem[],
  selector: (item: TItem) => number
): TItem[] {
  return items.sort((a, b) => selector(a) - selector(b));
}

export function groupBy<TItem, TKey extends string | number>(
  items: TItem[],
  keySelector: (item: TItem) => TKey
): { [key in TKey]: TItem[] } {
  const groups: { [key in TKey]: TItem[] } = {} as any;
  items.forEach((item) => {
    const key = keySelector(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  return groups;
}
