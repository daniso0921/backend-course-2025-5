// server.js
import http from "http";
import fs from "fs";
import path from "path";
import { Command } from "commander";
import superagent from "superagent";

const program = new Command();

program
    .requiredOption("--host <host>", "Адреса сервера")
    .requiredOption("--port <port>", "Порт сервера")
    .requiredOption("--cache <path>", "Шлях до директорії кешу");

program.parse(process.argv);
const options = program.opts();

// створюємо теку кешу, якщо її ще нема
if (!fs.existsSync(options.cache)) {
    fs.mkdirSync(options.cache, { recursive: true });
    console.log(`📁 Створено теку кешу: ${options.cache}`);
}

function getCacheFilePath(code) {
    return path.join(options.cache, `${code}.jpg`);
}

const server = http.createServer(async (req, res) => {
    const method = req.method;
    const code = req.url.slice(1); // "/200" → "200"
    const filePath = getCacheFilePath(code);

    if (!["GET", "PUT", "DELETE"].includes(method)) {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method not allowed");
        return;
    }

    try {
        if (method === "GET") {
            try {
                // 1️⃣ спробуємо прочитати з кешу
                const data = await fs.promises.readFile(filePath);
                res.writeHead(200, { "Content-Type": "image/jpeg" });
                res.end(data);
            } catch {
                // 2️⃣ якщо нема у кеші — завантажуємо з http.cat
                try {
                    const response = await superagent.get(`https://http.cat/${code}`).responseType("blob");
                    const buffer = Buffer.from(response.body);
                    await fs.promises.writeFile(filePath, buffer); // кешуємо
                    res.writeHead(200, { "Content-Type": "image/jpeg" });
                    res.end(buffer);
                    console.log(`🐱 Кешовано нову картинку для коду ${code}`);
                } catch {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("Not found on http.cat");
                }
            }
        } else if (method === "PUT") {
            // PUT — записуємо вручну
            let body = [];
            for await (const chunk of req) body.push(chunk);
            const buffer = Buffer.concat(body);
            await fs.promises.writeFile(filePath, buffer);
            res.writeHead(201, { "Content-Type": "text/plain" });
            res.end("Created");
        } else if (method === "DELETE") {
            await fs.promises.unlink(filePath);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Deleted");
        }
    } catch {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Server error");
    }
});

server.listen(options.port, options.host || "0.0.0.0", () => {
    console.log(`🚀 Сервер запущено на http://${options.host}:${options.port}`);
    console.log(`🗂 Кеш-директорія: ${options.cache}`);
});
