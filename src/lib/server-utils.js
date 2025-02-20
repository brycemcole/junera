export class ServerError extends Error {
  constructor(message, code = 500) {
    super(message);
    this.code = code;
  }
}

export function handleServerError(error) {
  console.error('Server Error:', error);
  
  if (error instanceof ServerError) {
    return {
      error: error.message,
      code: error.code
    };
  }

  return {
    error: 'An unexpected error occurred',
    code: 500
  };
}