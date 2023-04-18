import axios from "axios";

const createReview = async (landmark_id, review) => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/reviews`,
      {
        landmark_id,
        ...review,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (error) {
    throw new Error(error.response.data.detail);
  }
};

const removeReview = async (review_id) => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.delete(
      `${import.meta.env.VITE_API_URL}/reviews/${review_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (error) {
    throw new Error(error.response.data.detail);
  }
};

const reviewServices = {
  createReview,
  removeReview
};

export default reviewServices;
