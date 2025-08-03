// Import Libraries
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
// Thunk Function API
export const fetchApi = createAsyncThunk("api/weather", async () => {
  const res = await axios.get(
    "https://api.openweathermap.org/data/2.5/weather?lat=31.13&lon=30.13&appid=b9aa65b8dd1e248c265f5688cde569cf"
  );
  //   Date
  let icon = res.data.weather[0].icon;
  let result = {
    name: res.data.name,
    temp: Math.round(res.data.main.temp - 273.15),
    status: res.data.weather[0].description,
    main: Math.round(res.data.main.temp_min - 273.15),
    max: Math.round(res.data.main.temp_max - 273.15),
    icon: `https://openweathermap.org/img/wn/${icon}@2x.png`,
  };

  return result;
});

// Slice
const apiSlice = createSlice({
  name: "api",
  initialState: {
    value: {},
    loading: false,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchApi.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchApi.fulfilled, (state, action) => {
        state.value = action.payload;
        state.loading = false;
      });
  },
});
export default apiSlice.reducer;
