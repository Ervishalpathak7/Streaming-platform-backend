import fs from "fs/promises";

const CHUNK_SIZE = 10 * 1024 * 1024;
const parts = [];
const stat = await fs.stat(`${process.cwd()}/test/jatin.mp4`);


const response = await fetch("http://localhost:3000/api/v2/videos/init", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "unique-key-12345",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTdkZWU3MjVkMGU4NmI4ZTYyODlhNjMiLCJpYXQiOjE3NzAyMzI3NTcsImV4cCI6MTc3MDIzNDU1N30.nNxOD_G7pitonJrmttPS1dXf6jkp0wxtB16iviw_O0U"
    },
    body: JSON.stringify({
        title: "Test Video Upload",
        description: "This is a test video upload",
        filename: "jatin.mp4",
        filesize: stat.size,
        mimetype: "video/mp4",
    }),
});


if (!response.ok) {
    const err = await response.text();
    throw new Error(`Init upload failed: ${err}`);
}

console.log("Upload initialized successfully");

const responseData = await response.json();
const videoId = responseData.data.videoId;

const urlsResponse = await fetch(`http://localhost:3000/api/v2/videos/signed-urls/${videoId}`, {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTdkZWU3MjVkMGU4NmI4ZTYyODlhNjMiLCJpYXQiOjE3NzAyMzI3NTcsImV4cCI6MTc3MDIzNDU1N30.nNxOD_G7pitonJrmttPS1dXf6jkp0wxtB16iviw_O0U"
    },
});

if (!urlsResponse.ok) {
    const err = await urlsResponse.text();
    throw new Error(`Fetching signed URLs failed: ${err}`);
}

console.log("Fetched signed URLs successfully");
const urls = await urlsResponse.json();

for (const { partNumber, signedUrl } of urls.data.signedUrls) {
    const fd = await fs.open(`${process.cwd()}/test/jatin.mp4`, "r");
    const buffer = Buffer.alloc(CHUNK_SIZE);
    const { bytesRead } = await fd.read(
        buffer,
        0,
        CHUNK_SIZE,
        (partNumber - 1) * CHUNK_SIZE
    );

    await fd.close();
    if (bytesRead === 0) break; // EOF
    const body = buffer.subarray(0, bytesRead);
    const res = await fetch(signedUrl, {
        method: "PUT",
        body, // ONE request, ONE body
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Part ${partNumber} failed: ${err}`);
    }
    parts.push({
        partNumber,
        etag: res.headers.get("etag"),
    });
    console.log(`Part ${partNumber} uploaded (${bytesRead} bytes)`);
}

const completeRes = await fetch(`http://localhost:3000/api/v2/videos/complete/${videoId}`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTdkZWU3MjVkMGU4NmI4ZTYyODlhNjMiLCJpYXQiOjE3NzAyMzI3NTcsImV4cCI6MTc3MDIzNDU1N30.nNxOD_G7pitonJrmttPS1dXf6jkp0wxtB16iviw_O0U"
    },
    body: JSON.stringify({ parts }),
});

if (!completeRes.ok) {
    const err = await completeRes.text();
    throw new Error(`Complete upload failed: ${err}`);
}