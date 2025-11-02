// server.js
import http from "http";
import fs from "fs";
import { Command } from "commander";

const program = new Command();

program
    .requiredOption("-h, --host <host>", "Адреса сервера")
    .requiredOption("-p, --port <port>", "Порт сервера")
    .requiredOption("-c, --cache <path>", "Шлях до директорії кешу");

program.parse(process.argv);

const options = program.opts();

// Створюємо директорію кешу, якщо її не існує
if (!fs.existsSync(options.cache)) {
    fs.mkdirSync(options.cache, { recursive: true });
    console.log(`📁 Створено теку кешу: ${options.cache}`);
}

// Створення HTTP-сервера
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Проксі-сервер працює! ✅");
});

server.listen(options.port, options.host || "0.0.0.0", () => {
    console.log(`🚀 Сервер запущено на http://${options.host}:${options.port}`);
    console.log(`🗂 Кеш-директорія: ${options.cache}`);
});
