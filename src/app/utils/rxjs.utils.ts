import { Observable } from 'rxjs';

/**
 * Returns an operator function that takes an Observable as input and returns a new Observable.
 * The new Observable will emit values from the input Observable until `n` consecutive duplicates
 * are emitted, as determined by the `mapFn` function.
 *
 * @param n - The number of consecutive duplicates to wait for before completing the output Observable.
 * @param mapFn - A function that maps input values to output values for comparison.
 * @returns An operator function that can be used with the `pipe` method of an Observable.
 */
export function takeUntilConsecutiveDuplicates<TInput, TOutput>(
  n: number,
  mapFn: (value: TInput) => TOutput
) {
  let count = 0;
  let lastOutputValue: TOutput;

  return (source: Observable<TInput>) =>
    new Observable<TInput>((observer) => {
      return source.subscribe({
        next(inputValue) {
          const outputValue = mapFn(inputValue);
          if (outputValue === lastOutputValue) {
            count++;
            if (count === n) {
              observer.complete();
            }
          } else {
            count = 1;
            lastOutputValue = outputValue;
          }
          observer.next(inputValue);
        },
        error(err) {
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });
    });
}
