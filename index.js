import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { client } from "./db.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";

const app = express();

// MIDDLEWARE

// Untuk membaca body berformat JSON
app.use(express.json());

// Untuk mengelola cookie
app.use(cookieParser());

app.post("/api/regis", async (req, res) => {
  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(req.body.sandi, salt);
  await client.query(
    `INSERT INTO admin (id,nama,sandi,no_hp) values (default,'${req.body.nama}','${hash}','${req.body.no_hp}')`
  );
  res.send("berhasil daftar");
});

// Untuk memeriksa otorisasi
app.use((req, res, next) => {
  if (
    req.path.startsWith("/api/login") ||
    req.path.startsWith("/assets") ||
    req.path.endsWith(".png") ||
    req.path.endsWith(".jpg")
  ) {
    next();
  } else {
    let authorized = false;
    if (req.cookies.token) {
      try {
        jwt.verify(req.cookies.token, process.env.SECRET_KEY);
        authorized = true;
      } catch (err) {
        res.clearCookie("token");
      }
    }
    if (authorized) {
      if (req.path.startsWith("/login")) {
        res.redirect("/");
      } else {
        next();
      }
    } else {
      if (req.path.startsWith("/login") || req.path.startsWith("/registrasi")) {
        next();
      } else {
        if (req.path.startsWith("/api")) {
          res.status(401);
          res.send("Anda harus login terlebih dahulu.");
        } else {
          res.redirect("/login");
        }
      }
    }
  }
});

// Untuk mengakses file statis
// app.use(express.static("public"));

// Untuk mengakses file statis (khusus Vercel)
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));


// ROUTE OTORISASI

// Login (dapatkan token)
app.post("/api/login", async (req, res) => {
  const results = await client.query(
    `SELECT * FROM admin WHERE nama = '${req.body.nama}'`
  );
  if (results.rows.length > 0) {
    if (await bcrypt.compare(req.body.sandi, results.rows[0].sandi)) {
      const token = jwt.sign(results.rows[0], process.env.SECRET_KEY);
      res.cookie("token", token);
      res.send("Login berhasil.");
    } else {
      res.status(401);
      res.send("Kata sandi salah.");
    }
  } else {
    res.status(401);
    res.send("Akun tidak ditemukan.");
  }
});

// Dapatkan Data saat ini (yang sedang login)
app.get("/api/me", (req, res) => {
  const me = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
  res.json(me);
});

// Logout (hapus token)
app.get("/api/logout", (_req, res) => {
  res.setHeader("Cache-Control", "no-store"); // khusus Vercel
  res.clearCookie("token");
  res.redirect("/login");
});

//======== Route CRUD ========

//Lapangan 1
app.get("/api/lapangan1", async (req, res) => {
  const results = await client.query(`SELECT * FROM lapangan1 order by id`);
  res.send(results.rows);
});
app.put("/api/lapangan1/edit/:kode", async (req, res) => {
  await client.query(
    `UPDATE lapangan1 SET nama ='${req.body.nama}', no_hp ='${req.body.no_hp}',status = 'Diboking', dp_lap = '${req.body.dp_lap}' WHERE kode = '${req.params.kode}'`
  );
  res.send("Data Boking Berhasil DiUpdate");
});
app.put("/api/lapangan1/editdelete/:kode", async (req, res) => {
  await client.query(
    `UPDATE lapangan1 SET nama =' ', no_hp =' ',status = 'Tersedia', dp_lap = ' ' WHERE kode = '${req.params.kode}'`
  );
  res.send("Data Boking Berhasil DiUpdate");
});

//Lapangan 2
app.get("/api/lapangan2", async (req, res) => {
  const results = await client.query(`SELECT * FROM lapangan2 order by id`);
  res.send(results.rows);
});
app.put("/api/lapangan2/edit/:kode", async (req, res) => {
  await client.query(
    `UPDATE lapangan2 SET nama ='${req.body.nama}', no_hp ='${req.body.no_hp}',status = 'Diboking', dp_lap = '${req.body.dp_lap}' WHERE kode = '${req.params.kode}'`
  );
  res.send("Data Boking Berhasil DiUpdate");
});
app.put("/api/lapangan2/editdelete/:kode", async (req, res) => {
  await client.query(
    `UPDATE lapangan2 SET nama =' ', no_hp =' ',status = 'Tersedia', dp_lap = ' ' WHERE kode = '${req.params.kode}'`
  );
  res.send("Data Boking Berhasil DiUpdate");
});

//Lapangan 3
app.get("/api/lapangan3", async (req, res) => {
  const results = await client.query(`SELECT * FROM lapangan3 order by id`);
  res.send(results.rows);
});
app.put("/api/lapangan3/edit/:kode", async (req, res) => {
  await client.query(
    `UPDATE lapangan3 SET nama ='${req.body.nama}', no_hp ='${req.body.no_hp}',status = 'Diboking', dp_lap = '${req.body.dp_lap}' WHERE kode = '${req.params.kode}'`
  );
  res.send("Data Boking Berhasil DiUpdate");
});
app.put("/api/lapangan3/editdelete/:kode", async (req, res) => {
  await client.query(
    `UPDATE lapangan3 SET nama =' ', no_hp =' ',status = 'Tersedia', dp_lap = ' ' WHERE kode = '${req.params.kode}'`
  );
  res.send("Data Boking Berhasil DiUpdate");
});

// Menambah Data Ke Table Booking sekaligus Menampilkan Riwayat Booking
app.post("/api/tambah/:kode", async (req, res) => {
  // console.log(req.body.status);
  await client.query(
    `INSERT INTO booking(nama,
      no_hp,
      harga,
      no_lap,
      status,
      waktu,
      dp_lap,kode) VALUES ('${req.body.nama}', '${req.body.nomor}', '${req.body.harga}', '${req.params.kode}', '${req.body.status}', '${req.body.waktu}', '${req.body.dp}','lapangan ${req.body.lapangKe}')`
  );
  res.send("Data telah ditambah");
});

app.get("/api/history", async (req, res) => {
  const historyBooking = await client.query(
    `SELECT nama, no_hp, kode, waktu, harga, dp_lap FROM booking`
  );
  res.send(historyBooking.rows);
});
app.put("/api/status/:id",async(req,res)=>{
  console.log(req.body);
  await client.query(`update ${req.body.lap} set status = 'Diboking' where id = ${req.params.id}`)
  res.status(200);
})
app.delete("/api/delete/:kode", async (req, res) => {
  await client.query(`DELETE FROM booking WHERE kode = '${req.params.kode}'`);
  res.send("Riwayat Telah Dihapus");
});

app.listen(3000, () => console.log("Berhasil Jalan"));
