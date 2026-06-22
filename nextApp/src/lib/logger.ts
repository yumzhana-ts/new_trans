import fs from "fs";

const LOG_PATH = "/var/log/backend/app.log";
//check the path! 


const stream = fs.createWriteStream(LOG_PATH, { flags: "a" });

function writeLog(data: any) {
  stream.write(JSON.stringify(data) + "\n");
}


export const logger = {
  info: (data: any) => {
    writeLog({ level: "info", ...data, timestamp: new Date().toISOString() });
  },

  error: (data: any) => {
    writeLog({ level: "error", ...data, timestamp: new Date().toISOString() });
  }
};