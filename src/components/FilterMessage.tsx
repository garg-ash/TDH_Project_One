import React from 'react';

interface FilterMessageProps {
  message?: string;
  subMessage?: string;
  icon?: string;
  className?: string;
}

const FilterMessage: React.FC<FilterMessageProps> = ({
  message = "डेटा देखने के लिए क्षेत्र का चयन करें",
  subMessage = "लोकसभा | विधान सभा | जिला | ब्लॉक | अन्य विविध फिल्टर चुनें",
  icon = "🔍",
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-lg p-8 ${className}`}>
      <div className="text-center">
        <div className="text-gray-400 text-6xl mb-4">{icon}</div>
        <div className="text-gray-500 mb-4">{message}</div>
        <div className="text-sm text-gray-400">
          {subMessage}
        </div>
      </div>
    </div>
  );
};

export default FilterMessage;
