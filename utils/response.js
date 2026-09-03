export const successResponse = (
  res,
  {
    statusCode = 200,
    message = "Success",
    data = null,
    count = undefined,
  } = {},
) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (count !== undefined) {
    response.count = count;
  }

  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res,
  {
    statusCode = 500,
    message = "Something went wrong",
    error = undefined,
  } = {},
) => {
  const response = {
    success: false,
    message,
  };

  if (error !== undefined) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};