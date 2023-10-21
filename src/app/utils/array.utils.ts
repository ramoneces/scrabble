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

export function maxMap<TItem>(
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

export function sumMap<TItem>(
  items: TItem[],
  selector: (item: TItem) => number
): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}
