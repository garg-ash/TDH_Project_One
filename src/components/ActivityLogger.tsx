import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

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
  const { user } = useAuth();

  const logActivity = async (activityData: {
    action_type: 'download' | 'save' | 'filter' | 'import' | 'export' | 'process';
    action_details: string;
    filters_applied?: object;
    data_count?: number;
    file_name?: string;
  }) => {
    if (!user) {
      console.log('No user logged in, skipping activity log');
      return true; // Return true to not block the operation
    }

    try {
      // Try to log to backend, but don't fail if backend is not available
      const response = await fetch('http://localhost:5002/api/log', {
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
        console.warn('Failed to log activity to backend, but continuing operation');
        return true; // Return true to not block the operation
      }
    } catch (error) {
      console.warn('Backend not available for activity logging, but continuing operation:', error);
      return true; // Return true to not block the operation
    }
  };

  return { logActivity };
};
