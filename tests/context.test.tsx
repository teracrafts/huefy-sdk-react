/**
 * Tests for React Context and Provider
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { HuefyClient } from '@huefy/sdk';
import { HuefyProvider, useHuefyContext, withHuefy } from '../src/context.js';

// Mock the SDK client
jest.mock('@huefy/sdk');
const MockedHuefyClient = jest.mocked(HuefyClient);

describe('HuefyProvider', () => {
  let mockClient: jest.Mocked<HuefyClient>;

  beforeEach(() => {
    mockClient = {
      sendEmail: jest.fn(),
      sendBulkEmails: jest.fn(),
      healthCheck: jest.fn(),
    } as any;
    
    MockedHuefyClient.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create client with provided config', () => {
    const config = {
      apiKey: 'test-key',
      baseURL: 'https://test.huefy.com',
    };

    render(
      <HuefyProvider config={config}>
        <div>Test</div>
      </HuefyProvider>
    );

    expect(MockedHuefyClient).toHaveBeenCalledWith(config);
  });

  it('should provide client through context', () => {
    const config = {
      apiKey: 'test-key',
      baseURL: 'https://test.huefy.com',
    };

    const { result } = renderHook(() => useHuefyContext(), {
      wrapper: ({ children }) => (
        <HuefyProvider config={config}>
          {children}
        </HuefyProvider>
      ),
    });

    expect(result.current.client).toBe(mockClient);
    expect(result.current.config).toEqual(config);
  });

  it('should render children', () => {
    render(
      <HuefyProvider
        config={{
          apiKey: 'test-key',
          baseURL: 'https://test.huefy.com',
        }}
      >
        <div data-testid="child">Test Child</div>
      </HuefyProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Test Child');
  });
});

describe('useHuefyContext', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useHuefyContext());
    }).toThrow('useHuefyContext must be used within a HuefyProvider');

    console.error = originalError;
  });

  it('should return context when used within provider', () => {
    const config = {
      apiKey: 'test-key',
      baseURL: 'https://test.huefy.com',
    };

    const { result } = renderHook(() => useHuefyContext(), {
      wrapper: ({ children }) => (
        <HuefyProvider config={config}>
          {children}
        </HuefyProvider>
      ),
    });

    expect(result.current).toEqual({
      client: expect.any(Object),
      config,
    });
  });
});

describe('withHuefy HOC', () => {
  it('should wrap component with HuefyProvider', () => {
    const TestComponent = ({ text }: { text: string }) => (
      <div data-testid="test">{text}</div>
    );

    const config = {
      apiKey: 'test-key',
      baseURL: 'https://test.huefy.com',
    };

    const WrappedComponent = withHuefy(TestComponent, config);

    render(<WrappedComponent text="Hello World" />);

    expect(screen.getByTestId('test')).toHaveTextContent('Hello World');
    expect(MockedHuefyClient).toHaveBeenCalledWith(config);
  });

  it('should pass through all props to wrapped component', () => {
    const TestComponent = (props: { 
      text: string; 
      number: number; 
      onClick: () => void; 
    }) => {
      return (
        <div data-testid="test" onClick={props.onClick}>
          {props.text} - {props.number}
        </div>
      );
    };

    const config = {
      apiKey: 'test-key',
      baseURL: 'https://test.huefy.com',
    };

    const WrappedComponent = withHuefy(TestComponent, config);
    const mockClick = jest.fn();

    render(
      <WrappedComponent 
        text="Hello" 
        number={42} 
        onClick={mockClick} 
      />
    );

    const element = screen.getByTestId('test');
    expect(element).toHaveTextContent('Hello - 42');
    
    element.click();
    expect(mockClick).toHaveBeenCalled();
  });

  it('should have correct display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const config = {
      apiKey: 'test-key',
      baseURL: 'https://test.huefy.com',
    };

    const WrappedComponent = withHuefy(TestComponent, config);

    expect(WrappedComponent.displayName).toBe('withHuefy(TestComponent)');
  });

  it('should handle components without display name', () => {
    const TestComponent = () => <div>Test</div>;

    const config = {
      apiKey: 'test-key',
      baseURL: 'https://test.huefy.com',
    };

    const WrappedComponent = withHuefy(TestComponent, config);

    expect(WrappedComponent.displayName).toBe('withHuefy(TestComponent)');
  });
});