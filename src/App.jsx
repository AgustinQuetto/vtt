// App.jsx
import React from "react";
import "./App.css";
import VirtualTabletop from "./components/VirtualTabletop";

const App = () => {
  return (
    <main className="min-h-screen bg-gray-100">
      {/*  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> */}
      {/* <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            The Black Hack Virtual Tabletop
          </h1>
          <p className="mt-2 text-gray-600">
            Sistema de juego de rol simplificado en línea
          </p>
        </div> */}

      <VirtualTabletop />

      {/*  <footer className="text-center text-sm text-gray-500">
        <p>Basado en las reglas de The Black Hack</p>
      </footer>
      </div> */}
    </main>
  );
};

export default App;
