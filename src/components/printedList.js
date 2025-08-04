import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const PrintComponent = () => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Print Document",
  });

  return (
    <div>
      <button onClick={handlePrint}>Print this out!</button>
      <div style={{ display: "none" }}>
        <MyComponentToPrint ref={componentRef} />
      </div>
    </div>
  );
};

const MyComponentToPrint = React.forwardRef((props, ref) => (
  <div ref={ref}>
    <h1>Hello, World!</h1>
  </div>
));

export default PrintComponent;
