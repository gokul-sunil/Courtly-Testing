import styles from './GymDashboard.module.css';
import React, { useState, useEffect } from 'react';

function GymDashboard() {
    const [gymStats, setGymStats] = useState({
        totalBookings: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        trainerCount: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchGymStatistics();
    }, []);

    const fetchGymStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Try different possible API endpoints with correct v1 path
            const possibleEndpoints = [
                'http://localhost:8000/api/v1/gym/full-statistics',
                'http://localhost:8000/api/v1/gym/statistics',
                'http://localhost:8000/api/gym/full-statistics',
                'http://localhost:8000/gym/full-statistics'
            ];
            
            let response;
            let lastError;
            
            for (const endpoint of possibleEndpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    response = await fetch(endpoint);
                    
                    // Check if response is HTML (404 page)
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('text/html')) {
                        throw new Error(`Endpoint returned HTML instead of JSON: ${endpoint}`);
                    }
                    
                    if (response.ok) {
                        break; // Found working endpoint
                    } else {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                } catch (err) {
                    lastError = err;
                    console.log(`Failed with endpoint ${endpoint}:`, err.message);
                    continue;
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`All API endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
            }
            
            const data = await response.json();
            setGymStats({
                totalBookings: data.totalBookings || 0,
                activeSubscriptions: data.activeSubscriptions || 0,
                expiredSubscriptions: data.expiredSubscriptions || 0,
                trainerCount: data.trainerCount || 0,
                totalRevenue: data.totalRevenue || 0
            });
        } catch (err) {
            console.error('Error fetching gym statistics:', err);
            setError(`API Error: ${err.message}. Please check if your backend server is running and the endpoint /api/gym/full-statistics exists.`);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const courts = [
        { 
            name: "Total Members", 
            value: loading ? "..." : gymStats.totalBookings,
            action: "view",
        },
        { 
            name: "Active Members", 
            value: loading ? "..." : gymStats.activeSubscriptions,
            action: "manage",
           
        },
        { 
            name: "Inactive Members", 
            value: loading ? "..." : gymStats.expiredSubscriptions,
            action: "reactivate",
           
        },
        { 
            name: "Trainers", 
            value: loading ? "..." : gymStats.trainerCount,
            action: "schedule",
            
        },
        { 
            name: "Total Revenue", 
            value: loading ? "..." : formatCurrency(gymStats.totalRevenue),
            action: "billing",
            
        }
    ];

    const handleCardClick = (action, cardName) => {
        console.log(`Clicked ${action} for ${cardName}`);
        // Add your navigation logic here based on the action
        switch(action) {
            case 'add':
                // Navigate to add member page
                break;
            case 'view':
                // Navigate to all members page
                break;
            case 'manage':
                // Navigate to active members page
                break;
            case 'reactivate':
                // Navigate to inactive members page
                break;
            case 'schedule':
                // Navigate to trainer schedule page
                break;
            case 'billing':
                // Navigate to billing page
                break;
            default:
                break;
        }
    };

    if (error) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.header}>
                    <h1 className={styles.headerTitle}>Dashboard</h1>
                </div>
                <div className={styles.errorMessage}>
                    <h3>Unable to load dashboard data</h3>
                    <p>{error}</p>
                    <div className={styles.errorActions}>
                        <button onClick={fetchGymStatistics} className={styles.retryButton}>
                            Retry Connection
                        </button>
                        <button 
                            onClick={() => {
                                setError(null);
                                // Load with dummy data for development
                                setGymStats({
                                    totalBookings: 250,
                                    activeSubscriptions: 215,
                                    expiredSubscriptions: 35,
                                    trainerCount: 12,
                                    totalRevenue: 125000
                                });
                                setLoading(false);
                            }} 
                            className={styles.demoButton}
                        >
                            Load Demo Data
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>Gym Dashboard</h1>
               
            </div>

            <div className={styles.courtsGrid}>
                {courts.map((court, index) => (
                    <div
                        key={index}
                        className={`${styles.courtCard} ${loading ? styles.loading : ''}`}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div className={styles.courtName}>
                            {court.name}
                            {court.icon && <span className={styles.icon}>{court.icon}</span>}
                        </div>
                        
                        {court.value && (
                            <div className={styles.statValue}>
                                {court.value}
                            </div>
                        )}
                        
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GymDashboard;