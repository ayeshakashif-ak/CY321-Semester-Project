const Toast: React.FC<{ message: string; type: 'success' | 'error' }> = ({ 
  message, 
  type 
}) => {
  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  );
};
