"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
    ModuleRegistry,
    ClientSideRowModelModule,
    ClientSideRowModelApiModule,
    ValidationModule,
} from "ag-grid-community";
import CompanyLogo from '../images/flowswitch-icon.png';

import { getData } from "./data";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
]);

const setPrinterFriendly = (api) => {
  const eGridDiv = document.querySelector("#myGrid");
  eGridDiv.style.width = "";
  eGridDiv.style.height = "";
  api.setGridOption("domLayout", "print");
}

const setNormal = (api) => {
  const eGridDiv = document.querySelector("#myGrid");
  eGridDiv.style.width = "700px";
  eGridDiv.style.height = "200px";
  api.setGridOption("domLayout", undefined);
}

const GridExample = ({ data }) => {
  const gridRef = useRef(null);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const [rowData, setRowData] = useState(getData());
  const [columnDefs, setColumnDefs] = useState([
    { field: "group", rowGroup: true, hide: true },
    { field: "id", pinned: "left", width: 70 },
    { field: "model", width: 180 },
    { field: "color", width: 100 },
    {
      field: "price",
      valueFormatter: "'$' + value.toLocaleString()",
      width: 100,
    },
    { field: "year", width: 100 },
    { field: "country", width: 120 },
  ]);

  const onFirstDataRendered = useCallback((params) => {
    params.api.expandAll();
  }, []);

  const handlePrintList = useCallback(() => {
    setPrinterFriendly(gridRef.current.api);
    setTimeout(() => {
      print();
      setNormal(gridRef.current.api);
    }, 2000);
  }, [print]);

  return (
    <div style={containerStyle}>
      <div className="flex justify-end">
        <button
            onClick={handlePrintList}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
        >
            🖨️ Print List
        </button>
      </div>

      <div className="w-full hidden print:block">
            <div className="flex justify-between items-center mb-6 gap-4">
                <img src={CompanyLogo} alt="Company Logo" className="w-24 h-auto" />
                <div className="gap-4">
                    <div className="text-5xl font-bold"> Free short merchants </div>
                    <div className="text-3xl text-right"> Registration </div>
                </div>
            </div>
            <div className="w-full mt-10 py-2 text-md text-justify">
                <b> filtered </b>
            </div>
      </div>

      <div id="myGrid" className="w-full h-[200px]">
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          onFirstDataRendered={onFirstDataRendered}
        />
      </div>
    </div>
  );
};

export { GridExample }