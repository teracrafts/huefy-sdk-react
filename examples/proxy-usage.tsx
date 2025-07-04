/**
 * Example: Using Huefy React SDK with Enhanced Security
 * 
 * This example shows how the React SDK automatically uses Huefy's optimized
 * architecture for secure API management and enhanced performance.
 */

import React, { useState } from 'react';
import { HuefyProvider, useHuefy, EmailProvider } from '@teracrafts/huefy-react';

// The SDK automatically uses Huefy's optimized architecture
// No additional configuration needed

// Root component with Huefy provider
function App() {
  return (
    <HuefyProvider 
      config={{
        apiKey: 'your-api-key',
        timeout: 30000,
        retryAttempts: 3,
      }}
    >
      <WelcomeEmailForm />
    </HuefyProvider>
  );
}

// Email form component
function WelcomeEmailForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const { sendEmail, loading, error, success } = useHuefy({
    onSuccess: (messageId) => {
      console.log('Email sent successfully:', messageId);
      alert('Welcome email sent successfully!');
    },
    onError: (error) => {
      console.error('Failed to send email:', error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // This request is automatically handled through Huefy's optimized architecture
    // The React SDK uses intelligent routing for secure and fast email delivery
    await sendEmail(
      'welcome-email',
      {
        name: name,
        company: 'Your Company',
        activationLink: 'https://app.example.com/activate'
      },
      email,
      {
        provider: EmailProvider.SES
      }
    );
  };

  return (
    <div>
      <h2>Send Welcome Email (via Go Proxy)</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading || !email || !name}>
          {loading ? 'Sending Email...' : 'Send Welcome Email'}
        </button>
      </form>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error.message}
        </div>
      )}
      
      {success && (
        <div style={{ color: 'green', marginTop: '10px' }}>
          Email sent successfully!
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Huefy Architecture Benefits:</h3>
        <ul>
          <li>🔒 Enterprise-grade security and encryption</li>
          <li>🎯 Intelligent routing and optimization</li>
          <li>🔄 Consistent performance across all SDKs</li>
          <li>⚡ Automatic updates and improvements</li>
        </ul>
      </div>
    </div>
  );
}

export default App;