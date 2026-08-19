import React from 'react';

const Unauthorized = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="text-center">
      <h1 className="display-1 text-danger">403</h1>
      <p className="lead">You don't have permission to access this page</p>
      <button 
        className="btn btn-primary mt-3"
        onClick={() => window.history.back()}
      >
        Go Back
      </button>
    </div>
  </div>
);

export default Unauthorized;