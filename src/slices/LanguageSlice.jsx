import { createSlice } from "@reduxjs/toolkit";

export const language = createSlice({
  name: "language",
  initialState: {
    lang: localStorage.getItem("longs"),
  },
  reducers: {
    changeLanguage: (state) => {
      let newLanguage = state.lang == "en" ? "ar" : "en";
      localStorage.setItem("longs", newLanguage);
      state.lang = newLanguage;
    },
  },
});
export const { changeLanguage } = language.actions;
export default language.reducer;
