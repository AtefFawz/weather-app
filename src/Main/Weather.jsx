//  IMPORT HOOKS
import "../App.css";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
//IMPORT Functions From Slices
import { setTime } from "../slices/TimeSlice";
import { changeLanguage } from "../slices/LanguageSlice";
import { fetchApi } from "../slices/ApiSlice";
// IMPORT MATERIAL UI
import Button from "@mui/material/Button";
import CloudIcon from "@mui/icons-material/Cloud";
import CircularProgress from "@mui/material/CircularProgress";
// External Libraries
import { useTranslation } from "react-i18next";
export default function Weather() {
  // Translation
  const { t, i18n } = useTranslation();
  // Redux
  //   Time
  const time = useSelector((state) => {
    return state.time.time;
  });
  const dispatch = useDispatch();
  //   Language
  const trans = useSelector((state) => {
    return state.language.lang;
  });
  //   API
  const { name, temp, status, icon, max, main } = useSelector((state) => {
    return state.api.value;
  });
  //   Loading
  const loading = useSelector((state) => {
    return state.api.loading;
  });
  // Effect API
  useEffect(() => {
    dispatch(fetchApi());
  }, []);
  //   use Effect Time
  useEffect(() => {
    dispatch(setTime());
  }, [trans]);
  //   Effect Handler Language
  useEffect(() => {}, [trans, i18n]);
  // HANDEL FUNCTION Time
  function handelClick() {
    dispatch(changeLanguage());
    i18n.changeLanguage(trans);
  }
  return (
    <>
      {/* PARENT  */}
      <div
        className={`relative w-[100%] `}
        style={{ direction: trans == "ar" ? "rtl" : "ltr" }}
      >
        {/* PARENT APPLICATION */}
        <div className={` rounded-3xl  bg-[#2C3E50] `}>
          {/* HEADER */}
          <div className={`flex justify-between p-5`}>
            <h3 className="md:text-4xl text-3xl font-bold">{t(name)}</h3>
            <h5 className="md:text-2xl text-lg">{time}</h5>
          </div>
          <hr />
          {/* ==={/* HEADER =======*/}
          {/* BODY */}
          <div
            className={`flex 
             items-center
             justify-between
             p-6
            `}
          >
            <div>
              <div className={`flex items-center`}>
                <h1 className="md:text-8xl text-6xl mx-">
                  {loading ? <CircularProgress /> : ""} {temp}
                </h1>
                {/* ICON Weather From API*/}
                <img src={icon} alt="Icon" />
              </div>
              <h4 className="md:text-3xl text-2xl py-3  ">{t(status)}</h4>
              <div className={`flex items-center gap-2 md:gap-4 w-[100%]`}>
                <h6 className="text-[10px] md:text-sm">{`${t(
                  "Max"
                )}: ${main}`}</h6>
                <span>|</span>
                <h6 className="text-[10px] md:text-sm">
                  {" "}
                  {`${t("Min")}: ${max}`}
                </h6>
              </div>
            </div>
            {/* ICON Weather From Material UI*/}
            <CloudIcon id="icon" />
          </div>
          {/* == BODY ====== */}
        </div>
        {/* == PARENT APPLICATION */}
        {/* Button Change language */}
        <div className={`absolute ${trans == "en" ? "right-0" : "left-0"} `}>
          <Button color="primary" onClick={handelClick}>
            {trans == "en" ? "Arabic" : "انجليزي"}
          </Button>
        </div>
      </div>
    </>
  );
}
// The Project has Been Completed
