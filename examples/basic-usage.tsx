import React, { useState, useCallback } from 'react';
import { HuefyProvider, useHuefy, EmailProvider } from '@teracrafts/huefy-react';

/**
 * React example demonstrating the Huefy React SDK.
 * 
 * This example shows:
 * 1. HuefyProvider setup
 * 2. useHuefy hook usage
 * 3. Loading and error states
 * 4. Form handling with email sending
 * 5. Bulk email operations
 */

// Main App component wrapped with HuefyProvider
function App() {
    return (
        <HuefyProvider 
            apiKey={process.env.REACT_APP_HUEFY_API_KEY || 'your-api-key'}
            config={{
                baseUrl: 'https://api.huefy.com',
                timeout: 30000,
                retryOptions: {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 10000
                }
            }}
        >
            <div className="App">
                <h1>Huefy React SDK Examples</h1>
                <WelcomeEmailForm />
                <NewsletterSignup />
                <BulkEmailExample />
                <HealthChecker />
            </div>
        </HuefyProvider>
    );
}

// Example 1: Welcome email form
function WelcomeEmailForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: ''
    });

    const { sendEmail, loading, error, success } = useHuefy({
        onSuccess: (messageId) => {
            console.log('Welcome email sent:', messageId);
            alert(`Welcome email sent successfully! Message ID: ${messageId}`);
        },
        onError: (error) => {
            console.error('Failed to send welcome email:', error);
        }
    });

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email) {
            alert('Please fill in name and email');
            return;
        }

        await sendEmail(
            'welcome-email',
            {
                name: formData.name,
                company: formData.company || 'Your Organization',
                activationLink: `https://app.example.com/activate/${Date.now()}`,
                supportEmail: 'support@example.com'
            },
            formData.email,
            {
                provider: EmailProvider.SENDGRID
            }
        );

        // Reset form on success
        if (success) {
            setFormData({ name: '', email: '', company: '' });
        }
    }, [formData, sendEmail, success]);

    return (
        <div className="welcome-email-form">
            <h2>Send Welcome Email</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Name *:
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            disabled={loading}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Email *:
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            disabled={loading}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Company:
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                            disabled={loading}
                        />
                    </label>
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Welcome Email'}
                </button>
            </form>
            {error && <div className="error">Error: {error.message}</div>}
        </div>
    );
}

// Example 2: Newsletter signup with immediate confirmation
function NewsletterSignup() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    const { sendEmail, loading, error } = useHuefy({
        onSuccess: (messageId) => {
            alert(`Newsletter signup confirmation sent! Message ID: ${messageId}`);
            setEmail('');
            setName('');
        },
        onError: (error) => {
            alert(`Failed to send confirmation: ${error.message}`);
        }
    });

    const handleSignup = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        await sendEmail(
            'newsletter-signup-confirmation',
            {
                subscriberName: name,
                confirmationLink: `https://app.example.com/confirm-newsletter/${Date.now()}`,
                unsubscribeLink: 'https://app.example.com/unsubscribe',
                newsletterFrequency: 'Weekly'
            },
            email,
            {
                provider: EmailProvider.MAILGUN
            }
        );
    }, [email, name, sendEmail]);

    return (
        <div className="newsletter-signup">
            <h2>Newsletter Signup</h2>
            <form onSubmit={handleSignup}>
                <div>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Email:
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </label>
                </div>
                <button type="submit" disabled={loading || !email || !name}>
                    {loading ? 'Signing up...' : 'Sign up for Newsletter'}
                </button>
            </form>
            {error && <div className="error">Error: {error.message}</div>}
        </div>
    );
}

// Example 3: Bulk email sending
function BulkEmailExample() {
    const [recipients, setRecipients] = useState([
        { email: 'user1@example.com', name: 'User One' },
        { email: 'user2@example.com', name: 'User Two' },
        { email: 'user3@example.com', name: 'User Three' }
    ]);

    const { sendBulkEmails, loading, error } = useHuefy({
        onSuccess: (result) => {
            const { successfulEmails, totalEmails, failedEmails } = result;
            alert(`Bulk email completed: ${successfulEmails}/${totalEmails} sent, ${failedEmails} failed`);
        },
        onError: (error) => {
            alert(`Bulk email failed: ${error.message}`);
        }
    });

    const handleBulkSend = useCallback(async () => {
        const emails = recipients
            .filter(recipient => recipient.email && recipient.name)
            .map(recipient => ({
                templateKey: 'promotional-email',
                recipient: recipient.email,
                data: {
                    recipientName: recipient.name,
                    offerTitle: 'Special Discount',
                    discountCode: 'SAVE20',
                    expirationDate: '2024-12-31',
                    ctaLink: 'https://app.example.com/special-offer'
                }
            }));

        if (emails.length === 0) {
            alert('Please add at least one valid recipient');
            return;
        }

        await sendBulkEmails(emails);
    }, [recipients, sendBulkEmails]);

    const addRecipient = () => {
        setRecipients(prev => [...prev, { email: '', name: '' }]);
    };

    const updateRecipient = (index: number, field: 'email' | 'name', value: string) => {
        setRecipients(prev => prev.map((recipient, i) => 
            i === index ? { ...recipient, [field]: value } : recipient
        ));
    };

    const removeRecipient = (index: number) => {
        setRecipients(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bulk-email-example">
            <h2>Bulk Email Example</h2>
            <div className="recipients-list">
                <h3>Recipients:</h3>
                {recipients.map((recipient, index) => (
                    <div key={index} className="recipient-row">
                        <input
                            type="text"
                            placeholder="Name"
                            value={recipient.name}
                            onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                            disabled={loading}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={recipient.email}
                            onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                            disabled={loading}
                        />
                        <button 
                            type="button" 
                            onClick={() => removeRecipient(index)}
                            disabled={loading}
                        >
                            Remove
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addRecipient} disabled={loading}>
                    Add Recipient
                </button>
            </div>
            <button 
                onClick={handleBulkSend} 
                disabled={loading || recipients.length === 0}
                className="bulk-send-button"
            >
                {loading ? 'Sending...' : `Send Promotional Email to ${recipients.length} Recipients`}
            </button>
            {error && <div className="error">Error: {error.message}</div>}
        </div>
    );
}

// Example 4: Health checker component
function HealthChecker() {
    const [healthStatus, setHealthStatus] = useState<any>(null);
    const { healthCheck, loading, error } = useHuefy();

    const checkHealth = useCallback(async () => {
        const result = await healthCheck();
        setHealthStatus(result);
    }, [healthCheck]);

    React.useEffect(() => {
        // Check health on component mount
        checkHealth();
    }, [checkHealth]);

    return (
        <div className="health-checker">
            <h2>API Health Status</h2>
            <button onClick={checkHealth} disabled={loading}>
                {loading ? 'Checking...' : 'Check Health'}
            </button>
            
            {healthStatus && (
                <div className={`health-status ${healthStatus.status}`}>
                    <p><strong>Status:</strong> {healthStatus.status}</p>
                    <p><strong>Version:</strong> {healthStatus.version}</p>
                    <p><strong>Uptime:</strong> {Math.floor(healthStatus.uptime / 3600)} hours</p>
                </div>
            )}
            
            {error && <div className="error">Health check failed: {error.message}</div>}
        </div>
    );
}

export default App;

// CSS styles (would typically be in a separate file)
export const styles = `
.App {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

.welcome-email-form,
.newsletter-signup,
.bulk-email-example,
.health-checker {
    background: #f5f5f5;
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
}

.recipient-row {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
}

.recipient-row input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.bulk-send-button {
    background: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
}

.bulk-send-button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.error {
    background: #ffe6e6;
    color: #d00;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
}

.health-status {
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
}

.health-status.healthy {
    background: #e6ffe6;
    color: #0a0;
}

.health-status.degraded {
    background: #fff5e6;
    color: #fa0;
}

.health-status.unhealthy {
    background: #ffe6e6;
    color: #d00;
}

label {
    display: block;
    margin-bottom: 10px;
}

input {
    padding: 8px;
    margin-left: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

button {
    padding: 10px 15px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
}
`;