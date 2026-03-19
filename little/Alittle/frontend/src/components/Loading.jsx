const Loading = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-2 text-gray-600">加载中...</p>
    </div>
  );
};

export default Loading;