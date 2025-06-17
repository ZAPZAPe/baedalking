interface LoadingProps {
  text?: string;
}

const Loading = ({ text }: LoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative mb-4">
        <div className="loading-spinner"></div>
        <div className="absolute inset-0 loading-spinner opacity-30"></div>
      </div>
      {text && (
        <div className="text-gray-600 text-sm">{text}</div>
      )}
    </div>
  );
};

export default Loading; 