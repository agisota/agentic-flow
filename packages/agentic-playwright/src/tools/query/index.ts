/**
 * Query tools for element finding and inspection
 * @module tools/query
 */

// findElement exports
export {
  findElement,
  elementExists,
  getElementText,
  getElementAttribute,
  type FindElementInput,
  type FindElementOutput,
  type FindElementResult,
  type FindElementOptions,
  FindElementInputSchema,
  FindElementOutputSchema,
} from './findElement.js';

// findElements exports
export {
  findElements,
  getAllElementTexts,
  filterElementsByVisibility,
  getFirstElements,
  type FindElementsInput,
  type FindElementsOutput,
  type FindElementsResult,
  type FindElementsOptions,
  type ElementInfo,
  FindElementsInputSchema,
  FindElementsOutputSchema,
  ElementInfoSchema,
} from './findElements.js';

// waitForSelector exports
export {
  waitForSelector,
  waitForVisible,
  waitForHidden,
  waitForAttached,
  waitForDetached,
  waitForSelectorWithRetry,
  type WaitForSelectorInput,
  type WaitForSelectorOutput,
  type WaitForSelectorResult,
  type WaitForSelectorOptions,
  type ElementState,
  WaitForSelectorInputSchema,
  WaitForSelectorOutputSchema,
} from './waitForSelector.js';

// isVisible exports
export {
  isVisible,
  waitUntilVisible,
  waitUntilHidden,
  findFirstVisible,
  areAllVisible,
  getVisibilityMap,
  type IsVisibleInput,
  type IsVisibleOutput,
  type IsVisibleResult,
  type IsVisibleOptions,
  IsVisibleInputSchema,
  IsVisibleOutputSchema,
} from './isVisible.js';

// isEnabled exports
export {
  isEnabled,
  waitUntilEnabled,
  waitUntilDisabled,
  isDisabled,
  hasDisabledAttribute,
  getEnabledMap,
  isEditable,
  type IsEnabledInput,
  type IsEnabledOutput,
  type IsEnabledResult,
  type IsEnabledOptions,
  IsEnabledInputSchema,
  IsEnabledOutputSchema,
} from './isEnabled.js';

// countElements exports
export {
  countElements,
  count,
  countVisible,
  hasCount,
  waitForCount,
  waitForMinCount,
  getCountMap,
  isUnique,
  type CountElementsInput,
  type CountElementsOutput,
  type CountElementsResult,
  type CountElementsOptions,
  CountElementsInputSchema,
  CountElementsOutputSchema,
} from './countElements.js';
