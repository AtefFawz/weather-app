import { createSlice } from "@reduxjs/toolkit";
// import moment ";
import moment from "moment/min/moment-with-locales";
import "moment/min/locales";
import "moment-hijri";
moment.locale(localStorage.getItem("longs") == "en" ? "ar" : "en");
export const timeSlice = createSlice({
  name: "times",
  initialState: {
    time: null,
  },
  reducers: {
    // Time
    setTime: (state) => {
      state.time = moment().format("dddd Do MMMM YYYY، h:mm a");
      console.log("Time", localStorage.getItem("longs"));
    },
  },
});
export const { setTime } = timeSlice.actions;

export default timeSlice.reducer;
