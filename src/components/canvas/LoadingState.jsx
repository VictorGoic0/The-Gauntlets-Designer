export default function LoadingState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
        
        {/* Loading message */}
        <p className="text-gray-300 text-lg font-medium">Loading canvas...</p>
      </div>
    </div>
  );
}

