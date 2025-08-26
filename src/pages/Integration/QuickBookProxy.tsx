import React, { useEffect, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";

const QuickBooksProxy: React.FC = () => {
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    axiosInstance()
      .get("/integration/quick-books/oauth/callback", {
        params: Object.fromEntries(params.entries()),
      })
      .then(() => {
        window.location.href = "/integration";
      })
      .catch(() => {
        setError(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 5000);
      });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-6 bg-white rounded-2xl shadow-md max-w-md w-full">
        {!error ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Connecting to QuickBooks…
            </h2>
            <p className="text-gray-500 mt-2">
              Please wait while we finalize the connection.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-red-600">
              Something went wrong
            </h2>
            <p className="text-gray-500 mt-2">
              Redirecting you to the home page in 5 seconds.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickBooksProxy;
