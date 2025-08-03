import "./App.css";
// IMPORT MATERIAL UI
import Container from "@mui/material/Container";
// IMPORT COMPONENT
import Weather from "./Main/Weather";

function App() {
  return (
    <>
      <Container maxWidth="sm" disableGutters={true}>
        <div className={` flex mt-[30%] justify-center px-2 `}>
          <Weather />
        </div>
      </Container>
    </>
  );
}

export default App;
