import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorAnimation from '../assets/Animation - Error.json';
import Lottie from 'lottie-react';

const ErrorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { statusCode = 404, message = "The page you are looking for does not exist." } = location.state || {};

  return (
    <div className="min-h-screen flex flex-col justify-center items-center  text-center p-8">
      <Lottie
        animationData={ErrorAnimation}
        loop={true}
        className="w-1/2 h-1/2 mb-8"
        style={{ maxWidth: '400px', maxHeight: '400px' }}
      >
      </Lottie>
      <h1 className="text-6xl font-bold text-error">{statusCode}</h1>
      <p className="text-2xl mt-4">{message}</p>
      <button
        onClick={() => navigate(location.state?.from || '/')}
        className="btn btn-primary mt-6"
      >
        Go Home
      </button>
    </div>
  );
};

export default ErrorPage;
