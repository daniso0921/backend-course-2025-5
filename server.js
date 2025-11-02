
import http from "http";
import fs from "fs";
import path from "path";
import { Command } from "commander";

const program = new Command();

program
    .requiredOption("--host <host>", "Адреса сервера")
    .requiredOption("--port <port>", "Порт сервера")
    .requiredOption("--cache <path>", "Шлях до директорії кешу");

program.parse(process.argv);
const options = program.opts();


if (!fs.existsSync(options.cache)) {
    fs.mkdirSync(options.cache, { recursive: true });
    console.log(`📁 Створено теку кешу: ${options.cache}`);
}

function getCacheFilePath(code) {
    return path.join(options.cache, `${code}.jpg`);
}

const server = http.createServer(async (req, res) => {
    const method = req.method;
    const code = req.url.slice(1); // наприклад "/200" → "200"
    const filePath = getCacheFilePath(code);

    if (!["GET", "PUT", "DELETE"].includes(method)) {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method not allowed");
        return;
    }

    try {
        if (method === "GET") {
            //  GET: прочитати картинку з кешу 
            const data = await fs.promises.readFile(filePath);
            res.writeHead(200, { "Content-Type": "image/jpeg" });
            res.end(data);
        } else if (method === "PUT") {
            //  PUT: записати новий файл у кеш 
            let body = [];
            for await (const chunk of req) body.push(chunk);
            const buffer = Buffer.concat(body);
            await fs.promises.writeFile(filePath, buffer);
            res.writeHead(201, { "Content-Type": "text/plain" });
            res.end("Created");
        } else if (method === "DELETE") {
            //  DELETE: видалити файл з кешу 
            await fs.promises.unlink(filePath);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Deleted");
        }
    } catch (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
    }
});

server.listen(options.port, options.host || "0.0.0.0", () => {
    console.log(`🚀 Сервер запущено на http://${options.host}:${options.port}`);
    console.log(`🗂 Кеш-директорія: ${options.cache}`);
});
