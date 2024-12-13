import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock cho Chart.js
jest.mock('react-chartjs-2', () => ({
    Bar: () => null,
    Pie: () => null
}));

// Mock cho localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock cho window.URL
global.URL.createObjectURL = jest.fn(); 