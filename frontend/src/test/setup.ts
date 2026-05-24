import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// RTL's automatic cleanup only registers when globals are enabled; we run
// without globals, so unmount rendered trees between tests explicitly.
afterEach(() => cleanup());
