// components/GameLog.jsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const GameLog = ({ logs = [] }) => {
  return (
    <Card className="mt-4">
      <CardContent>
        <div className="h-32 overflow-y-auto space-y-2">
          {logs.map((log, index) => (
            <div key={index} className="text-sm">
              <span className="text-gray-500">[{log.timestamp}]</span>{" "}
              {log.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameLog;
