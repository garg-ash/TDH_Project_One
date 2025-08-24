import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

interface ActivityLoggerProps {
  action_type: 'download' | 'save' | 'filter' | 'import' | 'export' | 'process';
  action_details: string;
  filters_applied?: object;
  data_count?: number;
  file_name?: string;
}

const ActivityLogger = ({ 
  action_type, 
  action_details, 
  filters_applied = {}, 
  data_count = 0, 
  file_name 
}: ActivityLoggerProps) => {
  const { user } = useContext(AuthContext);

  const logActivity = async () => {
    if (!user) return;

    try {
      const response = await fetch('http://localhost:5002/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          username: user.name || user.email,
          action_type,
          action_details,
          filters_applied,
          data_count,
          file_name,
          ip_address: null, // Will be captured by backend
          user_agent: navigator.userAgent
        }),
      });

      if (response.ok) {
        console.log('Activity logged successfully');
      } else {
        console.error('Failed to log activity');
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // This component doesn't render anything, it just logs activities
  // You can call logActivity() from parent components when needed
  return null;
};

export default ActivityLogger;

// Hook for easy activity logging
export const useActivityLogger = () => {
  const { user } = useContext(AuthContext);

  const logActivity = async (activityData: {
    action_type: 'download' | 'save' | 'filter' | 'import' | 'export' | 'process';
    action_details: string;
    filters_applied?: object;
    data_count?: number;
    file_name?: string;
  }) => {
    if (!user) return;

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          username: user.name || user.email,
          ...activityData,
          ip_address: null,
          user_agent: navigator.userAgent
        }),
      });

      if (response.ok) {
        console.log('Activity logged successfully');
        return true;
      } else {
        console.error('Failed to log activity');
        return false;
      }
    } catch (error) {
      console.error('Error logging activity:', error);
      return false;
    }
  };

  return { logActivity };
};
