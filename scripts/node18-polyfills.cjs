function defineArrayMethod(name, implementation) {
  if (!Object.prototype.hasOwnProperty.call(Array.prototype, name)) {
    Object.defineProperty(Array.prototype, name, {
      value: implementation,
      configurable: true,
      writable: true,
    });
  }
}

defineArrayMethod('toReversed', function toReversed() {
  return [...this].reverse();
});

defineArrayMethod('toSorted', function toSorted(compareFn) {
  return [...this].sort(compareFn);
});

defineArrayMethod('toSpliced', function toSpliced(start, deleteCount, ...items) {
  const copy = [...this];
  copy.splice(start, deleteCount, ...items);
  return copy;
});

defineArrayMethod('with', function withIndex(index, value) {
  const copy = [...this];
  const normalizedIndex = index < 0 ? this.length + index : index;

  if (normalizedIndex < 0 || normalizedIndex >= this.length) {
    throw new RangeError('Invalid index');
  }

  copy[normalizedIndex] = value;
  return copy;
});
