import { configureStore } from "@reduxjs/toolkit";
import timeSlice from "../slices/TimeSlice";
import language from "../slices/LanguageSlice";
import apiSlice from "../slices/ApiSlice";
export const store = configureStore({
  reducer: {
    time: timeSlice,
    language: language,
    api: apiSlice,
  },
});
